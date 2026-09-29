import { HealthService } from '../services/healthService.js';

const { AppError } = HealthService;

const fail = (res, err, label) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  console.error(`${label} error:`, err);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

// ── Disease catalogue ────────────────────────────────────────

const ListDiseases = async (req, res) => {
  try {
    const data = await HealthService.listDiseases({
      farmId: req.user.farmId,
      includeInactive: req.query.include_inactive === 'true',
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'ListDiseases');
  }
};

const GetDisease = async (req, res) => {
  try {
    const data = await HealthService.getDisease({
      farmId: req.user.farmId,
      diseaseId: Number(req.params.id),
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'GetDisease');
  }
};

const CreateDisease = async (req, res) => {
  try {
    const { code, name, category, symptoms, description, is_contagious, is_active } = req.body;
    const data = await HealthService.createDisease({
      farmId: req.user.farmId,
      data: {
        code: code.trim(),
        name: name.trim(),
        category,
        symptoms: symptoms?.trim() || null,
        description: description?.trim() || null,
        is_contagious,
        is_active,
      },
      personId: req.user.id,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'CreateDisease');
  }
};

const UpdateDisease = async (req, res) => {
  try {
    const { code, name, category, symptoms, description, is_contagious, is_active } = req.body;
    const data = await HealthService.updateDisease({
      farmId: req.user.farmId,
      diseaseId: Number(req.params.id),
      data: {
        code: code !== undefined ? code.trim() : undefined,
        name: name !== undefined ? name.trim() : undefined,
        category,
        symptoms: symptoms !== undefined ? symptoms?.trim() || null : undefined,
        description: description !== undefined ? description?.trim() || null : undefined,
        is_contagious,
        is_active,
      },
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'UpdateDisease');
  }
};

const DeleteDisease = async (req, res) => {
  try {
    await HealthService.softDeleteDisease({
      farmId: req.user.farmId,
      diseaseId: Number(req.params.id),
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, message: 'Disease deleted' });
  } catch (err) {
    return fail(res, err, 'DeleteDisease');
  }
};

// ── Medicine catalogue ───────────────────────────────────────

const ListMedicines = async (req, res) => {
  try {
    const data = await HealthService.listMedicines({
      farmId: req.user.farmId,
      includeInactive: req.query.include_inactive === 'true',
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'ListMedicines');
  }
};

const CreateMedicine = async (req, res) => {
  try {
    const { code, name, unit, withdrawal_days, description, is_active } = req.body;
    const data = await HealthService.createMedicine({
      farmId: req.user.farmId,
      data: {
        code: code.trim(),
        name: name.trim(),
        unit: unit?.trim() || null,
        withdrawal_days,
        description: description?.trim() || null,
        is_active,
      },
      personId: req.user.id,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'CreateMedicine');
  }
};

const UpdateMedicine = async (req, res) => {
  try {
    const { code, name, unit, withdrawal_days, description, is_active } = req.body;
    const data = await HealthService.updateMedicine({
      farmId: req.user.farmId,
      medicineId: Number(req.params.id),
      data: {
        code: code !== undefined ? code.trim() : undefined,
        name: name !== undefined ? name.trim() : undefined,
        unit: unit !== undefined ? unit?.trim() || null : undefined,
        withdrawal_days,
        description: description !== undefined ? description?.trim() || null : undefined,
        is_active,
      },
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'UpdateMedicine');
  }
};

const DeleteMedicine = async (req, res) => {
  try {
    await HealthService.softDeleteMedicine({
      farmId: req.user.farmId,
      medicineId: Number(req.params.id),
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, message: 'Medicine deleted' });
  } catch (err) {
    return fail(res, err, 'DeleteMedicine');
  }
};

// ── Health cases ─────────────────────────────────────────────

const ListCases = async (req, res) => {
  try {
    const data = await HealthService.listCases({
      farmId: req.user.farmId,
      filters: {
        status: req.query.status,
        severity: req.query.severity,
        category: req.query.category,
        animal_id: req.query.animal_id,
        disease_id: req.query.disease_id,
        from: req.query.from,
        to: req.query.to,
      },
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'ListCases');
  }
};

const GetCase = async (req, res) => {
  try {
    const data = await HealthService.getCase({
      farmId: req.user.farmId,
      caseId: Number(req.params.id),
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'GetCase');
  }
};

const CreateCase = async (req, res) => {
  try {
    const b = req.body;
    const data = await HealthService.createCase({
      farmId: req.user.farmId,
      data: {
        animal_id: Number(b.animal_id),
        disease_id: b.disease_id ?? null,
        diagnosis: b.diagnosis?.trim() || null,
        category: b.category,
        severity: b.severity,
        status: b.status,
        diagnosed_on: b.diagnosed_on,
        diagnosed_by: b.diagnosed_by?.trim() || null,
        is_contagious: b.is_contagious,
        is_quarantined: b.is_quarantined,
        symptoms: b.symptoms?.trim() || null,
        notes: b.notes?.trim() || null,
      },
      personId: req.user.id,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'CreateCase');
  }
};

const UpdateCase = async (req, res) => {
  try {
    const b = req.body;
    const data = await HealthService.updateCase({
      farmId: req.user.farmId,
      caseId: Number(req.params.id),
      data: {
        animal_id: b.animal_id !== undefined ? Number(b.animal_id) : undefined,
        disease_id: b.disease_id !== undefined ? b.disease_id ?? null : undefined,
        diagnosis: b.diagnosis !== undefined ? b.diagnosis?.trim() || null : undefined,
        category: b.category,
        severity: b.severity,
        diagnosed_on: b.diagnosed_on,
        diagnosed_by: b.diagnosed_by !== undefined ? b.diagnosed_by?.trim() || null : undefined,
        is_contagious: b.is_contagious,
        is_quarantined: b.is_quarantined,
        symptoms: b.symptoms !== undefined ? b.symptoms?.trim() || null : undefined,
        notes: b.notes !== undefined ? b.notes?.trim() || null : undefined,
      },
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'UpdateCase');
  }
};

const ChangeCaseStatus = async (req, res) => {
  try {
    const { status, outcome_date, outcome_notes, is_quarantined } = req.body;
    const data = await HealthService.changeCaseStatus({
      farmId: req.user.farmId,
      caseId: Number(req.params.id),
      data: {
        status,
        outcome_date,
        outcome_notes: outcome_notes !== undefined ? outcome_notes?.trim() || null : undefined,
        is_quarantined,
      },
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'ChangeCaseStatus');
  }
};

const DeleteCase = async (req, res) => {
  try {
    await HealthService.softDeleteCase({
      farmId: req.user.farmId,
      caseId: Number(req.params.id),
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, message: 'Health case deleted' });
  } catch (err) {
    return fail(res, err, 'DeleteCase');
  }
};

// ── Treatments ───────────────────────────────────────────────

const AddTreatment = async (req, res) => {
  try {
    const b = req.body;
    const data = await HealthService.addTreatment({
      farmId: req.user.farmId,
      caseId: Number(req.params.id),
      data: {
        medicine_id: b.medicine_id ?? null,
        medicine_name: b.medicine_name?.trim() || null,
        dosage: b.dosage?.trim() || null,
        route: b.route,
        frequency: b.frequency?.trim() || null,
        start_date: b.start_date,
        end_date: b.end_date,
        administered_by: b.administered_by?.trim() || null,
        withdrawal_days: b.withdrawal_days,
        cost: b.cost,
        notes: b.notes?.trim() || null,
      },
      personId: req.user.id,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'AddTreatment');
  }
};

const UpdateTreatment = async (req, res) => {
  try {
    const b = req.body;
    const data = await HealthService.updateTreatment({
      farmId: req.user.farmId,
      treatmentId: Number(req.params.id),
      data: {
        medicine_id: b.medicine_id !== undefined ? b.medicine_id ?? null : undefined,
        medicine_name: b.medicine_name !== undefined ? b.medicine_name?.trim() || null : undefined,
        dosage: b.dosage !== undefined ? b.dosage?.trim() || null : undefined,
        route: b.route,
        frequency: b.frequency !== undefined ? b.frequency?.trim() || null : undefined,
        start_date: b.start_date,
        end_date: b.end_date,
        administered_by:
          b.administered_by !== undefined ? b.administered_by?.trim() || null : undefined,
        withdrawal_days: b.withdrawal_days,
        cost: b.cost,
        notes: b.notes !== undefined ? b.notes?.trim() || null : undefined,
      },
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'UpdateTreatment');
  }
};

const DeleteTreatment = async (req, res) => {
  try {
    const data = await HealthService.softDeleteTreatment({
      farmId: req.user.farmId,
      treatmentId: Number(req.params.id),
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'DeleteTreatment');
  }
};

// ── Animal-level health history ──────────────────────────────

const GetAnimalHealth = async (req, res) => {
  try {
    const data = await HealthService.animalHealth({
      farmId: req.user.farmId,
      animalId: Number(req.params.id),
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'GetAnimalHealth');
  }
};

// ── Reports ──────────────────────────────────────────────────

const GetOverview = async (req, res) => {
  try {
    const data = await HealthService.overview({ farmId: req.user.farmId });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'GetOverview');
  }
};

const GetDiseaseFrequency = async (req, res) => {
  try {
    const data = await HealthService.diseaseFrequency({
      farmId: req.user.farmId,
      from: req.query.from,
      to: req.query.to,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'GetDiseaseFrequency');
  }
};

const GetActiveCases = async (req, res) => {
  try {
    const data = await HealthService.activeCases({ farmId: req.user.farmId });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'GetActiveCases');
  }
};

const GetOutcomes = async (req, res) => {
  try {
    const data = await HealthService.outcomes({
      farmId: req.user.farmId,
      from: req.query.from,
      to: req.query.to,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'GetOutcomes');
  }
};

const GetTreatmentCost = async (req, res) => {
  try {
    const data = await HealthService.treatmentCost({
      farmId: req.user.farmId,
      from: req.query.from,
      to: req.query.to,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'GetTreatmentCost');
  }
};

const GetQuarantine = async (req, res) => {
  try {
    const data = await HealthService.quarantine({ farmId: req.user.farmId });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'GetQuarantine');
  }
};

const GetWithdrawal = async (req, res) => {
  try {
    const data = await HealthService.withdrawal({
      farmId: req.user.farmId,
      days: req.query.days ? Number(req.query.days) : 0,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err, 'GetWithdrawal');
  }
};

export {
  ListDiseases,
  GetDisease,
  CreateDisease,
  UpdateDisease,
  DeleteDisease,
  ListMedicines,
  CreateMedicine,
  UpdateMedicine,
  DeleteMedicine,
  ListCases,
  GetCase,
  CreateCase,
  UpdateCase,
  ChangeCaseStatus,
  DeleteCase,
  AddTreatment,
  UpdateTreatment,
  DeleteTreatment,
  GetAnimalHealth,
  GetOverview,
  GetDiseaseFrequency,
  GetActiveCases,
  GetOutcomes,
  GetTreatmentCost,
  GetQuarantine,
  GetWithdrawal,
};
