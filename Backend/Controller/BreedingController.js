import { BreedingService } from '../services/breedingService.js';

const { AppError } = BreedingService;

// ── Pregnancies ──────────────────────────────────────────────

const ListPregnancies = async (req, res) => {
  try {
    const data = await BreedingService.listPregnancies({ farmId: req.user.farmId });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('ListPregnancies error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const ListDamPregnancies = async (req, res) => {
  try {
    const data = await BreedingService.listDamPregnancies({
      farmId: req.user.farmId,
      animalId: Number(req.params.id),
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('ListDamPregnancies error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const GetPregnancy = async (req, res) => {
  try {
    const data = await BreedingService.getPregnancy({
      farmId: req.user.farmId,
      pregnancyId: Number(req.params.id),
    });
    if (!data) return res.status(404).json({ success: false, message: 'Pregnancy record not found' });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('GetPregnancy error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const CreatePregnancy = async (req, res) => {
  try {
    const { dam_id, sire_id, sire_ref, service_date, notes } = req.body;
    const data = await BreedingService.createPregnancy({
      farmId: req.user.farmId,
      damId: Number(dam_id),
      sireId: sire_id ? Number(sire_id) : null,
      sireRef: sire_ref?.trim() || null,
      serviceDate: service_date,
      notes: notes?.trim() || null,
      personId: req.user.id,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('CreatePregnancy error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const UpdatePregnancy = async (req, res) => {
  try {
    const data = await BreedingService.updatePregnancy({
      farmId: req.user.farmId,
      pregnancyId: Number(req.params.id),
      data: {
        sire_id: req.body.sire_id,
        sire_ref: req.body.sire_ref,
        service_date: req.body.service_date,
        notes: req.body.notes,
      },
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('UpdatePregnancy error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const ConfirmPregnancy = async (req, res) => {
  try {
    const data = await BreedingService.confirmPregnancy({
      farmId: req.user.farmId,
      pregnancyId: Number(req.params.id),
      confirmedDate: req.body.confirmed_date,
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('ConfirmPregnancy error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const ClosePregnancy = async (req, res) => {
  try {
    const data = await BreedingService.closePregnancy({
      farmId: req.user.farmId,
      pregnancyId: Number(req.params.id),
      outcome: req.body.outcome,
      outcomeDate: req.body.outcome_date,
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('ClosePregnancy error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const DeletePregnancy = async (req, res) => {
  try {
    await BreedingService.deletePregnancy({
      farmId: req.user.farmId,
      pregnancyId: Number(req.params.id),
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, message: 'Pregnancy record deleted successfully' });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('DeletePregnancy error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── Births & Kids ────────────────────────────────────────────

const CreateBirth = async (req, res) => {
  try {
    const { pregnancy_id, birth_date, notes } = req.body;
    const data = await BreedingService.createBirth({
      farmId: req.user.farmId,
      pregnancyId: Number(pregnancy_id),
      birthDate: birth_date,
      notes: notes?.trim() || null,
      personId: req.user.id,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('CreateBirth error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const GetBirth = async (req, res) => {
  try {
    const data = await BreedingService.getBirth({
      farmId: req.user.farmId,
      birthId: Number(req.params.id),
    });
    if (!data) return res.status(404).json({ success: false, message: 'Birth record not found' });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('GetBirth error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const AddKid = async (req, res) => {
  try {
    const data = await BreedingService.addKid({
      farmId: req.user.farmId,
      birthId: Number(req.params.id),
      isStillborn: !!req.body.is_stillborn,
      gender: req.body.gender?.trim() || null,
      weightKg: req.body.birth_weight_kg != null ? Number(req.body.birth_weight_kg) : null,
      notes: req.body.notes?.trim() || null,
      personId: req.user.id,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('AddKid error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const UpdateKid = async (req, res) => {
  try {
    const data = await BreedingService.updateKid({
      farmId: req.user.farmId,
      kidId: Number(req.params.id),
      data: {
        is_stillborn: req.body.is_stillborn,
        gender: req.body.gender,
        birth_weight_kg: req.body.birth_weight_kg,
        notes: req.body.notes,
      },
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('UpdateKid error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const RegisterKid = async (req, res) => {
  try {
    const { tag_number, name, gender_id, notes } = req.body;
    const data = await BreedingService.registerKid({
      farmId: req.user.farmId,
      kidId: Number(req.params.id),
      payload: { tag_number, name, gender_id, notes },
      personId: req.user.id,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('RegisterKid error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── Reports ──────────────────────────────────────────────────

const UpcomingDeliveries = async (req, res) => {
  try {
    const days = req.query.days ? Number(req.query.days) : 30;
    const data = await BreedingService.upcomingDeliveries({ farmId: req.user.farmId, days });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('UpcomingDeliveries error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const SuccessRate = async (req, res) => {
  try {
    const data = await BreedingService.successRate({ farmId: req.user.farmId });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('SuccessRate error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const BirthOutcomes = async (req, res) => {
  try {
    const data = await BreedingService.birthOutcomes({ farmId: req.user.farmId });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('BirthOutcomes error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const MaturityAlerts = async (req, res) => {
  try {
    const data = await BreedingService.maturityAlerts({ farmId: req.user.farmId });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) return res.status(err.statusCode).json({ success: false, message: err.message });
    console.error('MaturityAlerts error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export {
  ListPregnancies,
  ListDamPregnancies,
  GetPregnancy,
  CreatePregnancy,
  UpdatePregnancy,
  ConfirmPregnancy,
  ClosePregnancy,
  DeletePregnancy,
  CreateBirth,
  GetBirth,
  AddKid,
  UpdateKid,
  RegisterKid,
  UpcomingDeliveries,
  SuccessRate,
  BirthOutcomes,
  MaturityAlerts,
};