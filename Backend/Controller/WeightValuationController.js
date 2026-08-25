import { WeightValuationService } from '../services/weightValuationService.js';

const { AppError } = WeightValuationService;

// ── Weights ──────────────────────────────────────────────────

const ListWeights = async (req, res) => {
  try {
    const data = await WeightValuationService.listWeights({
      farmId: req.user.farmId,
      animalId: Number(req.params.id),
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error('ListWeights error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const AddWeight = async (req, res) => {
  try {
    const { weight_kg, effective_from, source, notes } = req.body;
    const data = await WeightValuationService.addWeight({
      farmId: req.user.farmId,
      animalId: Number(req.params.id),
      weightKg: Number(weight_kg),
      effectiveFrom: effective_from || null,
      source: source?.trim() || null,
      notes: notes?.trim() || null,
      personId: req.user.id,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error('AddWeight error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const UpdateWeight = async (req, res) => {
  try {
    const data = await WeightValuationService.updateWeight({
      farmId: req.user.farmId,
      weightId: Number(req.params.id),
      data: {
        weight_kg:
          req.body.weight_kg !== undefined ? Number(req.body.weight_kg) : undefined,
        effective_from: req.body.effective_from,
        source: req.body.source,
        notes: req.body.notes,
      },
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error('UpdateWeight error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const DeleteWeight = async (req, res) => {
  try {
    await WeightValuationService.softDeleteWeight({
      farmId: req.user.farmId,
      weightId: Number(req.params.id),
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, message: 'Weight record deleted' });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error('DeleteWeight error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── Valuations ───────────────────────────────────────────────

const ListValuations = async (req, res) => {
  try {
    const data = await WeightValuationService.listValuations({
      farmId: req.user.farmId,
      animalId: Number(req.params.id),
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error('ListValuations error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const AddValuation = async (req, res) => {
  try {
    const { value_amount, basis, effective_from, notes } = req.body;
    const data = await WeightValuationService.addValuation({
      farmId: req.user.farmId,
      animalId: Number(req.params.id),
      valueAmount: Number(value_amount),
      basis: basis?.trim() || null,
      effectiveFrom: effective_from || null,
      notes: notes?.trim() || null,
      personId: req.user.id,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error('AddValuation error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const UpdateValuation = async (req, res) => {
  try {
    const data = await WeightValuationService.updateValuation({
      farmId: req.user.farmId,
      valuationId: Number(req.params.id),
      data: {
        value_amount:
          req.body.value_amount !== undefined
            ? Number(req.body.value_amount)
            : undefined,
        basis: req.body.basis,
        effective_from: req.body.effective_from,
        notes: req.body.notes,
      },
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error('UpdateValuation error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const DeleteValuation = async (req, res) => {
  try {
    await WeightValuationService.softDeleteValuation({
      farmId: req.user.farmId,
      valuationId: Number(req.params.id),
      personId: req.user.id,
    });
    return res.status(200).json({ success: true, message: 'Valuation deleted' });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error('DeleteValuation error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── Reports ──────────────────────────────────────────────────

const GetGrowthTrend = async (req, res) => {
  try {
    const animalId = Number(req.query.animal_id);
    const data = await WeightValuationService.growthTrend({
      farmId: req.user.farmId,
      animalId,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error('GetGrowthTrend error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const GetTotalHerdValue = async (req, res) => {
  try {
    const data = await WeightValuationService.totalHerdValue({
      farmId: req.user.farmId,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('GetTotalHerdValue error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const GetHerdOverview = async (req, res) => {
  try {
    const data = await WeightValuationService.herdOverview({
      farmId: req.user.farmId,
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('GetHerdOverview error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export {
  ListWeights,
  AddWeight,
  UpdateWeight,
  DeleteWeight,
  ListValuations,
  AddValuation,
  UpdateValuation,
  DeleteValuation,
  GetGrowthTrend,
  GetTotalHerdValue,
  GetHerdOverview,
};