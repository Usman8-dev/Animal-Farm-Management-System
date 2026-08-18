import prisma from '../prisma/client.js';

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}



async function validateLineage({ farm_id, acquisition_type, mother_id, father_id, animal_id = null }) {
  if (acquisition_type === 'PURCHASED' && (mother_id || father_id)) {
    throw new AppError(
      'Purchased animals cannot have mother_id or father_id set',
      422
    );
  }

  if (mother_id) {
    if (mother_id === animal_id) {
      throw new AppError('An animal cannot be its own mother', 422);
    }
    const mother = await prisma.animal.findFirst({
      where: { id: mother_id, farm_id, deleted_at: null },
    });
    if (!mother) {
      throw new AppError('mother_id does not refer to a valid animal on this farm', 422);
    }
    // Gender-type check removed — Gender has no fixed field to validate against
  }

  if (father_id) {
    if (father_id === animal_id) {
      throw new AppError('An animal cannot be its own father', 422);
    }
    const father = await prisma.animal.findFirst({
      where: { id: father_id, farm_id, deleted_at: null },
    });
    if (!father) {
      throw new AppError('father_id does not refer to a valid animal on this farm', 422);
    }
    // Gender-type check removed — Gender has no fixed field to validate against
  }
}

/**
 * Confirms animal_type_id / breed_id / gender_id are valid, active,
 * belong to the given farm, and that the breed actually belongs to
 * the given animal type.
 */
async function validateClassification({ animal_type_id, breed_id, gender_id, farm_id }) {
  if (!farm_id) {
    throw new AppError('farm_id is required to validate classification', 422);
  }

  const [animalType, breed, gender] = await Promise.all([
    prisma.animalType.findFirst({ where: { id: animal_type_id, farm_id } }),
    prisma.breed.findFirst({ where: { id: breed_id, farm_id } }),
    prisma.gender.findFirst({ where: { id: gender_id, farm_id } }),
  ]);

  if (!animalType || !animalType.is_active) {
    throw new AppError('animal_type_id is invalid or inactive on this farm', 422);
  }
  if (!breed || !breed.is_active) {
    throw new AppError('breed_id is invalid or inactive on this farm', 422);
  }
  if (breed.animal_type_id !== animalType.id) {
    throw new AppError('breed_id does not belong to the given animal_type_id', 422);
  }
  if (!gender) {
    throw new AppError('gender_id is invalid on this farm', 422);
  }
}

async function assertUniqueTagNumber({ farm_id, tag_number, excludeAnimalId = null }) {
  const existing = await prisma.animal.findFirst({
    where: {
      farm_id,
      tag_number,
      deleted_at: null,
      ...(excludeAnimalId ? { NOT: { id: excludeAnimalId } } : {}),
    },
  });

  if (existing) {
    throw new AppError('An animal with this tag number already exists on this farm', 409);
  }
}

export const AnimalService = {
  AppError,
  validateLineage,
  validateClassification,
  assertUniqueTagNumber,
};