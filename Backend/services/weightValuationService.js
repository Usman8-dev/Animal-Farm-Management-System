import prisma from '../prisma/client.js';

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function assertAnimalOnFarm(animalId, farmId) {
  const animal = await prisma.animal.findFirst({
    where: { id: animalId, farm_id: farmId, deleted_at: null },
  });
  if (!animal) throw new AppError('Animal not found', 404);
  return animal;
}

async function addWeight({
  farmId,
  animalId,
  weightKg,
  effectiveFrom,
  source,
  notes,
  personId,
}) {
  await assertAnimalOnFarm(animalId, farmId);

  const fromDate = effectiveFrom ? new Date(effectiveFrom) : new Date();
  if (Number.isNaN(fromDate.getTime())) {
    throw new AppError('Invalid effective_from date', 422);
  }

  return prisma.weightHistory.create({
    data: {
      animal_id: animalId,
      weight_kg: weightKg,
      effective_from: fromDate,
      source: source || null,
      notes: notes || null,
      createdby: personId,
    //   updatedby: personId,
    },
  });
}

async function updateWeight({ farmId, weightId, data, personId }) {
  const existing = await prisma.weightHistory.findFirst({
    where: { id: weightId, deleted_at: null },
    include: { animal: { select: { farm_id: true, deleted_at: true } } },
  });

  if (
    !existing ||
    existing.animal.deleted_at ||
    existing.animal.farm_id !== farmId
  ) {
    throw new AppError('Weight record not found', 404);
  }

  const patch = { updatedby: personId };
  if (data.weight_kg !== undefined) patch.weight_kg = data.weight_kg;
  if (data.source !== undefined) patch.source = data.source || null;
  if (data.notes !== undefined) patch.notes = data.notes || null;
  if (data.effective_from !== undefined) {
    const d = new Date(data.effective_from);
    if (Number.isNaN(d.getTime())) throw new AppError('Invalid effective_from date', 422);
    patch.effective_from = d;
  }

  return prisma.weightHistory.update({
    where: { id: weightId },
    data: patch,
  });
}

async function softDeleteWeight({ farmId, weightId, personId }) {
  const existing = await prisma.weightHistory.findFirst({
    where: { id: weightId, deleted_at: null },
    include: { animal: { select: { farm_id: true, deleted_at: true } } },
  });

  if (
    !existing ||
    existing.animal.deleted_at ||
    existing.animal.farm_id !== farmId
  ) {
    throw new AppError('Weight record not found', 404);
  }

  return prisma.weightHistory.update({
    where: { id: weightId },
    data: { deleted_at: new Date(), deletedby: personId },
  });
}

async function listWeights({ farmId, animalId }) {
  await assertAnimalOnFarm(animalId, farmId);
  return prisma.weightHistory.findMany({
    where: { animal_id: animalId, deleted_at: null },
    orderBy: { effective_from: 'desc' },
  });
}

async function addValuation({
  farmId,
  animalId,
  valueAmount,
  basis,
  effectiveFrom,
  notes,
  personId,
}) {
  await assertAnimalOnFarm(animalId, farmId);

  const fromDate = effectiveFrom ? new Date(effectiveFrom) : new Date();
  if (Number.isNaN(fromDate.getTime())) {
    throw new AppError('Invalid effective_from date', 422);
  }

  return prisma.animalValuation.create({
    data: {
      animal_id: animalId,
      value_amount: valueAmount,
      basis: basis || null,
      effective_from: fromDate,
      notes: notes || null,
      createdby: personId,
    //   updatedby: personId,
    },
  });
}

async function updateValuation({ farmId, valuationId, data, personId }) {
  const existing = await prisma.animalValuation.findFirst({
    where: { id: valuationId, deleted_at: null },
    include: { animal: { select: { farm_id: true, deleted_at: true } } },
  });

  if (
    !existing ||
    existing.animal.deleted_at ||
    existing.animal.farm_id !== farmId
  ) {
    throw new AppError('Valuation record not found', 404);
  }

  const patch = { updatedby: personId };
  if (data.value_amount !== undefined) patch.value_amount = data.value_amount;
  if (data.basis !== undefined) patch.basis = data.basis || null;
  if (data.notes !== undefined) patch.notes = data.notes || null;
  if (data.effective_from !== undefined) {
    const d = new Date(data.effective_from);
    if (Number.isNaN(d.getTime())) throw new AppError('Invalid effective_from date', 422);
    patch.effective_from = d;
  }

  return prisma.animalValuation.update({
    where: { id: valuationId },
    data: patch,
  });
}

async function softDeleteValuation({ farmId, valuationId, personId }) {
  const existing = await prisma.animalValuation.findFirst({
    where: { id: valuationId, deleted_at: null },
    include: { animal: { select: { farm_id: true, deleted_at: true } } },
  });

  if (
    !existing ||
    existing.animal.deleted_at ||
    existing.animal.farm_id !== farmId
  ) {
    throw new AppError('Valuation record not found', 404);
  }

  return prisma.animalValuation.update({
    where: { id: valuationId },
    data: { deleted_at: new Date(), deletedby: personId },
  });
}

async function listValuations({ farmId, animalId }) {
  await assertAnimalOnFarm(animalId, farmId);
  return prisma.animalValuation.findMany({
    where: { animal_id: animalId, deleted_at: null },
    orderBy: { effective_from: 'desc' },
  });
}

/** Latest valuation per animal on the farm → total herd value */
async function totalHerdValue({ farmId }) {
  const animals = await prisma.animal.findMany({
    where: { farm_id: farmId, deleted_at: null },
    select: { id: true, tag_number: true, name: true },
  });

  let total = 0;
  const breakdown = [];

  for (const a of animals) {
    const latest = await prisma.animalValuation.findFirst({
      where: { animal_id: a.id, deleted_at: null },
      orderBy: { effective_from: 'desc' },
    });
    if (latest) {
      const amount = Number(latest.value_amount);
      total += amount;
      breakdown.push({
        animal_id: a.id,
        tag_number: a.tag_number,
        name: a.name,
        value_amount: amount,
        effective_from: latest.effective_from,
        basis: latest.basis,
      });
    }
  }

  return { total, count: breakdown.length, animals: breakdown };
}

async function growthTrend({ farmId, animalId }) {
  await assertAnimalOnFarm(animalId, farmId);
  const rows = await prisma.weightHistory.findMany({
    where: { animal_id: animalId, deleted_at: null },
    orderBy: { effective_from: 'asc' },
    select: {
      id: true,
      weight_kg: true,
      effective_from: true,
      source: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    weight_kg: Number(r.weight_kg),
    effective_from: r.effective_from,
    source: r.source,
  }));
}

/**
 * Farm-wide weight & valuation overview. For every animal on the farm it
 * resolves the latest weight and latest valuation so the dashboard can draw
 * summary cards and herd-level bar charts without N+1 calls from the client.
 */
async function herdOverview({ farmId }) {
  const animals = await prisma.animal.findMany({
    where: { farm_id: farmId, deleted_at: null },
    select: { id: true, tag_number: true, name: true },
    orderBy: { tag_number: 'asc' },
  });

  const breakdown = [];
  let totalValue = 0;
  let valuedAnimals = 0;
  let weightedAnimals = 0;
  let weightSum = 0;

  for (const a of animals) {
    const [latestWeight, latestValue] = await Promise.all([
      prisma.weightHistory.findFirst({
        where: { animal_id: a.id, deleted_at: null },
        orderBy: { effective_from: 'desc' },
      }),
      prisma.animalValuation.findFirst({
        where: { animal_id: a.id, deleted_at: null },
        orderBy: { effective_from: 'desc' },
      }),
    ]);

    const w = latestWeight ? Number(latestWeight.weight_kg) : null;
    const v = latestValue ? Number(latestValue.value_amount) : null;

    if (w != null) {
      weightedAnimals += 1;
      weightSum += w;
    }
    if (v != null) {
      valuedAnimals += 1;
      totalValue += v;
    }

    breakdown.push({
      animal_id: a.id,
      tag_number: a.tag_number,
      name: a.name,
      latest_weight: w,
      latest_weight_date: latestWeight ? latestWeight.effective_from : null,
      latest_value: v,
      latest_value_date: latestValue ? latestValue.effective_from : null,
    });
  }

  return {
    totalAnimals: animals.length,
    totalHerdValue: totalValue,
    valuedAnimals,
    weightedAnimals,
    avgLatestWeight: weightedAnimals ? weightSum / weightedAnimals : null,
    animals: breakdown,
  };
}

export const WeightValuationService = {
  AppError,
  addWeight,
  updateWeight,
  softDeleteWeight,
  listWeights,
  addValuation,
  updateValuation,
  softDeleteValuation,
  listValuations,
  totalHerdValue,
  growthTrend,
  herdOverview,
};