import prisma from '../prisma/client.js';

const ListAnimalStatuses = async (req, res) => {
  try {
    const farmId = req.user.farmId;
    const statuses = await prisma.animalStatus.findMany({
      where: { farm_id: farmId, deleted_at: null },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({ success: true, data: statuses });
  } catch (err) {
    console.error('ListAnimalStatuses error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const GetAnimalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = await prisma.animalStatus.findFirst({
      where: { id: Number(id), farm_id: req.user.farmId, deleted_at: null },
    });
    if (!status) {
      return res.status(404).json({ success: false, message: 'Status not found' });
    }
    return res.status(200).json({ success: true, data: status });
  } catch (err) {
    console.error('GetAnimalStatus error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const CreateAnimalStatus = async (req, res) => {
  try {
    const farmId = req.user.farmId;
    const personId = req.user.id;
    const { code, name, category, is_active } = req.body;

    const existing = await prisma.animalStatus.findFirst({ where: { farm_id: farmId, code } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Status code already exists' });
    }

    const status = await prisma.animalStatus.create({
      data: { farm_id: farmId, code, name, category, is_active: is_active ?? true, createdby: personId, updatedby: personId },
    });

    return res.status(201).json({ success: true, data: status });
  } catch (err) {
    console.error('CreateAnimalStatus error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const UpdateAnimalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const farmId = req.user.farmId;
    const personId = req.user.id;
    const { code, name, category, is_active } = req.body;

    const status = await prisma.animalStatus.findFirst({ where: { id: Number(id), farm_id: farmId, deleted_at: null } });
    if (!status) {
      return res.status(404).json({ success: false, message: 'Status not found' });
    }

    if (code && code !== status.code) {
      const codeTaken = await prisma.animalStatus.findFirst({ where: { farm_id: farmId, code, NOT: { id: Number(id) } } });
      if (codeTaken) {
        return res.status(409).json({ success: false, message: 'Status code already exists' });
      }
    }

    const updated = await prisma.animalStatus.update({
      where: { id: Number(id) },
      data: { code, name, category, is_active, updatedby: personId },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('UpdateAnimalStatus error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const DeleteAnimalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const farmId = req.user.farmId;
    const personId = req.user.id;
    const statusId = Number(id);

    const status = await prisma.animalStatus.findFirst({ where: { id: statusId, farm_id: farmId, deleted_at: null } });
    if (!status) {
      return res.status(404).json({ success: false, message: 'Status not found' });
    }

    // Prevent deleting a status still referenced by any history record
    // (open OR closed) — deleting it would corrupt an animal's timeline.
    const inUse = await prisma.statusHistory.findFirst({ where: { status_id: statusId, deleted_at: null } });
    if (inUse) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete a status that is referenced in an animal\'s status history',
      });
    }

    await prisma.animalStatus.update({
      where: { id: statusId },
      data: { deleted_at: new Date(), deletedby: personId },
    });

    return res.status(200).json({ success: true, message: 'Status deleted successfully' });
  } catch (err) {
    console.error('DeleteAnimalStatus error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export {
  ListAnimalStatuses,
  GetAnimalStatus,
  CreateAnimalStatus,
  UpdateAnimalStatus,
  DeleteAnimalStatus,
};