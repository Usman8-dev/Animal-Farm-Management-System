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

async function assertPregnancyOnFarm(pregnancyId, farmId) {
  const pregnancy = await prisma.pregnancy.findFirst({
    where: { id: pregnancyId, farm_id: farmId, deleted_at: null },
  });
  if (!pregnancy) throw new AppError('Pregnancy record not found', 404);
  return pregnancy;
}

async function assertBirthOnFarm(birthId, farmId) {
  const birth = await prisma.birth.findFirst({
    where: {
      id: birthId,
      deleted_at: null,
      pregnancy: { farm_id: farmId, deleted_at: null },
    },
  });
  if (!birth) throw new AppError('Birth record not found', 404);
  return birth;
}

async function assertKidOnFarm(kidId, farmId) {
  const kid = await prisma.birthKid.findFirst({
    where: {
      id: kidId,
      deleted_at: null,
      birth: { pregnancy: { farm_id: farmId, deleted_at: null } },
    },
  });
  if (!kid) throw new AppError('Birth kid record not found', 404);
  return kid;
}

/**
 * Best-effort: settle the dam's status history so confirming a service
 * moves her from its current status to "Pregnant" (if that status code
 * exists on the farm). Never throws — it must not block the main flow.
 */
async function settleReproductiveStatus({ animalId, farmId, effectiveFrom, personId }) {
  try {
    const target = await prisma.animalStatus.findFirst({
      where: { farm_id: farmId, code: 'PREGNANT', deleted_at: null },
    });
    if (!target) return;

    const open = await prisma.statusHistory.findFirst({
      where: { animal_id: animalId, effective_to: null, deleted_at: null },
      orderBy: { effective_from: 'desc' },
    });
    if (open) {
      await prisma.statusHistory.update({
        where: { id: open.id },
        data: { effective_to: effectiveFrom, updatedby: personId },
      });
    }
    await prisma.statusHistory.create({
      data: {
        animal_id: animalId,
        status_id: target.id,
        effective_from: effectiveFrom,
        createdby: personId,
      },
    });
  } catch (err) {
    console.error('settleReproductiveStatus skipped:', err.message);
  }
}

/**
 * Gestation length in days for a dam's breed, used to estimate the expected
 * delivery date when a service is recorded or its service date changes:
 *   1. The breed's own "Gestation (days)" value from Master Data, when set.
 *   2. Species fallback when it is missing or invalid:
 *      - Goats                    -> ~150 days (≈ 5 months)
 *      - Cattle / buffalo / other -> ~300 days (≈ 10 months)
 */
async function getPregnancyDuration(dam) {
  const breed = await prisma.breed.findFirst({
    where: { id: dam.breed_id },
    include: { animalType: true },
  });
  if (!breed) {
    throw new AppError("Dam's breed could not be resolved", 422);
  }

  // Prefer the value entered on the breed in Master Data.
  if (Number.isFinite(breed.gestation_days) && breed.gestation_days > 0) {
    return breed.gestation_days;
  }

  // Species-based fallback so the estimate stays predictable.
  const typeName = `${breed.animalType?.name || ""} ${breed.animalType?.code || ""}`.toLowerCase();

  if (typeName.includes("goat")) {
    return 150; // ≈ 5 months
  }
  return 300; // ≈ 10 months (default for cattle, buffalo, sheep, etc.)
}

// ── Pregnancies ──────────────────────────────────────────────

async function createPregnancy({
  farmId,
  damId,
  sireId,
  sireRef,
  serviceDate,
  notes,
  personId,
}) {
  const dam = await assertAnimalOnFarm(damId, farmId);

  let sire = null;
  if (sireId) sire = await assertAnimalOnFarm(sireId, farmId);
  if (!sireId && !sireRef?.trim()) {
    throw new AppError('A sire (registered animal or reference) is required', 422);
  }
  if (sireId && sireId === damId) {
    throw new AppError('A dam cannot be its own sire', 422);
  }

  const service = new Date(serviceDate);
  if (Number.isNaN(service.getTime())) throw new AppError('Invalid service_date', 422);

  // Reject overlapping / not-yet-closed pregnancy on the same active dam.
  const active = await prisma.pregnancy.findFirst({
    where: {
      dam_id: damId,
      outcome: null,
      deleted_at: null,
    },
  });
  if (active) {
    throw new AppError('This dam already has an open pregnancy record', 409);
  }

  const gestationDays = await getPregnancyDuration(dam);
  const expected = new Date(service.getTime() + gestationDays * 24 * 60 * 60 * 1000);

  return prisma.pregnancy.create({
    data: {
      farm_id: farmId,
      dam_id: damId,
      sire_id: sireId || null,
      sire_ref: sireRef?.trim() || null,
      service_date: service,
      expected_delivery_date: expected,
      notes: notes || null,
      createdby: personId,
    },
  });
}

async function listPregnancies({ farmId }) {
  return prisma.pregnancy.findMany({
    where: { farm_id: farmId, deleted_at: null },
    include: {
      dam: { select: { id: true, tag_number: true, name: true } },
      sire: { select: { id: true, tag_number: true, name: true } },
      birth: { select: { id: true, birth_date: true } },
    },
    orderBy: { service_date: 'desc' },
  });
}

async function listDamPregnancies({ farmId, animalId }) {
  await assertAnimalOnFarm(animalId, farmId);
  return prisma.pregnancy.findMany({
    where: { dam_id: animalId, farm_id: farmId, deleted_at: null },
    include: {
      sire: { select: { id: true, tag_number: true, name: true } },
    },
    orderBy: { service_date: 'desc' },
  });
}

async function getPregnancy({ farmId, pregnancyId }) {
  return await prisma.pregnancy.findFirst({
    where: { id: pregnancyId, farm_id: farmId, deleted_at: null },
    include: {
      dam: { select: { id: true, tag_number: true, name: true } },
      sire: { select: { id: true, tag_number: true, name: true } },
      birth: {
        include: {
          kids: { where: { deleted_at: null } },
        },
      },
    },
  });
}

async function updatePregnancy({ farmId, pregnancyId, data, personId }) {
  const preg = await assertPregnancyOnFarm(pregnancyId, farmId);

  const patch = { updatedby: personId };
  if (data.notes !== undefined) patch.notes = data.notes || null;

  if (preg.outcome === null && data.sire_id !== undefined) patch.sire_id = data.sire_id || null;
  if (preg.outcome === null && data.sire_ref !== undefined) patch.sire_ref = data.sire_ref || null;
  if (preg.outcome === null && data.service_date !== undefined) {
    const d = new Date(data.service_date);
    if (Number.isNaN(d.getTime())) throw new AppError('Invalid service_date', 422);
    patch.service_date = d;
    const dam = await assertAnimalOnFarm(preg.dam_id, farmId);
    const days = await getPregnancyDuration(dam);
    patch.expected_delivery_date = new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
  }

  return prisma.pregnancy.update({ where: { id: pregnancyId }, data: patch });
}

async function confirmPregnancy({ farmId, pregnancyId, confirmedDate, personId }) {
  const preg = await assertPregnancyOnFarm(pregnancyId, farmId);
  if (preg.outcome !== null) {
    throw new AppError('A closed pregnancy cannot be confirmed', 422);
  }
  const confirmed = confirmedDate ? new Date(confirmedDate) : new Date();
  if (Number.isNaN(confirmed.getTime())) throw new AppError('Invalid confirmed_date', 422);

  // The exact date provided at confirmation becomes the expected delivery
  // date, so the record is tracked in "Upcoming deliveries" from that day.
  const updated = await prisma.pregnancy.update({
    where: { id: pregnancyId },
    data: {
      is_confirmed: true,
      confirmed_date: confirmed,
      expected_delivery_date: confirmed,
      updatedby: personId,
    },
  });

  await settleReproductiveStatus({
    animalId: preg.dam_id,
    farmId,
    effectiveFrom: confirmed,
    personId,
  });

  return updated;
}

async function closePregnancy({ farmId, pregnancyId, outcome, outcomeDate, personId }) {
  const preg = await assertPregnancyOnFarm(pregnancyId, farmId);
  if (preg.outcome !== null) {
    throw new AppError('This pregnancy is already closed', 422);
  }
  const valid = ['LIVE_BIRTH', 'STILLBIRTH', 'ABORTED', 'NOT_PREGNANT'];
  if (!valid.includes(outcome)) throw new AppError('Invalid outcome', 422);

  const when = outcomeDate ? new Date(outcomeDate) : new Date();
  if (Number.isNaN(when.getTime())) throw new AppError('Invalid outcome_date', 422);

  return prisma.pregnancy.update({
    where: { id: pregnancyId },
    data: { outcome, outcome_date: when, updatedby: personId },
  });
}

async function deletePregnancy({ farmId, pregnancyId, personId }) {
  await assertPregnancyOnFarm(pregnancyId, farmId);

  // Soft delete, consistent with the rest of the app: the record stays in the
  // database but disappears from every list (they all filter deleted_at: null).
  return prisma.pregnancy.update({
    where: { id: pregnancyId },
    data: { deleted_at: new Date(), deletedby: personId },
  });
}

async function createBirth({ farmId, pregnancyId, birthDate, notes, personId }) {
  await assertPregnancyOnFarm(pregnancyId, farmId);
  const existing = await prisma.birth.findFirst({
    where: { pregnancy_id: pregnancyId, deleted_at: null },
  });
  if (existing) throw new AppError('A birth is already recorded for this pregnancy', 409);

  const bd = birthDate ? new Date(birthDate) : new Date();
  if (Number.isNaN(bd.getTime())) throw new AppError('Invalid birth_date', 422);

  return prisma.$transaction(async (tx) => {
    const birth = await tx.birth.create({
      data: {
        pregnancy_id: pregnancyId,
        birth_date: bd,
        notes: notes || null,
        createdby: personId,
      },
    });
    // Recording a birth closes out the pregnancy.
    await tx.pregnancy.update({
      where: { id: pregnancyId },
      data: { outcome: 'LIVE_BIRTH', outcome_date: bd, updatedby: personId },
    });
    return tx.birth.findUnique({
      where: { id: birth.id },
      include: { kids: { where: { deleted_at: null } } },
    });
  });
}

async function getBirth({ farmId, birthId }) {
  return await prisma.birth.findFirst({
    where: { id: birthId, deleted_at: null, pregnancy: { farm_id: farmId } },
    include: {
      pregnancy: {
        include: {
          dam: { select: { id: true, tag_number: true, name: true } },
          sire: { select: { id: true, tag_number: true, name: true } },
        },
      },
      kids: {
        where: { deleted_at: null },
        include: { animal: { select: { id: true, tag_number: true } } },
      },
    },
  });
}

async function addKid({ farmId, birthId, isStillborn, gender, weightKg, notes, personId }) {
  await assertBirthOnFarm(birthId, farmId);
  return prisma.birthKid.create({
    data: {
      birth_id: birthId,
      is_stillborn: !!isStillborn,
      gender: gender || null,
      birth_weight_kg: weightKg != null ? weightKg : null,
      notes: notes || null,
      createdby: personId,
    },
  });
}

async function updateKid({ farmId, kidId, data, personId }) {
  await assertKidOnFarm(kidId, farmId);
  const patch = { updatedby: personId };
  if (data.is_stillborn !== undefined) patch.is_stillborn = !!data.is_stillborn;
  if (data.gender !== undefined) patch.gender = data.gender || null;
  if (data.birth_weight_kg !== undefined) {
    patch.birth_weight_kg = data.birth_weight_kg == null ? null : Number(data.birth_weight_kg);
  }
  if (data.notes !== undefined) patch.notes = data.notes || null;
  return prisma.birthKid.update({ where: { id: kidId }, data: patch });
}

// Auto-register a kid as a new farm animal (BORN_IN_FARM).
async function registerKid({ farmId, kidId, payload, personId }) {
  const kid = await assertKidOnFarm(kidId, farmId);
  if (kid.animal_id) throw new AppError('This kid is already registered as an animal', 409);

  const birth = await prisma.birth.findUnique({
    where: { id: kid.birth_id },
    include: { pregnancy: { include: { dam: true } } },
  });
  const dam = birth.pregnancy.dam;

  const tag = payload.tag_number?.trim();
  if (!tag) throw new AppError('tag_number is required to register the animal', 422);
  const dup = await prisma.animal.findFirst({
    where: { farm_id: farmId, tag_number: tag, deleted_at: null },
  });
  if (dup) throw new AppError('An animal with this tag number already exists on this farm', 409);

  const gender = await prisma.gender.findFirst({
    where: { id: Number(payload.gender_id), farm_id: farmId },
  });
  if (!gender) throw new AppError('gender_id is invalid on this farm', 422);

  const newAnimal = await prisma.animal.create({
    data: {
      farm_id: farmId,
      tag_number: tag,
      name: payload.name?.trim() || null,
      animal_type_id: dam.animal_type_id,
      breed_id: dam.breed_id,
      gender_id: gender.id,
      birth_date: birth.birth_date,
      mother_id: dam.id,
      father_id: birth.pregnancy.sire_id,
      acquisition_type: 'BORN_IN_FARM',
      acquired_on: birth.birth_date,
      notes: payload.notes?.trim() || null,
      createdby: personId,
    },
  });

  await prisma.birthKid.update({
    where: { id: kidId },
    data: { animal_id: newAnimal.id, is_stillborn: false, updatedby: personId },
  });
  return newAnimal;
}

// ── Reports & Analytics ──────────────────────────────────────

async function upcomingDeliveries({ farmId, days = 30 }) {
  const now = new Date();
  const horizon = new Date(now.getTime() + Number(days) * 24 * 60 * 60 * 1000);

  // Unconfirmed pregnancies are included too: they stay listed with an
  // "Expected Delivery" status until someone confirms, after which the
  // date provided at confirmation drives the expected delivery date.
  const rows = await prisma.pregnancy.findMany({
    where: {
      farm_id: farmId,
      outcome: null,
      expected_delivery_date: { lte: horizon },
      deleted_at: null,
    },
    include: {
      dam: { select: { id: true, tag_number: true, name: true } },
    },
    orderBy: { expected_delivery_date: 'asc' },
  });

  return rows
    .filter((r) => r.dam) // pragmatic guard
    .map((r) => ({
      pregnancy_id: r.id,
      dam: r.dam,
      expected_delivery_date: r.expected_delivery_date,
      service_date: r.service_date,
      is_confirmed: r.is_confirmed,
      confirmed_date: r.confirmed_date,
    }));
}

async function successRate({ farmId }) {
  const pregnancies = await prisma.pregnancy.findMany({
    where: { farm_id: farmId, deleted_at: null },
    select: { is_confirmed: true, outcome: true },
  });

  const total = pregnancies.length;
  const confirmed = pregnancies.filter((p) => p.is_confirmed || p.outcome !== null).length;
  let liveBirths = 0;
  let stillbirths = 0;
  let aborted = 0;
  let notPregnant = 0;

  for (const p of pregnancies) {
    if (p.outcome === 'LIVE_BIRTH') liveBirths += 1;
    else if (p.outcome === 'STILLBIRTH') stillbirths += 1;
    else if (p.outcome === 'ABORTED') aborted += 1;
    else if (p.outcome === 'NOT_PREGNANT') notPregnant += 1;
  }

  return {
    total,
    confirmed,
    rate: total ? Math.round((confirmed / total) * 1000) / 10 : 0,
    live_births: liveBirths,
    stillbirths,
    aborted,
    not_pregnant: notPregnant,
  };
}

async function birthOutcomes({ farmId }) {
  const births = await prisma.birth.findMany({
    where: { pregnancy: { farm_id: farmId, deleted_at: null }, deleted_at: null },
    include: {
      kids: { where: { deleted_at: null }, select: { is_stillborn: true } },
    },
  });

  let totalKids = 0;
  let liveKids = 0;
  const litterSizes = [];

  for (const b of births) {
    const n = b.kids.length;
    totalKids += n;
    liveKids += b.kids.filter((k) => !k.is_stillborn).length;
    if (n > 0) litterSizes.push(n);
  }

  const sum = litterSizes.reduce((a, c) => a + c, 0);
  return {
    births: births.length,
    total_kids: totalKids,
    live_kids: liveKids,
    stillborn_kids: totalKids - liveKids,
    avg_litter_size: litterSizes.length ? Math.round((sum / litterSizes.length) * 100) / 100 : 0,
  };
}

async function maturityAlerts({ farmId }) {
  const animals = await prisma.animal.findMany({
    where: { farm_id: farmId, deleted_at: null },
    include: { breed: { select: { maturity_days: true, name: true } } },
  });

  const now = new Date();
  const DAY = 24 * 60 * 60 * 1000;
  const alerts = [];

  for (const a of animals) {
    if (!a.birth_date || !a.breed?.maturity_days) continue;
    const ageDays = Math.floor((now - new Date(a.birth_date)) / DAY);
    const remaining = a.breed.maturity_days - ageDays;
    if (remaining <= 30) {
      alerts.push({
        animal_id: a.id,
        tag_number: a.tag_number,
        name: a.name,
        breed: a.breed.name,
        age_days: ageDays,
        maturity_days: a.breed.maturity_days,
        days_until_maturity: Math.max(0, remaining),
      });
    }
  }

  alerts.sort((x, y) => x.days_until_maturity - y.days_until_maturity);
  return alerts;
}

export const BreedingService = {
  AppError,
  createPregnancy,
  listPregnancies,
  listDamPregnancies,
  getPregnancy,
  updatePregnancy,
  confirmPregnancy,
  closePregnancy,
  deletePregnancy,
  createBirth,
  getBirth,
  addKid,
  updateKid,
  registerKid,
  upcomingDeliveries,
  successRate,
  birthOutcomes,
  maturityAlerts,
};