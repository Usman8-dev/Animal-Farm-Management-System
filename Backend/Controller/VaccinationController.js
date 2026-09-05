import { VaccinationService } from '../services/vaccinationService.js';

const { AppError } = VaccinationService;

// ── Vaccination Types (master data) ──────────────────────────

const ListVaccinationTypes = async (req, res) => {
  try {
    const data = await VaccinationService.listVaccinationTypes({ farmId: req.user.farmId });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('ListVaccinationTypes error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const GetVaccinationType = async (req, res) => {
  try {
    const data = await VaccinationService.getVaccinationType({
      farmId: req.user.farmId,
      typeId: Number(req.params.id),
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('GetVaccinationType error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const CreateVaccinationType = async (req, res) => {
  try {
    const { code, name, description, is_active } = req.body;
    const data = await VaccinationService.createVaccinationType({
      farmId: req.user.farmId,
      code: code.trim(),
      name: name.trim(),
      description: description?.trim() || null,
      isActive: is_active,
      personId: req.user.id,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('CreateVaccinationType error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const UpdateVaccinationType = async (req, res) => {
  try {
    const { code, name, description, is_active } = req.body;
    const data = await VaccinationService.updateVaccinationType({
      farmId: req.user.farmId,
      typeId: Number(req.params.id),
      data: {
        code: code !== undefined ? code.trim() : undefined,
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? description?.trim() || null : undefined,
        is_active,
      },
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('UpdateVaccinationType error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const DeleteVaccinationType = async (req, res) => {
  try {
    await VaccinationService.softDeleteVaccinationType({
      farmId: req.user.farmId,
      typeId: Number(req.params.id),
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, message: 'Vaccination type deleted' });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('DeleteVaccinationType error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
// ── Schedule Rules (master data) ─────────────────────────────

const ListScheduleRules = async (req, res) => {
  try {
    const data = await VaccinationService.listScheduleRules({ farmId: req.user.farmId });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('ListScheduleRules error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const CreateScheduleRule = async (req, res) => {
  try {
    const { vaccination_type_id, animal_type_id, dose_number, age_days, notes } = req.body;
    const data = await VaccinationService.createScheduleRule({
      farmId: req.user.farmId,
      vaccinationTypeId: Number(vaccination_type_id),
      animalTypeId: Number(animal_type_id),
      doseNumber: Number(dose_number),
      ageDays: Number(age_days),
      notes: notes?.trim() || null,
      personId: req.user.id,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('CreateScheduleRule error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const UpdateScheduleRule = async (req, res) => {
  try {
    const data = await VaccinationService.updateScheduleRule({
      farmId: req.user.farmId,
      ruleId: Number(req.params.id),
      data: {
        vaccination_type_id: req.body.vaccination_type_id !== undefined ? Number(req.body.vaccination_type_id) : undefined,
        animal_type_id: req.body.animal_type_id !== undefined ? Number(req.body.animal_type_id) : undefined,
        dose_number: req.body.dose_number !== undefined ? Number(req.body.dose_number) : undefined,
        age_days: req.body.age_days !== undefined ? Number(req.body.age_days) : undefined,
        notes: req.body.notes,
      },
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('UpdateScheduleRule error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const DeleteScheduleRule = async (req, res) => {
  try {
    await VaccinationService.softDeleteScheduleRule({
      farmId: req.user.farmId,
      ruleId: Number(req.params.id),
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, message: 'Schedule rule deleted' });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('DeleteScheduleRule error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
// ── Administered doses ───────────────────────────────────────

const ListVaccinations = async (req, res) => {
  try {
    const data = await VaccinationService.listAllVaccinations({ farmId: req.user.farmId });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('ListVaccinations error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const ListAnimalVaccinations = async (req, res) => {
  try {
    const data = await VaccinationService.listAnimalVaccinations({
      farmId: req.user.farmId,
      animalId: Number(req.params.id),
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('ListAnimalVaccinations error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const CreateVaccination = async (req, res) => {
  try {
    const { animal_id, vaccination_type_id, category, administered_date, next_due_date, dose_number, batch_number, administered_by, cost, notes } = req.body;
    const data = await VaccinationService.createVaccination({
      farmId: req.user.farmId,
      animalId: Number(animal_id),
      vaccinationTypeId: Number(vaccination_type_id),
      category,
      administeredDate: administered_date || null,
      nextDueDate: next_due_date || null,
      doseNumber: dose_number,
      batchNumber: batch_number?.trim() || null,
      administeredBy: administered_by?.trim() || null,
      cost,
      notes: notes?.trim() || null,
      personId: req.user.id,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('CreateVaccination error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const UpdateVaccination = async (req, res) => {
  try {
    const data = await VaccinationService.updateVaccination({
      farmId: req.user.farmId,
      vaccId: Number(req.params.id),
      data: {
        animal_id: req.body.animal_id !== undefined ? Number(req.body.animal_id) : undefined,
        vaccination_type_id: req.body.vaccination_type_id !== undefined ? Number(req.body.vaccination_type_id) : undefined,
        category: req.body.category,
        administered_date: req.body.administered_date,
        next_due_date: req.body.next_due_date,
        dose_number: req.body.dose_number,
        batch_number: req.body.batch_number,
        administered_by: req.body.administered_by,
        cost: req.body.cost,
        notes: req.body.notes,
      },
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('UpdateVaccination error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const DeleteVaccination = async (req, res) => {
  try {
    await VaccinationService.softDeleteVaccination({
      farmId: req.user.farmId,
      vaccId: Number(req.params.id),
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, message: 'Vaccination record deleted' });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('DeleteVaccination error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
// ── Scheduling & Reports ─────────────────────────────────────

const GetDosesDue = async (req, res) => {
  try {
    const days = req.query.days ? Number(req.query.days) : 30;
    const data = await VaccinationService.dosesDue({ farmId: req.user.farmId, days });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('GetDosesDue error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const GetAnimalNextDue = async (req, res) => {
  try {
    const data = await VaccinationService.animalNextDue({
      farmId: req.user.farmId,
      animalId: Number(req.params.id),
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('GetAnimalNextDue error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const GetCompliance = async (req, res) => {
  try {
    const data = await VaccinationService.compliance({ farmId: req.user.farmId });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('GetCompliance error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const GetCost = async (req, res) => {
  try {
    const data = await VaccinationService.cost({
      farmId: req.user.farmId,
      from: req.query.from,
      to: req.query.to,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('GetCost error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const GetByBatch = async (req, res) => {
  try {
    const data = await VaccinationService.byBatch({
      farmId: req.user.farmId,
      batchNumber: req.params.batch,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('GetByBatch error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const GetSeasonal = async (req, res) => {
  try {
    const data = await VaccinationService.seasonalReport({ farmId: req.user.farmId });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('GetSeasonal error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export {
  ListVaccinationTypes,
  GetVaccinationType,
  CreateVaccinationType,
  UpdateVaccinationType,
  DeleteVaccinationType,
  ListScheduleRules,
  CreateScheduleRule,
  UpdateScheduleRule,
  DeleteScheduleRule,
  ListVaccinations,
  ListAnimalVaccinations,
  CreateVaccination,
  UpdateVaccination,
  DeleteVaccination,
  GetDosesDue,
  GetAnimalNextDue,
  GetCompliance,
  GetCost,
  GetByBatch,
  GetSeasonal,
};