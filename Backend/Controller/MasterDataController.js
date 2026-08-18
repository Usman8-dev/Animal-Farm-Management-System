import prisma from '../prisma/client.js';

// ── Animal Types ────────────────────────────────────────────

const ListAnimalTypes = async (req, res) => {
  try {
    const farmId = req.user.farmId;
    const animalTypes = await prisma.animalType.findMany({
        where: { farm_id: farmId, deleted_at: null }, 
        orderBy: { name: 'asc' },
    });
    return res.status(200).json({ success: true, data: animalTypes });
  } catch (err) {
    console.error('ListAnimalTypes error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const CreateAnimalType = async (req, res) => {
        const personId = req.user.id;
        const farmId = req.user.farmId;
  try {
    const { code, name, is_active } = req.body;

    const existing = await prisma.animalType.findFirst({ where: { farm_id: farmId, code } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Animal type code already exists' });
    }

    const animalType = await prisma.animalType.create({
      data: { farm_id: farmId, code, name, is_active: is_active ?? true, createdby: personId, },
    });

    return res.status(201).json({ success: true, data: animalType });
  } catch (err) {
    console.error('CreateAnimalType error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const UpdateAnimalType = async (req, res) => {
    const personId = req.user.id;
  try {
    const { id } = req.params;
    const { code, name, is_active } = req.body;
    const farmId = req.user.farmId;

    const animalType = await prisma.animalType.findFirst({ where: { id: Number(id), farm_id: farmId } });
    if (!animalType) {
      return res.status(404).json({ success: false, message: 'Animal type not found' });
    }

    if (code && code !== animalType.code) {
      const codeTaken = await prisma.animalType.findFirst({ where: { farm_id: farmId, code, NOT: { id: Number(id) } } });
      if (codeTaken) {
        return res.status(409).json({ success: false, message: 'Animal type code already exists' });
      }
    }

    const updated = await prisma.animalType.update({
      where: { id: Number(id) },
      data: { code, name, is_active, updatedby: personId },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('UpdateAnimalType error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const DeleteAnimalType = async (req, res) => {
  try {
    const { id } = req.params;
    const personId = req.user.id;
    const animalTypeId = Number(id);

    const animalType = await prisma.animalType.findFirst({
      where: { id: animalTypeId, farm_id: req.user.farmId, deleted_at: null },
    });
    if (!animalType) {
      return res.status(404).json({ success: false, message: 'Animal type not found' });
    }

    // Prevent deleting an animal type still in use by breeds or animals
    const [breedInUse, animalInUse] = await Promise.all([
      prisma.breed.findFirst({ where: { animal_type_id: animalTypeId, is_active: true } }),
      prisma.animal.findFirst({ where: { animal_type_id: animalTypeId, deleted_at: null } }),
    ]);

    if (breedInUse || animalInUse) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete an animal type that is still referenced by breeds or animals',
      });
    }

    await prisma.animalType.update({
      where: { id: animalTypeId },
      data: { deleted_at: new Date(), deletedby: personId },
    });

    return res.status(200).json({ success: true, message: 'Animal type deleted successfully' });
  } catch (err) {
    console.error('DeleteAnimalType error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const GetAnimalType = async (req, res) => {
  try {
    const { id } = req.params;

    const animalType = await prisma.animalType.findFirst({
      where: { id: Number(id), farm_id: req.user.farmId, deleted_at: null },
    });

    if (!animalType) {
      return res.status(404).json({ success: false, message: 'Animal type not found' });
    }

    return res.status(200).json({ success: true, data: animalType });
  } catch (err) {
    console.error('GetAnimalType error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── Breeds ───────────────────────────────────────────────────

const ListBreeds = async (req, res) => {
  try {
    const farmId = req.user.farmId;
    const { animal_type_id } = req.query;

    const breeds = await prisma.breed.findMany({
      where: {
        farm_id: farmId,
        deleted_at: null,
        ...(animal_type_id ? { animal_type_id: Number(animal_type_id) } : {}),
      },
      include: { animalType: { select: { id: true, name: true, code: true } } },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({ success: true, data: breeds });
  } catch (err) {
    console.error('ListBreeds error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


const CreateBreed = async (req, res) => {
    const personId = req.user.id;
    const farmId = req.user.farmId;

  try {
    const { animal_type_id, code, name, gestation_days, maturity_days, is_active } = req.body;

    const animalType = await prisma.animalType.findFirst({ where: { id: Number(animal_type_id), farm_id: farmId } });
    if (!animalType) {
      return res.status(422).json({ success: false, message: 'animal_type_id does not exist on this farm' });
    }

    const existing = await prisma.breed.findFirst({
      where: { farm_id: farmId, animal_type_id: Number(animal_type_id), code },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Breed code already exists for this animal type' });
    }

    const breed = await prisma.breed.create({
      data: {
        farm_id: farmId,
        animal_type_id: Number(animal_type_id),
        code,
        name,
        gestation_days: Number(gestation_days),
        maturity_days: Number(maturity_days),
        is_active: is_active ?? true,
        createdby: personId,
      },
    });

    return res.status(201).json({ success: true, data: breed });
  } catch (err) {
    console.error('CreateBreed error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const UpdateBreed = async (req, res) => {
    const personId = req.user.id;
    const farmId = req.user.farmId;

  try {
    const { id } = req.params;
    const { code, name, gestation_days, maturity_days, is_active } = req.body;

    const breed = await prisma.breed.findFirst({ where: { id: Number(id), farm_id: farmId } });
    if (!breed) {
      return res.status(404).json({ success: false, message: 'Breed not found' });
    }

    if (code && code !== breed.code) {
      const codeTaken = await prisma.breed.findFirst({
        where: { farm_id: farmId, animal_type_id: breed.animal_type_id, code, NOT: { id: breed.id } },
      });
      if (codeTaken) {
        return res.status(409).json({ success: false, message: 'Breed code already exists for this animal type' });
      }
    }

    const updated = await prisma.breed.update({
      where: { id: Number(id) },
      data: {
        code,
        name,
        gestation_days: gestation_days !== undefined ? Number(gestation_days) : undefined,
        maturity_days: maturity_days !== undefined ? Number(maturity_days) : undefined,
        is_active,
        updatedby: personId,
      },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('UpdateBreed error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const DeleteBreed = async (req, res) => {
  try {
    const { id } = req.params;
    const personId = req.user.id;
    const breedId = Number(id);

    const breed = await prisma.breed.findFirst({
      where: { id: breedId, farm_id: req.user.farmId, deleted_at: null },
    });
    if (!breed) {
      return res.status(404).json({ success: false, message: 'Breed not found' });
    }

    // Prevent deleting a breed still in use by animals
    const animalInUse = await prisma.animal.findFirst({
      where: { breed_id: breedId, deleted_at: null },
    });
    if (animalInUse) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete a breed that is still referenced by animals',
      });
    }

    await prisma.breed.update({
      where: { id: breedId },
      data: { deleted_at: new Date(), deletedby: personId },
    });

    return res.status(200).json({ success: true, message: 'Breed deleted successfully' });
  } catch (err) {
    console.error('DeleteBreed error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const GetBreed = async (req, res) => {
  try {
    const { id } = req.params;

    const breed = await prisma.breed.findFirst({
      where: { id: Number(id), farm_id: req.user.farmId, deleted_at: null },
      include: { animalType: { select: { id: true, name: true, code: true } } },
    });

    if (!breed) {
      return res.status(404).json({ success: false, message: 'Breed not found' });
    }

    return res.status(200).json({ success: true, data: breed });
  } catch (err) {
    console.error('GetBreed error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── Genders (read-only reference data) ──────────────────────

const ListGenders = async (req, res) => {
  try {
    const genders = await prisma.gender.findMany({
      where: { farm_id: req.user.farmId, deleted_at: null },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({ success: true, data: genders });
  } catch (err) {
    console.error('ListGenders error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const GetGender = async (req, res) => {
  try {
    const { id } = req.params;

    const gender = await prisma.gender.findFirst({
      where: { id: Number(id), farm_id: req.user.farmId, deleted_at: null },
    });

    if (!gender) {
      return res.status(404).json({ success: false, message: 'Gender not found' });
    }

    return res.status(200).json({ success: true, data: gender });
  } catch (err) {
    console.error('GetGender error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const CreateGender = async (req, res) => {
  try {
    const { code, name } = req.body;
    const personId = req.user.id;
    const farmId = req.user.farmId;

    const existing = await prisma.gender.findFirst({ where: { farm_id: farmId, code } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Gender code already exists' });
    }

    const gender = await prisma.gender.create({
      data: { farm_id: farmId, code, name, createdby: personId },
    });

    return res.status(201).json({ success: true, data: gender });
  } catch (err) {
    console.error('CreateGender error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const UpdateGender = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name } = req.body;
    const personId = req.user.id;
    const farmId = req.user.farmId;

    const gender = await prisma.gender.findFirst({
      where: { id: Number(id), farm_id: farmId, deleted_at: null },
    });
    if (!gender) {
      return res.status(404).json({ success: false, message: 'Gender not found' });
    }

    if (code && code !== gender.code) {
      const codeTaken = await prisma.gender.findFirst({
        where: { farm_id: farmId, code, NOT: { id: Number(id) } },
      });
      if (codeTaken) {
        return res.status(409).json({ success: false, message: 'Gender code already exists' });
      }
    }

    const updated = await prisma.gender.update({
      where: { id: Number(id) },
      data: { code, name, updatedby: personId },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('UpdateGender error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const DeleteGender = async (req, res) => {
  try {
    const { id } = req.params;
    const personId = req.user.id;
    const genderId = Number(id);

    const gender = await prisma.gender.findFirst({
      where: { id: genderId, farm_id: req.user.farmId, deleted_at: null },
    });
    if (!gender) {
      return res.status(404).json({ success: false, message: 'Gender not found' });
    }

    const animalInUse = await prisma.animal.findFirst({
      where: { gender_id: genderId, deleted_at: null },
    });
    if (animalInUse) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete a gender that is still referenced by animals',
      });
    }

    await prisma.gender.update({
      where: { id: genderId },
      data: { deleted_at: new Date(), deletedby: personId },
    });

    return res.status(200).json({ success: true, message: 'Gender deleted successfully' });
  } catch (err) {
    console.error('DeleteGender error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export {
  ListAnimalTypes,
  CreateAnimalType,
  UpdateAnimalType,
  DeleteAnimalType,
  GetAnimalType,
  ListBreeds,
  CreateBreed,
  UpdateBreed,
  DeleteBreed,
  GetBreed,
  ListGenders,
  GetGender,    
  CreateGender,  
  UpdateGender,  
  DeleteGender,  
};