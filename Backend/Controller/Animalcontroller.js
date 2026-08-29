import prisma from '../prisma/client.js';
import { AnimalService } from '../services/animalService.js';

const { AppError, validateLineage, validateClassification, assertUniqueTagNumber } = AnimalService;

// Shared "include" shape so list/detail responses stay consistent
const animalInclude = {
  animalType: { select: { id: true, name: true, code: true } },
  breed: { select: { id: true, name: true, code: true } },
  gender: { select: { id: true, name: true, code: true } },
  mother: { select: { id: true, tag_number: true, name: true } },
  father: { select: { id: true, tag_number: true, name: true } },
  images: { orderBy: { is_primary: 'desc' } },
};

// ── List / Search ────────────────────────────────────────────

const ListAnimals = async (req, res) => {
  try {
    const farmId = req.user.farmId;
    const {
      animal_type_id,
      breed_id,
      gender_id,
      acquisition_type,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const where = {
      farm_id: farmId,
      deleted_at: null,
      ...(animal_type_id && { animal_type_id: Number(animal_type_id) }),
      ...(breed_id && { breed_id: Number(breed_id) }),
      ...(gender_id && { gender_id: Number(gender_id) }),
      ...(acquisition_type && { acquisition_type }),
      ...(search && {
        OR: [
          { tag_number: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const skip = (Number(page) - 1) * Number(limit);

    const [animals, total] = await Promise.all([
      prisma.animal.findMany({
        where,
        include: animalInclude,
        orderBy: { created_at: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.animal.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: animals,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('ListAnimals error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── Get One ──────────────────────────────────────────────────

const GetAnimal = async (req, res) => {
  try {
    const farmId = req.user.farmId;
    const { id } = req.params;

    const animal = await prisma.animal.findFirst({
      where: { id: Number(id), farm_id: farmId, deleted_at: null },
      include: animalInclude,
    });

    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    return res.status(200).json({ success: true, data: animal });
  } catch (err) {
    console.error('GetAnimal error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── Create ───────────────────────────────────────────────────

const CreateAnimal = async (req, res) => {
  try {
    const farmId = req.user.farmId;
    const personId = req.user.id;

    const {
      tag_number,
      name,
      animal_type_id,
      breed_id,
      gender_id,
      birth_date,
      acquisition_type,
      acquired_on,
      mother_id,
      father_id,
      notes,
    } = req.body;

    await validateClassification({
      animal_type_id: Number(animal_type_id),
      breed_id: Number(breed_id),
      gender_id: Number(gender_id),
      farm_id: farmId,
    });

    await validateLineage({
      farm_id: farmId,
      acquisition_type,
      mother_id: mother_id ? Number(mother_id) : null,
      father_id: father_id ? Number(father_id) : null,
    });

    await assertUniqueTagNumber({ farm_id: farmId, tag_number });

    const animal = await prisma.animal.create({
      data: {
        farm_id: farmId,
        tag_number,
        name,
        animal_type_id: Number(animal_type_id),
        breed_id: Number(breed_id),
        gender_id: Number(gender_id),
        birth_date: birth_date ? new Date(birth_date) : null,
        acquisition_type,
        acquired_on: acquired_on ? new Date(acquired_on) : null,
        mother_id: mother_id ? Number(mother_id) : null,
        father_id: father_id ? Number(father_id) : null,
        notes,
        createdby: personId,
      },
      include: animalInclude,
    });

    return res.status(201).json({ success: true, data: animal });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error('CreateAnimal error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── Update ───────────────────────────────────────────────────

const UpdateAnimal = async (req, res) => {
  try {
    const farmId = req.user.farmId;
    const personId = req.user.id;
    const { id } = req.params;
    const animalId = Number(id);

    const existing = await prisma.animal.findFirst({
      where: { id: animalId, farm_id: farmId, deleted_at: null },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    const {
      tag_number,
      name,
      animal_type_id,
      breed_id,
      gender_id,
      birth_date,
      acquisition_type,
      acquired_on,
      mother_id,
      father_id,
      notes,
      breeder,
    } = req.body;

    if (animal_type_id || breed_id || gender_id) {
      await validateClassification({
        animal_type_id: Number(animal_type_id ?? existing.animal_type_id),
        breed_id: Number(breed_id ?? existing.breed_id),
        gender_id: Number(gender_id ?? existing.gender_id),
        farm_id: farmId,
      });
    }

    const effectiveAcquisitionType = acquisition_type ?? existing.acquisition_type;
    await validateLineage({
      farm_id: farmId,
      acquisition_type: effectiveAcquisitionType,
      mother_id: mother_id !== undefined ? (mother_id ? Number(mother_id) : null) : existing.mother_id,
      father_id: father_id !== undefined ? (father_id ? Number(father_id) : null) : existing.father_id,
      animal_id: animalId,
    });

    if (tag_number && tag_number !== existing.tag_number) {
      await assertUniqueTagNumber({ farm_id: farmId, tag_number, excludeAnimalId: animalId });
    }

    const updated = await prisma.animal.update({
      where: { id: animalId },
      data: {
        tag_number,
        name,
        animal_type_id: animal_type_id ? Number(animal_type_id) : undefined,
        breed_id: breed_id ? Number(breed_id) : undefined,
        gender_id: gender_id ? Number(gender_id) : undefined,
        birth_date: birth_date ? new Date(birth_date) : undefined,
        acquisition_type,
        acquired_on: acquired_on ? new Date(acquired_on) : undefined,
        mother_id: mother_id !== undefined ? (mother_id ? Number(mother_id) : null) : undefined,
        father_id: father_id !== undefined ? (father_id ? Number(father_id) : null) : undefined,
        notes,
        breeder: breeder === undefined ? undefined : !!breeder,
        updatedby: personId,
      },
      include: animalInclude,
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error('UpdateAnimal error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Toggle the "breeder" flag for an animal. Kept as a dedicated lightweight
// endpoint because PUT /animals/:id requires the full animal payload.
const SetBreeder = async (req, res) => {
  try {
    const farmId = req.user.farmId;
    const personId = req.user.id;
    const animalId = Number(req.params.id);
    const { breeder } = req.body;

    if (typeof breeder !== 'boolean') {
      return res.status(422).json({ success: false, message: 'breeder must be a boolean' });
    }

    const existing = await prisma.animal.findFirst({
      where: { id: animalId, farm_id: farmId, deleted_at: null },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    const updated = await prisma.animal.update({
      where: { id: animalId },
      data: { breeder, updatedby: personId },
      include: animalInclude,
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error('SetBreeder error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── Soft Delete ──────────────────────────────────────────────
const DeleteAnimal = async (req, res) => {
  try {
    const farmId = req.user.farmId;
    const personId = req.user.id;
    const { id } = req.params;
    const animalId = Number(id);

    const existing = await prisma.animal.findFirst({
      where: { id: animalId, farm_id: farmId, deleted_at: null },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    // Prevent deleting an animal that is referenced as a parent —
    // protects lineage integrity for existing offspring records.
    const hasOffspring = await prisma.animal.findFirst({
      where: {
        deleted_at: null,
        OR: [{ mother_id: animalId }, { father_id: animalId }],
      },
    });
    if (hasOffspring) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete an animal that is referenced as a parent of another animal',
      });
    }

    await prisma.animal.update({
      where: { id: animalId },
      data: { deleted_at: new Date(), deletedby: personId },
    });

    return res.status(200).json({ success: true, message: 'Animal deleted successfully' });
  } catch (err) {
    console.error('DeleteAnimal error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── Lineage ──────────────────────────────────────────────────

const GetOffspring = async (req, res) => {
  try {
    const farmId = req.user.farmId;
    const { id } = req.params;
    const animalId = Number(id);

    const offspring = await prisma.animal.findMany({
      where: {
        farm_id: farmId,
        deleted_at: null,
        OR: [{ mother_id: animalId }, { father_id: animalId }],
      },
      select: { id: true, tag_number: true, name: true, birth_date: true },
      orderBy: { birth_date: 'desc' },
    });

    return res.status(200).json({ success: true, data: offspring });
  } catch (err) {
    console.error('GetOffspring error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ── Images ───────────────────────────────────────────────────

const AddAnimalImage = async (req, res) => {
  try {
    const farmId = req.user.farmId;
    const { id } = req.params;
    const animalId = Number(id);
    const { caption } = req.body;
    const personId = req.user.id;


    // Support both a pasted URL (application/json) and a device image
    // file (multipart/form-data handled by multer middleware).
    const url = req.file
      ? `/uploads/animals/${req.file.filename}`
      : (req.body.url || '').trim();

    if (!url) {
      return res.status(422).json({ success: false, message: 'Provide an image URL or upload an image file' });
    }

    // In multipart form-data, booleans arrive as strings ("true"/"1")
    let isPrimary = req.body.is_primary;
    if (typeof isPrimary === 'string') {
      isPrimary = isPrimary === 'true' || isPrimary === '1';
    }
    isPrimary = !!isPrimary;

    const animal = await prisma.animal.findFirst({
      where: { id: animalId, farm_id: farmId, deleted_at: null },
    });
    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    if (isPrimary) {
      await prisma.animalImage.updateMany({
        where: { animal_id: animalId },
        data: { is_primary: false },
      });
    }

    const image = await prisma.animalImage.create({
      data: { animal_id: animalId, url, caption, is_primary: isPrimary, createdby: personId },
    });

    return res.status(201).json({ success: true, data: image });
  } catch (err) {
    // Best-effort cleanup of the uploaded file if the DB write failed
    if (req.file && req.file.path) {
      import('fs').then((fs) => {
        fs.unlink(req.file.path, () => {});
      });
    }
    console.error('AddAnimalImage error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const SetPrimaryImage = async (req, res) => {
  try {
    const farmId = req.user.farmId;
    const { id, imageId } = req.params;

    const animal = await prisma.animal.findFirst({
      where: { id: Number(id), farm_id: farmId, deleted_at: null },
    });
    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    const image = await prisma.animalImage.findFirst({
      where: { id: Number(imageId), animal_id: Number(id) },
    });
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    await prisma.$transaction([
      prisma.animalImage.updateMany({
        where: { animal_id: Number(id) },
        data: { is_primary: false },
      }),
      prisma.animalImage.update({
        where: { id: Number(imageId) },
        data: { is_primary: true },
      }),
    ]);

    return res.status(200).json({ success: true, message: 'Primary image updated' });
  } catch (err) {
    console.error('SetPrimaryImage error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const DeleteAnimalImage = async (req, res) => {
  try {
    const farmId = req.user.farmId;
    const personId = req.user.id;
    const { id, imageId } = req.params;

    const animal = await prisma.animal.findFirst({
      where: { id: Number(id), farm_id: farmId, deleted_at: null },
    });
    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    const image = await prisma.animalImage.findFirst({
      where: {
        id: Number(imageId),
        animal_id: Number(id),
        deleted_at: null,
      },
    });
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // Soft delete only
    await prisma.animalImage.update({
      where: { id: Number(imageId) },
      data: {
        deleted_at: new Date(),
        deletedby: personId, // only if this column exists on AnimalImage
      },
    });

    // Optional: if this was the primary image, promote another one
    if (image.is_primary) {
      const nextImage = await prisma.animalImage.findFirst({
        where: {
          animal_id: Number(id),
          deleted_at: null,
          id: { not: Number(imageId) },
        },
        orderBy: { created_at: 'asc' },
      });
      if (nextImage) {
        await prisma.animalImage.update({
          where: { id: nextImage.id },
          data: { is_primary: true },
        });
      }
    }

    return res.status(200).json({ success: true, message: 'Image deleted' });
  } catch (err) {
    console.error('DeleteAnimalImage error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const GetAnimalFamilyTree = async (req, res) => {
  try {
    const farmId = req.user.farmId;
    const animalId = Number(req.params.id);

    const animalSelect = {
      id: true,
      tag_number: true,
      name: true,
      birth_date: true,
      mother_id: true,
      father_id: true,
      gender: { select: { id: true, name: true } },
      animalType: { select: { id: true, name: true } },
      breed: { select: { id: true, name: true } },
      images: {
        where: { deleted_at: null, is_primary: true },
        select: { id: true, url: true },
        take: 1,
      },
    };

    // 1. Main animal
    const animal = await prisma.animal.findFirst({
      where: { id: animalId, farm_id: farmId, deleted_at: null },
      select: animalSelect,
    });

    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    // Helper: load one relative by id
    const loadAnimal = async (id) => {
      if (!id) return null;
      return prisma.animal.findFirst({
        where: { id, farm_id: farmId, deleted_at: null },
        select: animalSelect,
      });
    };

    // 2. Parents
    const [mother, father] = await Promise.all([
      loadAnimal(animal.mother_id),
      loadAnimal(animal.father_id),
    ]);

    // 3. Grandparents (from parents' mother_id / father_id)
    const [
      maternalGrandmother,
      maternalGrandfather,
      paternalGrandmother,
      paternalGrandfather,
    ] = await Promise.all([
      loadAnimal(mother?.mother_id),
      loadAnimal(mother?.father_id),
      loadAnimal(father?.mother_id),
      loadAnimal(father?.father_id),
    ]);

    // 4. Descendants — recursively load children, grandchildren,
    // great-grandchildren, etc. so the tree is fully continuous.
    const loadDescendants = async (id, depth = 0, path = new Set()) => {
      // Safety: cap depth and stop if the same animal appears again in a
      // path (guards against accidental cycles in the data).
      if (depth >= 10 || path.has(id)) return [];

      const nextPath = new Set(path).add(id);

      const direct = await prisma.animal.findMany({
        where: {
          farm_id: farmId,
          deleted_at: null,
          OR: [{ mother_id: id }, { father_id: id }],
        },
        select: animalSelect,
        orderBy: { birth_date: 'asc' },
      });

      return Promise.all(
        direct.map(async (child) => ({
          ...child,
          children: await loadDescendants(child.id, depth + 1, nextPath),
        }))
      );
    };

    const children = await loadDescendants(animalId);

    return res.status(200).json({
      success: true,
      data: {
        animal,
        mother,
        father,
        maternalGrandmother,
        maternalGrandfather,
        paternalGrandmother,
        paternalGrandfather,
        children,
      },
    });
  } catch (err) {
    console.error('GetAnimalFamilyTree error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export {
  ListAnimals,
  GetAnimal,
  CreateAnimal,
  UpdateAnimal,
  DeleteAnimal,
  SetBreeder,
  GetOffspring,
  AddAnimalImage,
  SetPrimaryImage,
  DeleteAnimalImage,
  GetAnimalFamilyTree
};