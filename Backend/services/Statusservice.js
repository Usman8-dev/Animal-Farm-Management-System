import prisma from '../prisma/client.js';

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Records a new status for an animal, closing whichever status is
 * currently open (effective_to = null) for that animal, if any.
 * Runs in a transaction so the close + open happen atomically —
 * an animal should never end up with zero or two open statuses.
 */
async function recordStatusChange({ farmId, animalId, statusId, effectiveFrom, reason, personId }) {
  const animal = await prisma.animal.findFirst({
    where: { id: animalId, farm_id: farmId, deleted_at: null },
  });
  if (!animal) {
    throw new AppError('Animal not found', 404);
  }

  const status = await prisma.animalStatus.findFirst({
    where: { id: statusId, farm_id: farmId, deleted_at: null },
  });
  if (!status || !status.is_active) {
    throw new AppError('status_id is invalid or inactive on this farm', 422);
  }

  const newEffectiveFrom = effectiveFrom ? new Date(effectiveFrom) : new Date();

  const currentOpen = await prisma.statusHistory.findFirst({
    where: { animal_id: animalId, effective_to: null, deleted_at: null },
  });

  if (currentOpen && currentOpen.status_id === statusId) {
    throw new AppError('This animal already has this status as its current status', 409);
  }

  const results = await prisma.$transaction([
    ...(currentOpen
      ? [
          prisma.statusHistory.update({
            where: { id: currentOpen.id },
            data: { effective_to: newEffectiveFrom, updatedby: personId },
          }),
        ]
      : []),
    prisma.statusHistory.create({
      data: {
        animal_id: animalId,
        status_id: statusId,
        effective_from: newEffectiveFrom,
        reason,
        createdby: personId,
        updatedby: personId,
      },
    }),
  ]);

  const created = results[results.length - 1];

  return prisma.statusHistory.findUnique({
    where: { id: created.id },
    include: { status: true },
  });
}

export const StatusService = {
  AppError,
  recordStatusChange,
};