import prisma from '../prisma/client.js';
import { AnimalService } from './animalService.js';

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
    throw new AppError("Female animal's breed could not be resolved", 422);
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
    throw new AppError('A Male Animal (registered animal or reference) is required', 422);
  }
  if (sireId && sireId === damId) {
    throw new AppError('The same animal cannot be selected as both the female and the male', 422);
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
    throw new AppError('This Female Animal already has an open pregnancy record', 409);
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
      dam: { select: { id: true, tag_number: true, name: true, animal_type_id: true, breed_id: true } },
      sire: { select: { id: true, tag_number: true, name: true, animal_type_id: true, breed_id: true } },
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

// ── Births ───────────────────────────────────────────────────
// One birth can record several children (twins, triplets, …). Every live child
// is auto-registered as a farm animal; stillborn children are stored as
// birth-kid rows only.

// Accepts the new `kids` array or the legacy single `kid` payload.
function normaliseBirthKids({ kids, kid }) {
  if (Array.isArray(kids)) return kids.filter((k) => k && typeof k === 'object');
  if (kid && typeof kid === 'object') return [kid];
  return [];
}

const toWeight = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

// Validates one child and describes what should be persisted for it.
async function planBirthKid({ farmId, entry, index, seenTags, excludeAnimalId = null }) {
  const stillborn = !!entry.is_stillborn;
  const weight = toWeight(entry.birth_weight_kg);
  const notes = entry.notes?.toString().trim() || null;

  if (stillborn) {
    return { stillborn: true, weight, notes, gender: entry.gender?.toString().trim() || null };
  }

  const tag = String(entry.tag_number ?? '').trim();
  if (!tag) throw new AppError(`Tag number is required for child #${index + 1}`, 422);

  const key = tag.toLowerCase();
  if (seenTags.has(key)) {
    throw new AppError(`Tag number "${tag}" is used twice in this birth record`, 422);
  }
  seenTags.add(key);

  await AnimalService.assertUniqueTagNumber({
    farm_id: farmId,
    tag_number: tag,
    excludeAnimalId,
  });
  await AnimalService.validateClassification({
    animal_type_id: Number(entry.animal_type_id),
    breed_id: Number(entry.breed_id),
    gender_id: Number(entry.gender_id),
    farm_id: farmId,
  });

  return {
    stillborn: false,
    tag,
    name: entry.name?.toString().trim() || null,
    animal_type_id: Number(entry.animal_type_id),
    breed_id: Number(entry.breed_id),
    gender_id: Number(entry.gender_id),
    weight,
    notes,
  };
}

// Animal row for a live child — lineage follows the pregnancy's dam/sire.
function birthAnimalData({ plan, farmId, bd, damId, sireId, personId }) {
  return {
    farm_id: farmId,
    tag_number: plan.tag,
    name: plan.name,
    animal_type_id: plan.animal_type_id,
    breed_id: plan.breed_id,
    gender_id: plan.gender_id,
    birth_date: bd,
    acquisition_type: 'BORN_IN_FARM',
    acquired_on: bd,
    mother_id: damId,
    father_id: sireId,
    notes: plan.notes,
    createdby: personId,
  };
}

// Soft-deletes an animal this birth created. Refuses when the animal is already
// referenced elsewhere, so lineage/health/weight history is never orphaned.
async function removeBirthAnimal(tx, animalId, personId) {
  const animal = await tx.animal.findUnique({
    where: { id: animalId },
    select: { id: true, tag_number: true, deleted_at: true },
  });
  if (!animal || animal.deleted_at) return;

  const [asParent, inPregnancy, weights, valuations, vaccinations, statuses] = await Promise.all([
    tx.animal.findFirst({ where: { deleted_at: null, OR: [{ mother_id: animalId }, { father_id: animalId }] }, select: { id: true } }),
    tx.pregnancy.findFirst({ where: { deleted_at: null, OR: [{ dam_id: animalId }, { sire_id: animalId }] }, select: { id: true } }),
    tx.weightHistory.findFirst({ where: { animal_id: animalId, deleted_at: null }, select: { id: true } }),
    tx.animalValuation.findFirst({ where: { animal_id: animalId, deleted_at: null }, select: { id: true } }),
    tx.animalVaccination.findFirst({ where: { animal_id: animalId, deleted_at: null }, select: { id: true } }),
    tx.statusHistory.findFirst({ where: { animal_id: animalId, deleted_at: null }, select: { id: true } }),
  ]);

  if (asParent || inPregnancy || weights || valuations || vaccinations || statuses) {
    throw new AppError(
      `Child ${animal.tag_number} already has other records on the farm — it cannot be removed here`,
      409
    );
  }

  await tx.animal.update({
    where: { id: animalId },
    data: { deleted_at: new Date(), deletedby: personId },
  });
}

// Birth-kid row for one planned child (animal_id is null for stillborn kids).
function birthKidData({ plan, birthId, animalId, personId }) {
  return {
    birth_id: birthId,
    animal_id: animalId,
    is_stillborn: plan.stillborn,
    gender: plan.stillborn ? plan.gender : null,
    birth_weight_kg: plan.weight,
    notes: plan.notes,
    createdby: personId,
  };
}

const birthInclude = {
  kids: {
    where: { deleted_at: null },
    include: { animal: true },
  },
};

async function createBirth({ farmId, pregnancyId, birthDate, notes, kids, kid, personId }) {
  await assertPregnancyOnFarm(pregnancyId, farmId);
  const existing = await prisma.birth.findFirst({
    where: { pregnancy_id: pregnancyId, deleted_at: null },
  });
  if (existing) throw new AppError('A birth is already recorded for this pregnancy', 409);

  const bd = birthDate ? new Date(birthDate) : new Date();
  if (Number.isNaN(bd.getTime())) throw new AppError('Invalid birth_date', 422);

  const pregnancy = await prisma.pregnancy.findUnique({
    where: { id: pregnancyId },
    include: { dam: true, sire: true },
  });

  const entries = normaliseBirthKids({ kids, kid });
  const seenTags = new Set();
  const plans = [];
  for (let i = 0; i < entries.length; i += 1) {
    plans.push(await planBirthKid({ farmId, entry: entries[i], index: i, seenTags }));
  }

  // No live child → the pregnancy is closed as a stillbirth.
  const outcome = plans.length > 0 && plans.every((p) => p.stillborn) ? 'STILLBIRTH' : 'LIVE_BIRTH';

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
      data: { outcome, outcome_date: bd, updatedby: personId },
    });

    for (const plan of plans) {
      let animalId = null;
      if (!plan.stillborn) {
        const animal = await tx.animal.create({
          data: birthAnimalData({
            plan,
            farmId,
            bd,
            damId: pregnancy?.dam?.id ?? null,
            sireId: pregnancy?.sire?.id ?? null,
            personId,
          }),
        });
        animalId = animal.id;
      }

      await tx.birthKid.create({
        data: birthKidData({ plan, birthId: birth.id, animalId, personId }),
      });
    }

    return tx.birth.findUnique({ where: { id: birth.id }, include: birthInclude });
  });
}

// Edits an existing birth: birth_date/notes plus a full reconcile of its
// children (update existing, insert new, soft-delete removed). Animals created
// by this birth are kept in sync with their child rows.
async function updateBirth({ farmId, birthId, birthDate, notes, kids, personId }) {
  const birth = await assertBirthOnFarm(birthId, farmId);

  const bd = birthDate ? new Date(birthDate) : birth.birth_date;
  if (Number.isNaN(bd.getTime())) throw new AppError('Invalid birth_date', 422);

  const pregnancy = await prisma.pregnancy.findUnique({
    where: { id: birth.pregnancy_id },
    include: { dam: true, sire: true },
  });

  const existingKids = await prisma.birthKid.findMany({
    where: { birth_id: birthId, deleted_at: null },
    include: { animal: true },
  });
  const existingById = new Map(existingKids.map((k) => [k.id, k]));

  const entries = normaliseBirthKids({ kids, kid: null }).map((e) => ({
    ...e,
    kidId: e.id === null || e.id === undefined || e.id === '' ? null : Number(e.id),
  }));
  const keptIds = new Set(entries.filter((e) => e.kidId).map((e) => e.kidId));

  const seenTags = new Set();
  const plans = [];
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const existingKid = entry.kidId ? existingById.get(entry.kidId) : null;
    if (entry.kidId && !existingKid) {
      throw new AppError(`Child #${i + 1} does not belong to this birth record`, 422);
    }
    const plan = await planBirthKid({
      farmId,
      entry,
      index: i,
      seenTags,
      excludeAnimalId: existingKid?.animal_id ?? null,
    });
    plans.push({ plan, existingKid });
  }

  const outcome = plans.length > 0 && plans.every((p) => p.plan.stillborn) ? 'STILLBIRTH' : 'LIVE_BIRTH';
  const animalContext = {
    farmId,
    bd,
    damId: pregnancy?.dam?.id ?? null,
    sireId: pregnancy?.sire?.id ?? null,
    personId,
  };

  return prisma.$transaction(async (tx) => {
    await tx.birth.update({
      where: { id: birthId },
      data: {
        birth_date: bd,
        notes: notes === undefined ? birth.notes : notes || null,
        updatedby: personId,
      },
    });

    await tx.pregnancy.update({
      where: { id: birth.pregnancy_id },
      data: { outcome, outcome_date: bd, updatedby: personId },
    });

    // Children removed in the dialog → soft-delete the row and its animal.
    for (const kid of existingKids) {
      if (keptIds.has(kid.id)) continue;
      await tx.birthKid.update({
        where: { id: kid.id },
        data: { deleted_at: new Date(), deletedby: personId },
      });
      if (kid.animal_id) await removeBirthAnimal(tx, kid.animal_id, personId);
    }

    for (const { plan, existingKid } of plans) {
      // Child added while editing
      if (!existingKid) {
        let newAnimalId = null;
        if (!plan.stillborn) {
          const animal = await tx.animal.create({
            data: birthAnimalData({ plan, ...animalContext }),
          });
          newAnimalId = animal.id;
        }
        await tx.birthKid.create({
          data: birthKidData({ plan, birthId, animalId: newAnimalId, personId }),
        });
        continue;
      }

      let animalId = existingKid.animal_id;

      // Corrected to stillborn → retire the animal this birth created for it.
      if (plan.stillborn) {
        if (animalId) {
          await removeBirthAnimal(tx, animalId, personId);
          animalId = null;
        }
        await tx.birthKid.update({
          where: { id: existingKid.id },
          data: {
            animal_id: null,
            is_stillborn: true,
            gender: plan.gender,
            birth_weight_kg: plan.weight,
            notes: plan.notes,
            updatedby: personId,
          },
        });
        continue;
      }

      // Live child → keep its animal row in sync (register it when it has none).
      if (animalId) {
        await tx.animal.update({
          where: { id: animalId },
          data: {
            tag_number: plan.tag,
            name: plan.name,
            animal_type_id: plan.animal_type_id,
            breed_id: plan.breed_id,
            gender_id: plan.gender_id,
            birth_date: bd,
            notes: plan.notes,
            updatedby: personId,
          },
        });
      } else {
        const animal = await tx.animal.create({
          data: birthAnimalData({ plan, ...animalContext }),
        });
        animalId = animal.id;
      }

      await tx.birthKid.update({
        where: { id: existingKid.id },
        data: {
          animal_id: animalId,
          is_stillborn: false,
          birth_weight_kg: plan.weight,
          notes: plan.notes,
          updatedby: personId,
        },
      });
    }

    return tx.birth.findUnique({ where: { id: birthId }, include: birthInclude });
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
        include: {
          // Full animal details so the Record Birth dialog can be reopened for edits.
          animal: {
            select: {
              id: true,
              tag_number: true,
              name: true,
              animal_type_id: true,
              breed_id: true,
              gender_id: true,
            },
          },
        },
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

async function deleteKid({ farmId, kidId, personId }) {
  const kid = await assertKidOnFarm(kidId, farmId);
  // A kid that was registered as a farm animal must not be soft-deleted here —
  // the animal record lives on and belongs to the Animals module.
  if (kid.animal_id) throw new AppError('This offspring is registered as an animal and cannot be deleted', 409);

  return prisma.birthKid.update({
    where: { id: kidId },
    data: { deleted_at: new Date(), deletedby: personId },
  });
}

// Auto-register a kid as a new farm animal (BORN_IN_FARM).
async function registerKid({ farmId, kidId, payload, personId }) {
  const kid = await assertKidOnFarm(kidId, farmId);
  if (kid.animal_id) throw new AppError('This kid is already registered as an animal', 409);

  const birth = await prisma.birth.findUnique({
    where: { id: kid.birth_id },
    include: { pregnancy: { include: { dam: true, sire: true } } },
  });
  const dam = birth.pregnancy.dam;
  const sire = birth.pregnancy.sire;

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

  // Animal Type and Breed follow the mother (dam); fall back to the father
  // only when the pregnancy somehow has no dam (defensive — dam is required).
  const typeSource = dam ?? sire;
  const newAnimal = await prisma.animal.create({
    data: {
      farm_id: farmId,
      tag_number: tag,
      name: payload.name?.trim() || null,
      animal_type_id: typeSource.animal_type_id,
      breed_id: typeSource.breed_id,
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
      sire: { select: { id: true, tag_number: true, name: true } },
    },
    orderBy: { expected_delivery_date: 'asc' },
  });

  return rows
    .filter((r) => r.dam) // pragmatic guard
    .map((r) => ({
      pregnancy_id: r.id,
      dam: r.dam,
      sire: r.sire,
      sire_ref: r.sire_ref,
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
  updateBirth,
  getBirth,
  addKid,
  updateKid,
  deleteKid,
  registerKid,
  upcomingDeliveries,
  successRate,
  birthOutcomes,
  maturityAlerts,
};