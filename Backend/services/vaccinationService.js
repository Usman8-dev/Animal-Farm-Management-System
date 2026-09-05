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

async function assertVaccinationTypeOnFarm(typeId, farmId) {
  const t = await prisma.vaccinationType.findFirst({
    where: { id: typeId, farm_id: farmId, deleted_at: null },
  });
  if (!t) throw new AppError('Vaccination type not found', 404);
  return t;
}

async function assertVaccinationOnFarm(vaccId, farmId) {
  const v = await prisma.animalVaccination.findFirst({
    where: { id: vaccId, farm_id: farmId, deleted_at: null },
  });
  if (!v) throw new AppError('Vaccination record not found', 404);
  return v;
}

// ── Vaccination Types (master data) ──────────────────────────

async function listVaccinationTypes({ farmId }) {
  return prisma.vaccinationType.findMany({
    where: { farm_id: farmId, deleted_at: null },
    orderBy: { name: 'asc' },
  });
}

async function getVaccinationType({ farmId, typeId }) {
  const t = await prisma.vaccinationType.findFirst({
    where: { id: typeId, farm_id: farmId, deleted_at: null },
    include: {
      scheduleRules: {
        where: { deleted_at: null },
        include: { animalType: { select: { id: true, name: true } } },
        orderBy: [{ animalType: { name: 'asc' } }, { dose_number: 'asc' }],
      },
    },
  });
  if (!t) throw new AppError('Vaccination type not found', 404);
  return t;
}

async function createVaccinationType({ farmId, code, name, description, isActive, personId }) {
  const existing = await prisma.vaccinationType.findFirst({
    where: { farm_id: farmId, code },
  });
  if (existing) throw new AppError('Vaccination type code already exists', 409);

  return prisma.vaccinationType.create({
    data: {
      farm_id: farmId,
      code,
      name,
      description: description || null,
      is_active: isActive ?? true,
      createdby: personId,
    },
  });
}
async function updateVaccinationType({ farmId, typeId, data, personId }) {
  await assertVaccinationTypeOnFarm(typeId, farmId);

  if (data.code) {
    const taken = await prisma.vaccinationType.findFirst({
      where: { farm_id: farmId, code: data.code, NOT: { id: typeId } },
    });
    if (taken) throw new AppError('Vaccination type code already exists', 409);
  }

  const patch = { updatedby: personId };
  if (data.code !== undefined) patch.code = data.code;
  if (data.name !== undefined) patch.name = data.name;
  if (data.description !== undefined) patch.description = data.description || null;
  if (data.is_active !== undefined) patch.is_active = data.is_active;

  return prisma.vaccinationType.update({ where: { id: typeId }, data: patch });
}

async function softDeleteVaccinationType({ farmId, typeId, personId }) {
  await assertVaccinationTypeOnFarm(typeId, farmId);

  const inUse = await prisma.animalVaccination.findFirst({
    where: { vaccination_type_id: typeId, deleted_at: null },
  });
  if (inUse) {
    throw new AppError('Cannot delete a vaccination type that already has doses recorded', 409);
  }

  return prisma.vaccinationType.update({
    where: { id: typeId },
    data: { deleted_at: new Date(), deletedby: personId },
  });
}

// ── Vaccination Schedule Rules (master data) ─────────────────

async function listScheduleRules({ farmId }) {
  return prisma.vaccinationScheduleRule.findMany({
    where: { farm_id: farmId, deleted_at: null },
    include: {
      vaccinationType: { select: { id: true, name: true, code: true } },
      animalType: { select: { id: true, name: true } },
    },
    orderBy: [{ vaccinationType: { name: 'asc' } }, { dose_number: 'asc' }],
  });
}
async function createScheduleRule({
  farmId,
  vaccinationTypeId,
  animalTypeId,
  doseNumber,
  ageDays,
  notes,
  personId,
}) {
  await assertVaccinationTypeOnFarm(vaccinationTypeId, farmId);
  const animalType = await prisma.animalType.findFirst({
    where: { id: animalTypeId, farm_id: farmId, deleted_at: null },
  });
  if (!animalType) throw new AppError('Animal type not found', 404);

  const existing = await prisma.vaccinationScheduleRule.findFirst({
    where: {
      farm_id: farmId,
      vaccination_type_id: vaccinationTypeId,
      animal_type_id: animalTypeId,
      dose_number: doseNumber,
    },
  });
  if (existing) {
    throw new AppError('A schedule rule for this vaccine, animal type and dose already exists', 409);
  }

  return prisma.vaccinationScheduleRule.create({
    data: {
      farm_id: farmId,
      vaccination_type_id: vaccinationTypeId,
      animal_type_id: animalTypeId,
      dose_number: doseNumber,
      age_days: ageDays,
      notes: notes || null,
      createdby: personId,
    },
  });
}

async function updateScheduleRule({ farmId, ruleId, data, personId }) {
  const rule = await prisma.vaccinationScheduleRule.findFirst({
    where: { id: ruleId, farm_id: farmId, deleted_at: null },
  });
  if (!rule) throw new AppError('Schedule rule not found', 404);

  if (data.dose_number !== undefined || data.vaccination_type_id !== undefined || data.animal_type_id !== undefined) {
    const dup = await prisma.vaccinationScheduleRule.findFirst({
      where: {
        farm_id: farmId,
        vaccination_type_id: data.vaccination_type_id ?? rule.vaccination_type_id,
        animal_type_id: data.animal_type_id ?? rule.animal_type_id,
        dose_number: data.dose_number ?? rule.dose_number,
        NOT: { id: ruleId },
      },
    });
    if (dup) throw new AppError('A schedule rule for this vaccine, animal type and dose already exists', 409);
  }

  const patch = { updatedby: personId };
  if (data.vaccination_type_id !== undefined) {
    await assertVaccinationTypeOnFarm(data.vaccination_type_id, farmId);
    patch.vaccination_type_id = data.vaccination_type_id;
  }
  if (data.animal_type_id !== undefined) {
    const at = await prisma.animalType.findFirst({
      where: { id: data.animal_type_id, farm_id: farmId, deleted_at: null },
    });
    if (!at) throw new AppError('Animal type not found', 404);
    patch.animal_type_id = data.animal_type_id;
  }
  if (data.dose_number !== undefined) patch.dose_number = data.dose_number;
  if (data.age_days !== undefined) patch.age_days = data.age_days;
  if (data.notes !== undefined) patch.notes = data.notes || null;

  return prisma.vaccinationScheduleRule.update({ where: { id: ruleId }, data: patch });
}

async function softDeleteScheduleRule({ farmId, ruleId, personId }) {
  const rule = await prisma.vaccinationScheduleRule.findFirst({
    where: { id: ruleId, farm_id: farmId, deleted_at: null },
  });
  if (!rule) throw new AppError('Schedule rule not found', 404);

  return prisma.vaccinationScheduleRule.update({
    where: { id: ruleId },
    data: { deleted_at: new Date(), deletedby: personId },
  });
}
// ── Administered doses (AnimalVaccination) ───────────────────

async function createVaccination({
  farmId,
  animalId,
  vaccinationTypeId,
  category,
  administeredDate,
  nextDueDate,
  doseNumber,
  batchNumber,
  administeredBy,
  cost,
  notes,
  personId,
}) {
  const animal = await assertAnimalOnFarm(animalId, farmId);
  const type = await assertVaccinationTypeOnFarm(vaccinationTypeId, farmId);

  const cat = String(category || 'NORMAL').trim().toUpperCase();
  if (!['NORMAL', 'SEASONAL'].includes(cat)) throw new AppError('category must be NORMAL or SEASONAL', 422);

  const date = administeredDate ? new Date(administeredDate) : new Date();
  if (Number.isNaN(date.getTime())) throw new AppError('Invalid administered date', 422);

  // The due date is entered by the user (no automatic calculation).
  let dueDate = null;
  if (nextDueDate) {
    dueDate = new Date(nextDueDate);
    if (Number.isNaN(dueDate.getTime())) throw new AppError('Invalid due date', 422);
  }

  return {
    record: await prisma.animalVaccination.create({
      data: {
        farm_id: farmId,
        animal_id: animalId,
        vaccination_type_id: vaccinationTypeId,
        category: cat,
        administered_date: date,
        dose_number: doseNumber ? Number(doseNumber) : null,
        batch_number: batchNumber || null,
        administered_by: administeredBy || null,
        cost: cost !== undefined && cost !== null && cost !== '' ? Number(cost) : null,
        next_due_date: dueDate,
        notes: notes || null,
        createdby: personId,
      },
    }),
    type: { id: type.id, name: type.name, code: type.code },
  };
}
async function listAnimalVaccinations({ farmId, animalId }) {
  await assertAnimalOnFarm(animalId, farmId);
  return prisma.animalVaccination.findMany({
    where: { animal_id: animalId, deleted_at: null },
    include: { vaccinationType: { select: { id: true, name: true, code: true } } },
    orderBy: { administered_date: 'desc' },
  });
}

async function listAllVaccinations({ farmId }) {
  return prisma.animalVaccination.findMany({
    where: { farm_id: farmId, deleted_at: null },
    include: {
      animal: { select: { id: true, tag_number: true, name: true } },
      vaccinationType: { select: { id: true, name: true, code: true } },
    },
    orderBy: { administered_date: 'desc' },
  });
}

async function updateVaccination({ farmId, vaccId, data, personId }) {
  const existing = await assertVaccinationOnFarm(vaccId, farmId);

  const patch = { updatedby: personId };

  if (data.animal_id !== undefined) {
    await assertAnimalOnFarm(data.animal_id, farmId);
    patch.animal_id = data.animal_id;
  }
  if (data.vaccination_type_id !== undefined) {
    await assertVaccinationTypeOnFarm(data.vaccination_type_id, farmId);
    patch.vaccination_type_id = data.vaccination_type_id;
  }
  if (data.administered_date !== undefined) {
    const d = new Date(data.administered_date);
    if (Number.isNaN(d.getTime())) throw new AppError('Invalid administered date', 422);
    patch.administered_date = d;
  }
  if (data.next_due_date !== undefined) {
    if (data.next_due_date === null || data.next_due_date === '') {
      patch.next_due_date = null;
    } else {
      const d = new Date(data.next_due_date);
      if (Number.isNaN(d.getTime())) throw new AppError('Invalid due date', 422);
      patch.next_due_date = d;
    }
  }
  if (data.category !== undefined) {
    const cat = String(data.category || 'NORMAL').trim().toUpperCase();
    if (!['NORMAL', 'SEASONAL'].includes(cat)) throw new AppError('category must be NORMAL or SEASONAL', 422);
    patch.category = cat;
  }
  if (data.dose_number !== undefined) patch.dose_number = data.dose_number ? Number(data.dose_number) : null;
  if (data.batch_number !== undefined) patch.batch_number = data.batch_number || null;
  if (data.administered_by !== undefined) patch.administered_by = data.administered_by || null;
  if (data.notes !== undefined) patch.notes = data.notes || null;
  if (data.cost !== undefined) {
    patch.cost = data.cost === '' || data.cost == null ? null : Number(data.cost);
  }

  return prisma.animalVaccination.update({ where: { id: vaccId }, data: patch });
}

async function softDeleteVaccination({ farmId, vaccId, personId }) {
  await assertVaccinationOnFarm(vaccId, farmId);
  return prisma.animalVaccination.update({
    where: { id: vaccId },
    data: { deleted_at: new Date(), deletedby: personId },
  });
}
// ── Scheduling (due / overdue) ───────────────────────────────

async function dosesDue({ farmId, days = 30, category }) {
  const now = new Date();
  const DAY = 24 * 60 * 60 * 1000;
  const windowEnd = new Date(now.getTime() + Number(days) * DAY);

  // Due/overdue is driven by the due date the user entered on each
  // vaccination record (next_due_date) — no automatic calculation.
  const where = {
    farm_id: farmId,
    deleted_at: null,
    next_due_date: { not: null, lte: windowEnd },
    animal: { deleted_at: null },
  };
  if (category) {
    const cat = String(category).trim().toUpperCase();
    if (cat === 'NORMAL' || cat === 'SEASONAL') where.category = cat;
  }
  const records = await prisma.animalVaccination.findMany({
    where,
    include: {
      animal: {
        select: {
          id: true,
          tag_number: true,
          name: true,
          breed: { select: { name: true } },
          animalType: { select: { name: true } },
        },
      },
      vaccinationType: { select: { id: true, name: true } },
    },
    orderBy: { next_due_date: 'asc' },
  });

  return records.map((r) => {
    const due = new Date(r.next_due_date).valueOf();
    return {
      animal_id: r.animal.id,
      tag_number: r.animal.tag_number,
      name: r.animal.name,
      breed: r.animal.breed?.name,
      animal_type: r.animal.animalType?.name,
      vaccination_type_id: r.vaccination_type_id,
      vaccine: r.vaccinationType.name,
      category: r.category,
      dose_number: r.dose_number,
      due_date: new Date(due),
      days_from_now: Math.ceil((due - now.valueOf()) / DAY),
    };
  });
}

async function animalNextDue({ farmId, animalId }) {
  await assertAnimalOnFarm(animalId, farmId);
  const records = await prisma.animalVaccination.findMany({
    where: {
      animal_id: animalId,
      deleted_at: null,
      next_due_date: { not: null },
    },
    include: { vaccinationType: { select: { id: true, name: true } } },
    orderBy: { next_due_date: 'asc' },
  });

  return records.map((r) => ({
    vaccination_type_id: r.vaccination_type_id,
    vaccine: r.vaccinationType.name,
    dose_number: r.dose_number,
    next_due_date: r.next_due_date,
  }));
}
// ── Reports ──────────────────────────────────────────────────

async function compliance({ farmId }) {
  const animals = await prisma.animal.findMany({
    where: { farm_id: farmId, deleted_at: null },
    select: {
      id: true,
      tag_number: true,
      animal_type_id: true,
      vaccinations: {
        where: { deleted_at: null },
        select: { vaccination_type_id: true, dose_number: true },
      },
    },
  });
  const rules = await prisma.vaccinationScheduleRule.findMany({
    where: { farm_id: farmId, deleted_at: null },
  });

  let upToDate = 0;
  let withSchedule = 0;
  const breakdown = [];

  for (const a of animals) {
    const aRules = rules.filter((r) => r.animal_type_id === a.animal_type_id);
    if (!aRules.length) continue;
    withSchedule += 1;

    const complete = aRules.every((r) =>
      a.vaccinations.some(
        (v) => v.vaccination_type_id === r.vaccination_type_id && v.dose_number === r.dose_number
      )
    );
    if (complete) upToDate += 1;
    breakdown.push({
      animal_id: a.id,
      tag_number: a.tag_number,
      completed_doses: a.vaccinations.filter((v) =>
        aRules.some((r) => r.vaccination_type_id === v.vaccination_type_id && r.dose_number === v.dose_number)
      ).length,
      required_doses: aRules.length,
      up_to_date: complete,
    });
  }

  return {
    total_animals: animals.length,
    scheduled_animals: withSchedule,
    up_to_date,
    rate: withSchedule ? Math.round((upToDate / withSchedule) * 1000) / 10 : 0,
    breakdown,
  };
}

async function cost({ farmId, from, to }) {
  const where = { farm_id: farmId, deleted_at: null, cost: { not: null } };
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  if (fromDate && !Number.isNaN(fromDate.getTime())) where.administered_date = { gte: fromDate };
  if (toDate && !Number.isNaN(toDate.getTime())) {
    where.administered_date = { ...(where.administered_date || {}), lte: toDate };
  }

  const rows = await prisma.animalVaccination.findMany({
    where,
    include: {
      animal: { select: { id: true, tag_number: true, name: true } },
      vaccinationType: { select: { id: true, name: true } },
    },
    orderBy: { administered_date: 'asc' },
  });

  let total = 0;
  const byType = {};
  for (const r of rows) {
    const c = Number(r.cost);
    total += c;
    const key = r.vaccinationType.name;
    byType[key] = (byType[key] || 0) + c;
  }

  return {
    total_cost: total,
    dose_count: rows.length,
    by_vaccine_type: Object.entries(byType).map(([name, c]) => ({ name, cost: Math.round(c * 100) / 100 })),
    records: rows.map((r) => ({
      id: r.id,
      animal_id: r.animal_id,
      tag_number: r.animal.tag_number,
      name: r.animal.name,
      vaccine: r.vaccinationType.name,
      cost: Number(r.cost),
      administered_date: r.administered_date,
      batch_number: r.batch_number,
    })),
  };
}

async function byBatch({ farmId, batchNumber }) {
  return prisma.animalVaccination.findMany({
    where: { farm_id: farmId, deleted_at: null, batch_number: batchNumber },
    include: {
      animal: { select: { id: true, tag_number: true, name: true } },
      vaccinationType: { select: { id: true, name: true, code: true } },
    },
    orderBy: { administered_date: 'asc' },
  });
}

async function seasonalReport({ farmId }) {
  const doses = await prisma.animalVaccination.findMany({
    where: { farm_id: farmId, deleted_at: null, category: 'SEASONAL' },
    include: {
      animal: { select: { id: true, tag_number: true, name: true } },
      vaccinationType: { select: { id: true, name: true } },
    },
    orderBy: { administered_date: 'desc' },
  });

  return {
    total: doses.length,
    unique_animals: new Set(doses.map((d) => d.animal_id)).size,
    last_date: doses.length ? doses[0].administered_date : null,
    doses: doses.map((d) => ({
      id: d.id,
      animal_id: d.animal_id,
      tag_number: d.animal?.tag_number,
      name: d.animal?.name,
      vaccine: d.vaccinationType?.name,
      dose_number: d.dose_number,
      administered_date: d.administered_date,
      next_due_date: d.next_due_date,
      batch_number: d.batch_number,
      cost: d.cost == null ? null : Number(d.cost),
    })),
  };
}

export const VaccinationService = {
  AppError,
  listVaccinationTypes,
  getVaccinationType,
  createVaccinationType,
  updateVaccinationType,
  softDeleteVaccinationType,
  listScheduleRules,
  createScheduleRule,
  updateScheduleRule,
  softDeleteScheduleRule,
  createVaccination,
  listAnimalVaccinations,
  listAllVaccinations,
  updateVaccination,
  softDeleteVaccination,
  dosesDue,
  animalNextDue,
  compliance,
  cost,
  byBatch,
  seasonalReport,
};