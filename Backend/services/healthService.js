import prisma from '../prisma/client.js';

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// ── Guards ───────────────────────────────────────────────────

async function assertAnimalOnFarm(animalId, farmId) {
  const animal = await prisma.animal.findFirst({
    where: { id: animalId, farm_id: farmId, deleted_at: null },
    select: { id: true, tag_number: true, name: true },
  });
  if (!animal) throw new AppError('Animal not found', 404);
  return animal;
}

async function assertDiseaseOnFarm(diseaseId, farmId) {
  const disease = await prisma.disease.findFirst({
    where: { id: diseaseId, farm_id: farmId, deleted_at: null },
  });
  if (!disease) throw new AppError('Disease not found', 404);
  return disease;
}

async function assertMedicineOnFarm(medicineId, farmId) {
  const medicine = await prisma.medicine.findFirst({
    where: { id: medicineId, farm_id: farmId, deleted_at: null },
  });
  if (!medicine) throw new AppError('Medicine not found', 404);
  return medicine;
}

async function assertCaseOnFarm(caseId, farmId) {
  const healthCase = await prisma.healthCase.findFirst({
    where: { id: caseId, farm_id: farmId, deleted_at: null },
  });
  if (!healthCase) throw new AppError('Health case not found', 404);
  return healthCase;
}

async function assertTreatmentOnFarm(treatmentId, farmId) {
  const treatment = await prisma.healthTreatment.findFirst({
    where: { id: treatmentId, farm_id: farmId, deleted_at: null },
  });
  if (!treatment) throw new AppError('Treatment not found', 404);
  return treatment;
}

const CASE_OPEN_STATUSES = ['OPEN', 'UNDER_TREATMENT'];
const CASE_CLOSED_STATUSES = ['RECOVERED', 'DIED', 'CULLED'];
const CASE_FINAL_STATUSES = ['DIED', 'CULLED'];

const dayDiff = (from, to) => {
  if (!from || !to) return null;
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.floor((b - a) / 86400000);
};

const addDays = (date, days) => {
  if (date == null || days == null) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + Number(days));
  return d;
};

// A treatment's withdrawal period starts when the course ends (or its first
// dose when no end date was entered).
const computeWithdrawalEnd = ({ end_date, start_date, withdrawal_days }) => {
  if (withdrawal_days == null) return null;
  return addDays(end_date || start_date, withdrawal_days);
};

const activeOrClosed = (status) =>
  CASE_OPEN_STATUSES.includes(status) ? 'active' : 'closed';

const shapeCase = (row) => {
  const treatments = row.treatments || [];
  const treatmentCost = treatments.reduce((sum, t) => sum + Number(t.cost || 0), 0);
  const effectiveOutcomeDate = row.outcome_date || (row.deleted_at ? null : null);
  return {
    id: row.id,
    animal_id: row.animal_id,
    tag_number: row.animal?.tag_number ?? null,
    animal_name: row.animal?.name ?? null,
    animal_type: row.animal?.animalType?.name ?? null,
    breed: row.animal?.breed?.name ?? null,
    disease_id: row.disease_id,
    diagnosis: row.diagnosis,
    category: row.category,
    severity: row.severity,
    status: row.status,
    state: activeOrClosed(row.status),
    diagnosed_on: row.diagnosed_on,
    diagnosed_by: row.diagnosed_by,
    is_contagious: row.is_contagious,
    is_quarantined: row.is_quarantined,
    symptoms: row.symptoms,
    notes: row.notes,
    outcome_date: row.outcome_date,
    outcome_notes: row.outcome_notes,
    open_days: CASE_OPEN_STATUSES.includes(row.status)
      ? dayDiff(row.diagnosed_on, new Date())
      : dayDiff(row.diagnosed_on, row.outcome_date),
    treatment_count: treatments.length,
    treatment_cost: Math.round(treatmentCost * 100) / 100,
    last_treatment_on: treatments.length
      ? treatments.reduce(
          (latest, t) => (!latest || new Date(t.start_date) > new Date(latest) ? t.start_date : latest),
          null
        )
      : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

const shapeTreatment = (row) => ({
  id: row.id,
  case_id: row.case_id,
  medicine_id: row.medicine_id,
  medicine_name: row.medicine?.name || row.medicine_name || null,
  medicine_unit: row.medicine?.unit || null,
  dosage: row.dosage,
  route: row.route,
  frequency: row.frequency,
  start_date: row.start_date,
  end_date: row.end_date,
  administered_by: row.administered_by,
  withdrawal_days: row.withdrawal_days,
  withdrawal_end_date: row.withdrawal_end_date,
  cost: row.cost == null ? null : Number(row.cost),
  notes: row.notes,
});

const caseInclude = {
  animal: {
    select: {
      id: true,
      tag_number: true,
      name: true,
      animalType: { select: { name: true } },
      breed: { select: { name: true } },
    },
  },
  treatments: {
    where: { deleted_at: null },
    include: { medicine: { select: { id: true, name: true, unit: true } } },
    orderBy: { start_date: 'asc' },
  },
};

// ── Disease catalogue ────────────────────────────────────────

async function listDiseases({ farmId, includeInactive = false }) {
  const where = { farm_id: farmId, deleted_at: null };
  if (!includeInactive) where.is_active = true;

  const rows = await prisma.disease.findMany({ where, orderBy: [{ name: 'asc' }] });

  const counts = await prisma.healthCase.groupBy({
    by: ['disease_id'],
    where: { farm_id: farmId, deleted_at: null },
    _count: { _all: true },
  });
  const countMap = new Map(counts.map((c) => [c.disease_id, c._count._all]));

  return rows.map((r) => ({ ...r, case_count: countMap.get(r.id) || 0 }));
}

async function getDisease({ farmId, diseaseId }) {
  const disease = await prisma.disease.findFirst({
    where: { id: diseaseId, farm_id: farmId, deleted_at: null },
  });
  if (!disease) throw new AppError('Disease not found', 404);

  const cases = await prisma.healthCase.findMany({
    where: { farm_id: farmId, disease_id: diseaseId, deleted_at: null },
    include: caseInclude,
    orderBy: { diagnosed_on: 'desc' },
  });

  return { ...disease, cases: cases.map(shapeCase) };
}

async function createDisease({ farmId, data, personId }) {
  const existing = await prisma.disease.findFirst({ where: { farm_id: farmId, code: data.code } });
  if (existing) throw new AppError('Disease code already exists', 409);

  return prisma.disease.create({
    data: {
      farm_id: farmId,
      code: data.code,
      name: data.name,
      category: data.category || 'OTHER',
      symptoms: data.symptoms ?? null,
      description: data.description ?? null,
      is_contagious: data.is_contagious ?? false,
      is_active: data.is_active ?? true,
      createdby: personId,
    },
  });
}

async function updateDisease({ farmId, diseaseId, data, personId }) {
  await assertDiseaseOnFarm(diseaseId, farmId);

  if (data.code) {
    const taken = await prisma.disease.findFirst({
      where: { farm_id: farmId, code: data.code, NOT: { id: diseaseId } },
    });
    if (taken) throw new AppError('Disease code already exists', 409);
  }

  const patch = { updatedby: personId };
  if (data.code !== undefined) patch.code = data.code;
  if (data.name !== undefined) patch.name = data.name;
  if (data.category !== undefined) patch.category = data.category || 'OTHER';
  if (data.symptoms !== undefined) patch.symptoms = data.symptoms || null;
  if (data.description !== undefined) patch.description = data.description || null;
  if (data.is_contagious !== undefined) patch.is_contagious = data.is_contagious;
  if (data.is_active !== undefined) patch.is_active = data.is_active;

  return prisma.disease.update({ where: { id: diseaseId }, data: patch });
}

async function softDeleteDisease({ farmId, diseaseId, personId }) {
  await assertDiseaseOnFarm(diseaseId, farmId);

  const inUse = await prisma.healthCase.findFirst({ where: { disease_id: diseaseId, deleted_at: null } });
  if (inUse) {
    throw new AppError('Cannot delete a disease used by health cases — mark it inactive instead.', 409);
  }

  return prisma.disease.update({
    where: { id: diseaseId },
    data: { deleted_at: new Date(), deletedby: personId },
  });
}

// ── Medicine catalogue ───────────────────────────────────────

async function listMedicines({ farmId, includeInactive = false }) {
  const where = { farm_id: farmId, deleted_at: null };
  if (!includeInactive) where.is_active = true;

  const rows = await prisma.medicine.findMany({ where, orderBy: [{ name: 'asc' }] });

  const counts = await prisma.healthTreatment.groupBy({
    by: ['medicine_id'],
    where: { farm_id: farmId, deleted_at: null },
    _count: { _all: true },
  });
  const countMap = new Map(counts.map((c) => [c.medicine_id, c._count._all]));

  return rows.map((r) => ({ ...r, treatment_count: countMap.get(r.id) || 0 }));
}

async function createMedicine({ farmId, data, personId }) {
  const existing = await prisma.medicine.findFirst({ where: { farm_id: farmId, code: data.code } });
  if (existing) throw new AppError('Medicine code already exists', 409);

  return prisma.medicine.create({
    data: {
      farm_id: farmId,
      code: data.code,
      name: data.name,
      unit: data.unit ?? null,
      withdrawal_days: data.withdrawal_days ?? null,
      description: data.description ?? null,
      is_active: data.is_active ?? true,
      createdby: personId,
    },
  });
}

async function updateMedicine({ farmId, medicineId, data, personId }) {
  await assertMedicineOnFarm(medicineId, farmId);

  if (data.code) {
    const taken = await prisma.medicine.findFirst({
      where: { farm_id: farmId, code: data.code, NOT: { id: medicineId } },
    });
    if (taken) throw new AppError('Medicine code already exists', 409);
  }

  const patch = { updatedby: personId };
  if (data.code !== undefined) patch.code = data.code;
  if (data.name !== undefined) patch.name = data.name;
  if (data.unit !== undefined) patch.unit = data.unit || null;
  if (data.withdrawal_days !== undefined) patch.withdrawal_days = data.withdrawal_days;
  if (data.description !== undefined) patch.description = data.description || null;
  if (data.is_active !== undefined) patch.is_active = data.is_active;

  return prisma.medicine.update({ where: { id: medicineId }, data: patch });
}

async function softDeleteMedicine({ farmId, medicineId, personId }) {
  await assertMedicineOnFarm(medicineId, farmId);

  const inUse = await prisma.healthTreatment.findFirst({
    where: { medicine_id: medicineId, deleted_at: null },
  });
  if (inUse) {
    throw new AppError('Cannot delete a medicine used by treatments — mark it inactive instead.', 409);
  }

  return prisma.medicine.update({
    where: { id: medicineId },
    data: { deleted_at: new Date(), deletedby: personId },
  });
}

// ── Health cases ─────────────────────────────────────────────

const caseWhere = ({ farmId, status, severity, category, animal_id, disease_id, from, to }) => {
  const where = { farm_id: farmId, deleted_at: null };
  if (status) where.status = status;
  if (severity) where.severity = severity;
  if (category) where.category = category;
  if (animal_id) where.animal_id = Number(animal_id);
  if (disease_id) where.disease_id = Number(disease_id);
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  if (fromDate && !Number.isNaN(fromDate.getTime())) where.diagnosed_on = { gte: fromDate };
  if (toDate && !Number.isNaN(toDate.getTime())) {
    where.diagnosed_on = { ...(where.diagnosed_on || {}), lte: toDate };
  }
  return where;
};

async function listCases({ farmId, filters = {} }) {
  const rows = await prisma.healthCase.findMany({
    where: caseWhere({ farmId, ...filters }),
    include: caseInclude,
    orderBy: [{ diagnosed_on: 'desc' }, { id: 'desc' }],
  });
  return rows.map(shapeCase);
}

async function getCase({ farmId, caseId }) {
  const row = await prisma.healthCase.findFirst({
    where: { id: caseId, farm_id: farmId, deleted_at: null },
    include: caseInclude,
  });
  if (!row) throw new AppError('Health case not found', 404);

  return {
    ...shapeCase(row),
    treatments: row.treatments.map(shapeTreatment),
  };
}

async function createCase({ farmId, data, personId }) {
  await assertAnimalOnFarm(data.animal_id, farmId);

  const disease = data.disease_id ? await assertDiseaseOnFarm(data.disease_id, farmId) : null;
  const diagnosis = (data.diagnosis || '').trim() || disease?.name;
  if (!diagnosis) throw new AppError('Provide a diagnosis or select a disease', 422);

  const created = await prisma.healthCase.create({
    data: {
      farm_id: farmId,
      animal_id: data.animal_id,
      disease_id: data.disease_id ?? null,
      diagnosis,
      category: data.category || disease?.category || 'OTHER',
      severity: data.severity || 'MODERATE',
      status: data.status || 'OPEN',
      diagnosed_on: data.diagnosed_on ? new Date(data.diagnosed_on) : new Date(),
      diagnosed_by: data.diagnosed_by ?? null,
      is_contagious:
        data.is_contagious !== undefined ? data.is_contagious : disease?.is_contagious ?? false,
      is_quarantined: data.is_quarantined ?? false,
      symptoms: data.symptoms ?? null,
      notes: data.notes ?? null,
      createdby: personId,
    },
  });

  return getCase({ farmId, caseId: created.id });
}

async function updateCase({ farmId, caseId, data, personId }) {
  const existing = await assertCaseOnFarm(caseId, farmId);

  if (data.animal_id !== undefined) await assertAnimalOnFarm(data.animal_id, farmId);

  const disease = data.disease_id ? await assertDiseaseOnFarm(data.disease_id, farmId) : null;

  const patch = { updatedby: personId };
  if (data.animal_id !== undefined) patch.animal_id = data.animal_id;
  if (data.disease_id !== undefined) {
    patch.disease_id = data.disease_id ?? null;
    // keep the stored wording/category in step with the catalogue entry
    if (data.diagnosis === undefined) patch.diagnosis = data.disease_id ? disease?.name : existing.diagnosis;
    if (data.category === undefined) patch.category = data.disease_id ? disease?.category : 'OTHER';
    if (data.is_contagious === undefined) patch.is_contagious = data.disease_id ? disease?.is_contagious : existing.is_contagious;
  }
  if (data.diagnosis !== undefined) patch.diagnosis = data.diagnosis || existing.diagnosis;
  if (data.category !== undefined) patch.category = data.category || 'OTHER';
  if (data.severity !== undefined) patch.severity = data.severity || 'MODERATE';
  if (data.diagnosed_on !== undefined) patch.diagnosed_on = new Date(data.diagnosed_on);
  if (data.diagnosed_by !== undefined) patch.diagnosed_by = data.diagnosed_by || null;
  if (data.is_contagious !== undefined) patch.is_contagious = data.is_contagious;
  if (data.is_quarantined !== undefined) patch.is_quarantined = data.is_quarantined;
  if (data.symptoms !== undefined) patch.symptoms = data.symptoms || null;
  if (data.notes !== undefined) patch.notes = data.notes || null;

  await prisma.healthCase.update({ where: { id: caseId }, data: patch });
  return getCase({ farmId, caseId });
}

async function changeCaseStatus({ farmId, caseId, data, personId }) {
  const existing = await assertCaseOnFarm(caseId, farmId);
  const reopening = CASE_OPEN_STATUSES.includes(data.status);

  const patch = { status: data.status, updatedby: personId };

  if (reopening) {
    // reopening clears the previous outcome
    patch.outcome_date = null;
    patch.outcome_notes = null;
  } else {
    patch.outcome_date = data.outcome_date
      ? new Date(data.outcome_date)
      : existing.outcome_date || new Date();
    if (data.outcome_notes !== undefined) patch.outcome_notes = data.outcome_notes || null;
  }

  if (CASE_CLOSED_STATUSES.includes(data.status)) {
    // recovered / died / culled → isolation is lifted
    patch.is_quarantined = data.is_quarantined ?? false;
  } else if (data.is_quarantined !== undefined) {
    patch.is_quarantined = data.is_quarantined;
  }

  await prisma.healthCase.update({ where: { id: caseId }, data: patch });
  return getCase({ farmId, caseId });
}

async function softDeleteCase({ farmId, caseId, personId }) {
  await assertCaseOnFarm(caseId, farmId);
  const now = new Date();

  await prisma.healthTreatment.updateMany({
    where: { case_id: caseId, deleted_at: null },
    data: { deleted_at: now, deletedby: personId },
  });

  return prisma.healthCase.update({
    where: { id: caseId },
    data: { deleted_at: now, deletedby: personId },
  });
}

// ── Treatments ───────────────────────────────────────────────

const treatmentInclude = { medicine: { select: { id: true, name: true, unit: true } } };

async function addTreatment({ farmId, caseId, data, personId }) {
  const healthCase = await assertCaseOnFarm(caseId, farmId);
  const medicine = data.medicine_id ? await assertMedicineOnFarm(data.medicine_id, farmId) : null;
  const name = (data.medicine_name || '').trim() || medicine?.name;
  if (!name) throw new AppError('Provide a medicine or a medicine name', 422);

  const start_date = data.start_date ? new Date(data.start_date) : new Date();
  const end_date = data.end_date ? new Date(data.end_date) : null;
  if (end_date && end_date < start_date) throw new AppError('end_date cannot be before start_date', 422);

  const withdrawal_days = data.withdrawal_days ?? medicine?.withdrawal_days ?? null;

  const created = await prisma.healthTreatment.create({
    data: {
      farm_id: farmId,
      case_id: caseId,
      medicine_id: data.medicine_id ?? null,
      medicine_name: data.medicine_id ? null : name,
      dosage: data.dosage ?? null,
      route: data.route ?? null,
      frequency: data.frequency ?? null,
      start_date,
      end_date,
      administered_by: data.administered_by ?? null,
      withdrawal_days,
      withdrawal_end_date: computeWithdrawalEnd({ end_date, start_date, withdrawal_days }),
      cost: data.cost ?? null,
      notes: data.notes ?? null,
      createdby: personId,
    },
    include: treatmentInclude,
  });

  // A case that starts receiving treatment is no longer merely "OPEN".
  if (healthCase.status === 'OPEN') {
    await prisma.healthCase.update({
      where: { id: caseId },
      data: { status: 'UNDER_TREATMENT', updatedby: personId },
    });
  }

  return shapeTreatment(created);
}

async function updateTreatment({ farmId, treatmentId, data, personId }) {
  const existing = await assertTreatmentOnFarm(treatmentId, farmId);
  if (data.medicine_id) await assertMedicineOnFarm(data.medicine_id, farmId);

  const patch = { updatedby: personId };
  if (data.medicine_id !== undefined) {
    patch.medicine_id = data.medicine_id ?? null;
    if (data.medicine_id) patch.medicine_name = null;
  }
  if (data.medicine_name !== undefined) patch.medicine_name = data.medicine_name || null;
  if (data.dosage !== undefined) patch.dosage = data.dosage || null;
  if (data.route !== undefined) patch.route = data.route || null;
  if (data.frequency !== undefined) patch.frequency = data.frequency || null;
  if (data.start_date !== undefined) patch.start_date = new Date(data.start_date);
  if (data.end_date !== undefined) patch.end_date = data.end_date ? new Date(data.end_date) : null;
  if (data.administered_by !== undefined) patch.administered_by = data.administered_by || null;
  if (data.withdrawal_days !== undefined) patch.withdrawal_days = data.withdrawal_days;
  if (data.cost !== undefined) patch.cost = data.cost;
  if (data.notes !== undefined) patch.notes = data.notes || null;

  // recompute the clearance date from the merged values
  const merged = {
    start_date: patch.start_date ?? existing.start_date,
    end_date: patch.end_date !== undefined ? patch.end_date : existing.end_date,
    withdrawal_days:
      patch.withdrawal_days !== undefined ? patch.withdrawal_days : existing.withdrawal_days,
  };
  if (merged.end_date && new Date(merged.end_date) < new Date(merged.start_date)) {
    throw new AppError('end_date cannot be before start_date', 422);
  }
  patch.withdrawal_end_date = computeWithdrawalEnd(merged);

  const saved = await prisma.healthTreatment.update({
    where: { id: treatmentId },
    data: patch,
    include: treatmentInclude,
  });
  return shapeTreatment(saved);
}

async function softDeleteTreatment({ farmId, treatmentId, personId }) {
  const existing = await assertTreatmentOnFarm(treatmentId, farmId);

  await prisma.healthTreatment.update({
    where: { id: treatmentId },
    data: { deleted_at: new Date(), deletedby: personId },
  });

  const remaining = await prisma.healthTreatment.count({
    where: { case_id: existing.case_id, deleted_at: null },
  });

  // Last treatment removed → the case goes back to plain "OPEN".
  if (remaining === 0) {
    const healthCase = await assertCaseOnFarm(existing.case_id, farmId);
    if (healthCase.status === 'UNDER_TREATMENT') {
      await prisma.healthCase.update({
        where: { id: existing.case_id },
        data: { status: 'OPEN', updatedby: personId },
      });
    }
  }

  return { id: treatmentId, remaining_treatments: remaining };
}

// ── Animal health history ────────────────────────────────────

async function animalHealth({ farmId, animalId }) {
  const animal = await assertAnimalOnFarm(animalId, farmId);

  const cases = await prisma.healthCase.findMany({
    where: { farm_id: farmId, animal_id: animalId, deleted_at: null },
    include: caseInclude,
    orderBy: { diagnosed_on: 'desc' },
  });

  const shaped = cases.map(shapeCase);
  const treatments = cases.flatMap((c) => (c.treatments || []).map(shapeTreatment));
  const now = Date.now();
  const inWithdrawal = treatments.filter(
    (t) => t.withdrawal_end_date && new Date(t.withdrawal_end_date).getTime() >= now
  );

  return {
    animal: { id: animal.id, tag_number: animal.tag_number, name: animal.name },
    summary: {
      total_cases: shaped.length,
      open_cases: shaped.filter((c) => c.state === 'active').length,
      quarantined: shaped.some((c) => c.is_quarantined && c.state === 'active'),
      chronic_cases: shaped.filter((c) => c.status === 'CHRONIC').length,
      recovered_cases: shaped.filter((c) => c.status === 'RECOVERED').length,
      lost_cases: shaped.filter((c) => CASE_FINAL_STATUSES.includes(c.status)).length,
      total_treatments: treatments.length,
      total_treatment_cost:
        Math.round(treatments.reduce((sum, t) => sum + Number(t.cost || 0), 0) * 100) / 100,
      last_diagnosed_on: shaped.length ? shaped[0].diagnosed_on : null,
      last_diagnosis: shaped.length ? shaped[0].diagnosis : null,
      withdrawal_until: inWithdrawal.length
        ? inWithdrawal.reduce(
            (max, t) =>
              new Date(t.withdrawal_end_date) > new Date(max) ? t.withdrawal_end_date : max,
            inWithdrawal[0].withdrawal_end_date
          )
        : null,
    },
    cases: shaped.map((c, i) => ({
      ...c,
      treatments: (cases[i].treatments || []).map(shapeTreatment),
    })),
  };
}

// ── Reports ──────────────────────────────────────────────────

const groupCount = (map, key) => {
  if (key == null) return;
  map.set(key, (map.get(key) || 0) + 1);
};

const toPairs = (map, labelKey, valueKey) =>
  [...map.entries()]
    .map(([k, v]) => ({ [labelKey]: k, [valueKey]: v }))
    .sort((a, b) => b[valueKey] - a[valueKey]);

// Herd-level health KPIs for the dashboard cards + overview PDF.
async function overview({ farmId }) {
  const [cases, totalAnimals] = await Promise.all([
    prisma.healthCase.findMany({ where: { farm_id: farmId, deleted_at: null }, include: caseInclude }),
    prisma.animal.count({ where: { farm_id: farmId, deleted_at: null } }),
  ]);

  const shaped = cases.map(shapeCase);
  const byStatus = (s) => shaped.filter((c) => c.status === s);

  const active = shaped.filter((c) => c.state === 'active');
  const recovered = byStatus('RECOVERED');
  const died = byStatus('DIED');
  const culled = byStatus('CULLED');
  const chronic = byStatus('CHRONIC');
  const quarantined = shaped.filter((c) => c.is_quarantined && c.state === 'active');
  const treatmentCost = shaped.reduce((sum, c) => sum + c.treatment_cost, 0);

  const recoveryDays = recovered.map((c) => c.open_days).filter((d) => d != null && d >= 0);
  const avgRecoveryDays = recoveryDays.length
    ? Math.round((recoveryDays.reduce((a, b) => a + b, 0) / recoveryDays.length) * 10) / 10
    : null;

  const closed = recovered.length + died.length + culled.length + chronic.length;
  const pct = (n) => (closed ? Math.round((n / closed) * 1000) / 10 : 0);

  const severityMap = new Map();
  const categoryMap = new Map();
  const diseaseMap = new Map();
  const monthMap = new Map();
  for (const c of shaped) {
    groupCount(severityMap, c.severity);
    groupCount(categoryMap, c.category);
    groupCount(diseaseMap, c.diagnosis);
    const key = new Date(c.diagnosed_on).toISOString().slice(0, 7);
    groupCount(monthMap, key);
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const isThisMonth = (d) => d && new Date(d) >= monthStart;

  return {
    total_animals: totalAnimals,
    affected_animals: new Set(shaped.map((c) => c.animal_id)).size,
    total_cases: shaped.length,
    open_cases: active.length,
    under_treatment: byStatus('UNDER_TREATMENT').length,
    recovered: recovered.length,
    chronic: chronic.length,
    died: died.length,
    culled: culled.length,
    quarantined: quarantined.length,
    recovery_rate: pct(recovered.length),
    mortality_rate: pct(died.length),
    cull_rate: pct(culled.length),
    avg_recovery_days: avgRecoveryDays,
    treatment_cost: Math.round(treatmentCost * 100) / 100,
    avg_cost_per_case: shaped.length
      ? Math.round((treatmentCost / shaped.length) * 100) / 100
      : 0,
    new_this_month: shaped.filter((c) => isThisMonth(c.diagnosed_on)).length,
    recovered_this_month: recovered.filter((c) => isThisMonth(c.outcome_date)).length,
    by_severity: toPairs(severityMap, 'severity', 'count'),
    by_category: toPairs(categoryMap, 'category', 'count'),
    top_diseases: toPairs(diseaseMap, 'diagnosis', 'count').slice(0, 8),
    monthly_trend: [...monthMap.entries()]
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    generated_at: new Date(),
  };
}

const rangeWhere = ({ farmId, from, to }) => {
  const where = { farm_id: farmId, deleted_at: null };
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  if (fromDate && !Number.isNaN(fromDate.getTime())) where.diagnosed_on = { gte: fromDate };
  if (toDate && !Number.isNaN(toDate.getTime())) {
    where.diagnosed_on = { ...(where.diagnosed_on || {}), lte: toDate };
  }
  return where;
};

// Per-disease breakdown: frequency, outcomes, duration and cost.
async function diseaseFrequency({ farmId, from, to }) {
  const cases = await prisma.healthCase.findMany({
    where: rangeWhere({ farmId, from, to }),
    include: caseInclude,
  });
  const shaped = cases.map(shapeCase);

  const groups = new Map();
  for (const c of shaped) {
    const key = c.diagnosis;
    const entry = groups.get(key) || {
      diagnosis: key,
      category: c.category,
      disease_id: c.disease_id,
      contagious: c.is_contagious,
      cases: 0,
      animals: new Set(),
      open: 0,
      recovered: 0,
      chronic: 0,
      died: 0,
      culled: 0,
      treatment_count: 0,
      cost: 0,
      durations: [],
      first_seen: null,
      last_seen: null,
    };

    entry.cases += 1;
    entry.animals.add(c.animal_id);
    entry.cost += c.treatment_cost;
    entry.treatment_count += c.treatment_count;
    if (CASE_OPEN_STATUSES.includes(c.status)) entry.open += 1;
    if (c.status === 'RECOVERED') entry.recovered += 1;
    if (c.status === 'CHRONIC') entry.chronic += 1;
    if (c.status === 'DIED') entry.died += 1;
    if (c.status === 'CULLED') entry.culled += 1;
    if (c.open_days != null) entry.durations.push(c.open_days);

    const d = new Date(c.diagnosed_on);
    if (!entry.first_seen || d < new Date(entry.first_seen)) entry.first_seen = c.diagnosed_on;
    if (!entry.last_seen || d > new Date(entry.last_seen)) entry.last_seen = c.diagnosed_on;

    groups.set(key, entry);
  }

  const diseases = [...groups.values()]
    .map((e) => {
      const closed = e.recovered + e.chronic + e.died + e.culled;
      return {
        diagnosis: e.diagnosis,
        category: e.category,
        disease_id: e.disease_id,
        contagious: e.contagious,
        cases: e.cases,
        animals: e.animals.size,
        open: e.open,
        recovered: e.recovered,
        chronic: e.chronic,
        died: e.died,
        culled: e.culled,
        recovery_rate: closed ? Math.round((e.recovered / closed) * 1000) / 10 : 0,
        mortality_rate: closed ? Math.round((e.died / closed) * 1000) / 10 : 0,
        avg_duration_days: e.durations.length
          ? Math.round((e.durations.reduce((a, b) => a + b, 0) / e.durations.length) * 10) / 10
          : null,
        treatment_count: e.treatment_count,
        cost: Math.round(e.cost * 100) / 100,
        first_seen: e.first_seen,
        last_seen: e.last_seen,
      };
    })
    .sort((a, b) => b.cases - a.cases);

  const categoryMap = new Map();
  for (const c of shaped) groupCount(categoryMap, c.category);

  return {
    total_cases: shaped.length,
    distinct_diseases: diseases.length,
    by_category: toPairs(categoryMap, 'category', 'count'),
    diseases,
    generated_at: new Date(),
  };
}

// Open / under-treatment cases, most urgent first.
async function activeCases({ farmId }) {
  const rows = await prisma.healthCase.findMany({
    where: { farm_id: farmId, deleted_at: null, status: { in: CASE_OPEN_STATUSES } },
    include: caseInclude,
    orderBy: { diagnosed_on: 'asc' },
  });

  const weight = { CRITICAL: 0, SEVERE: 1, MODERATE: 2, MILD: 3 };
  const cases = rows
    .map(shapeCase)
    .sort((a, b) => {
      const bySeverity = (weight[a.severity] ?? 9) - (weight[b.severity] ?? 9);
      if (bySeverity !== 0) return bySeverity;
      return (b.open_days || 0) - (a.open_days || 0);
    });

  return {
    total: cases.length,
    quarantined: cases.filter((c) => c.is_quarantined).length,
    critical: cases.filter((c) => c.severity === 'CRITICAL').length,
    severe: cases.filter((c) => c.severity === 'SEVERE').length,
    treatment_cost: Math.round(cases.reduce((s, c) => s + c.treatment_cost, 0) * 100) / 100,
    cases,
    generated_at: new Date(),
  };
}

// Recovery / mortality outcomes, with a per-disease table and the loss log.
async function outcomes({ farmId, from, to }) {
  const cases = await prisma.healthCase.findMany({
    where: rangeWhere({ farmId, from, to }),
    include: caseInclude,
  });
  const shaped = cases.map(shapeCase);

  const statusMap = new Map();
  const groups = new Map();
  for (const c of shaped) {
    groupCount(statusMap, c.status);

    const e = groups.get(c.diagnosis) || {
      diagnosis: c.diagnosis,
      category: c.category,
      total: 0,
      open: 0,
      recovered: 0,
      chronic: 0,
      died: 0,
      culled: 0,
      durations: [],
      cost: 0,
    };
    e.total += 1;
    e.cost += c.treatment_cost;
    if (CASE_OPEN_STATUSES.includes(c.status)) e.open += 1;
    if (c.status === 'RECOVERED') e.recovered += 1;
    if (c.status === 'CHRONIC') e.chronic += 1;
    if (c.status === 'DIED') e.died += 1;
    if (c.status === 'CULLED') e.culled += 1;
    if (c.open_days != null) e.durations.push(c.open_days);
    groups.set(c.diagnosis, e);
  }

  const byDisease = [...groups.values()]
    .map((e) => {
      const closed = e.recovered + e.chronic + e.died + e.culled;
      return {
        diagnosis: e.diagnosis,
        category: e.category,
        total: e.total,
        open: e.open,
        recovered: e.recovered,
        chronic: e.chronic,
        died: e.died,
        culled: e.culled,
        recovery_rate: closed ? Math.round((e.recovered / closed) * 1000) / 10 : 0,
        mortality_rate: closed ? Math.round((e.died / closed) * 1000) / 10 : 0,
        avg_duration_days: e.durations.length
          ? Math.round((e.durations.reduce((a, b) => a + b, 0) / e.durations.length) * 10) / 10
          : null,
        cost: Math.round(e.cost * 100) / 100,
      };
    })
    .sort((a, b) => b.total - a.total);

  const losses = shaped
    .filter((c) => CASE_FINAL_STATUSES.includes(c.status))
    .map((c) => ({
      id: c.id,
      animal_id: c.animal_id,
      tag_number: c.tag_number,
      animal_name: c.animal_name,
      diagnosis: c.diagnosis,
      severity: c.severity,
      status: c.status,
      diagnosed_on: c.diagnosed_on,
      outcome_date: c.outcome_date,
      outcome_notes: c.outcome_notes,
      treatment_cost: c.treatment_cost,
    }))
    .sort((a, b) => new Date(b.outcome_date || 0) - new Date(a.outcome_date || 0));

  return {
    total_cases: shaped.length,
    recovered: shaped.filter((c) => c.status === 'RECOVERED').length,
    chronic: shaped.filter((c) => c.status === 'CHRONIC').length,
    died: shaped.filter((c) => c.status === 'DIED').length,
    culled: shaped.filter((c) => c.status === 'CULLED').length,
    open: shaped.filter((c) => CASE_OPEN_STATUSES.includes(c.status)).length,
    loss_count: losses.length,
    loss_cost: Math.round(losses.reduce((s, l) => s + l.treatment_cost, 0) * 100) / 100,
    by_status: toPairs(statusMap, 'status', 'count'),
    by_disease: byDisease,
    losses,
    generated_at: new Date(),
  };
}

// Treatment spend, by date range / medicine / animal.
async function treatmentCost({ farmId, from, to }) {
  const where = { farm_id: farmId, deleted_at: null };
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  if (fromDate && !Number.isNaN(fromDate.getTime())) where.start_date = { gte: fromDate };
  if (toDate && !Number.isNaN(toDate.getTime())) {
    where.start_date = { ...(where.start_date || {}), lte: toDate };
  }

  const rows = await prisma.healthTreatment.findMany({
    where,
    include: {
      medicine: { select: { id: true, name: true } },
      healthCase: {
        select: {
          id: true,
          diagnosis: true,
          category: true,
          animal: { select: { id: true, tag_number: true, name: true } },
        },
      },
    },
    orderBy: { start_date: 'asc' },
  });

  const byMedicine = new Map();
  const byAnimal = new Map();
  const byRoute = new Map();
  const byMonth = new Map();
  let total = 0;

  const records = rows.map((r) => {
    const cost = Number(r.cost || 0);
    total += cost;

    const medicineName = r.medicine?.name || r.medicine_name || 'Unnamed';
    byMedicine.set(medicineName, (byMedicine.get(medicineName) || 0) + cost);

    const animalKey = `${r.healthCase?.animal?.tag_number || '—'}|${r.healthCase?.animal?.name || ''}`;
    byAnimal.set(animalKey, (byAnimal.get(animalKey) || 0) + cost);

    const route = r.route || 'NOT_RECORDED';
    byRoute.set(route, (byRoute.get(route) || 0) + cost);

    const month = new Date(r.start_date).toISOString().slice(0, 7);
    byMonth.set(month, (byMonth.get(month) || 0) + cost);

    return {
      id: r.id,
      case_id: r.case_id,
      animal_id: r.healthCase?.animal?.id ?? null,
      tag_number: r.healthCase?.animal?.tag_number ?? null,
      animal_name: r.healthCase?.animal?.name ?? null,
      diagnosis: r.healthCase?.diagnosis ?? null,
      medicine: medicineName,
      dosage: r.dosage,
      route: r.route,
      start_date: r.start_date,
      end_date: r.end_date,
      withdrawal_end_date: r.withdrawal_end_date,
      cost: Math.round(cost * 100) / 100,
    };
  });

  const asMoney = (map, labelKey) =>
    [...map.entries()]
      .map(([k, v]) => ({ [labelKey]: k, cost: Math.round(v * 100) / 100 }))
      .sort((a, b) => b.cost - a.cost);

  return {
    total_cost: Math.round(total * 100) / 100,
    treatment_count: records.length,
    animals_treated: new Set(records.map((r) => r.animal_id)).size,
    by_medicine: asMoney(byMedicine, 'medicine'),
    by_animal: asMoney(byAnimal, 'animal'),
    by_route: asMoney(byRoute, 'route'),
    by_month: [...byMonth.entries()]
      .map(([month, cost]) => ({ month, cost: Math.round(cost * 100) / 100 }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    records,
    generated_at: new Date(),
  };
}

// Animals currently isolated, with how long they have been separated.
async function quarantine({ farmId }) {
  const rows = await prisma.healthCase.findMany({
    where: {
      farm_id: farmId,
      deleted_at: null,
      is_quarantined: true,
      status: { in: CASE_OPEN_STATUSES },
    },
    include: caseInclude,
    orderBy: { diagnosed_on: 'asc' },
  });

  const cases = rows.map(shapeCase).map((c) => ({ ...c, days_isolated: c.open_days }));

  return {
    total: cases.length,
    animals: new Set(cases.map((c) => c.animal_id)).size,
    contagious: cases.filter((c) => c.is_contagious).length,
    cases,
    generated_at: new Date(),
  };
}

// Medicines still inside their withdrawal window → milk / meat must not be sold.
// `days` looks that many days ahead (0 = every active window).
async function withdrawal({ farmId, days = 0 }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = addDays(today, days) || today;

  const rows = await prisma.healthTreatment.findMany({
    where: {
      farm_id: farmId,
      deleted_at: null,
      withdrawal_end_date: days
        ? { gte: today, lte: horizon }
        : { gte: today },
    },
    include: {
      medicine: { select: { id: true, name: true } },
      healthCase: {
        select: {
          id: true,
          diagnosis: true,
          animal: { select: { id: true, tag_number: true, name: true } },
        },
      },
    },
    orderBy: { withdrawal_end_date: 'asc' },
  });

  const records = rows.map((r) => {
    const end = new Date(r.withdrawal_end_date);
    const daysRemaining = Math.ceil((end - today) / 86400000);
    return {
      id: r.id,
      case_id: r.case_id,
      animal_id: r.healthCase?.animal?.id ?? null,
      tag_number: r.healthCase?.animal?.tag_number ?? null,
      animal_name: r.healthCase?.animal?.name ?? null,
      diagnosis: r.healthCase?.diagnosis ?? null,
      medicine: r.medicine?.name || r.medicine_name || 'Unnamed',
      dosage: r.dosage,
      route: r.route,
      start_date: r.start_date,
      end_date: r.end_date,
      withdrawal_days: r.withdrawal_days,
      withdrawal_end_date: r.withdrawal_end_date,
      days_remaining: daysRemaining,
      cleared: daysRemaining <= 0,
    };
  });

  const byAnimal = new Map();
  for (const r of records) {
    const key = `${r.tag_number || '—'}|${r.animal_name || ''}`;
    const entry = byAnimal.get(key) || {
      animal: key,
      tag_number: r.tag_number,
      name: r.animal_name,
      medicines: [],
      clearance_date: null,
    };
    if (!entry.medicines.includes(r.medicine)) entry.medicines.push(r.medicine);
    if (!entry.clearance_date || new Date(r.withdrawal_end_date) > new Date(entry.clearance_date)) {
      entry.clearance_date = r.withdrawal_end_date;
    }
    byAnimal.set(key, entry);
  }

  return {
    total: records.length,
    animals: byAnimal.size,
    cleared: records.filter((r) => r.cleared).length,
    pending: records.filter((r) => !r.cleared).length,
    lookahead_days: days,
    by_animal: [...byAnimal.values()].sort(
      (a, b) => new Date(b.clearance_date || 0) - new Date(a.clearance_date || 0)
    ),
    records,
    generated_at: new Date(),
  };
}

export const HealthService = {
  AppError,
  CASE_OPEN_STATUSES,
  CASE_CLOSED_STATUSES,
  CASE_FINAL_STATUSES,
  listDiseases,
  getDisease,
  createDisease,
  updateDisease,
  softDeleteDisease,
  listMedicines,
  createMedicine,
  updateMedicine,
  softDeleteMedicine,
  listCases,
  getCase,
  createCase,
  updateCase,
  changeCaseStatus,
  softDeleteCase,
  addTreatment,
  updateTreatment,
  softDeleteTreatment,
  animalHealth,
  overview,
  diseaseFrequency,
  activeCases,
  outcomes,
  treatmentCost,
  quarantine,
  withdrawal,
};
