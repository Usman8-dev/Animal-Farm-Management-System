import prisma from '../prisma/client.js';
import { StatusService } from '../services/statusService.js';

const { AppError, recordStatusChange } = StatusService;

const RecordStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status_id, effective_from, reason } = req.body;

    if (!status_id) {
      return res.status(422).json({
        success: false,
        message: 'status_id is required',
      });
    }

    // Use client date, or now if omitted
    const fromDate = effective_from ? new Date(effective_from) : new Date();

    if (Number.isNaN(fromDate.getTime())) {
      return res.status(422).json({
        success: false,
        message: 'Invalid effective_from date',
      });
    }

    const record = await recordStatusChange({
      farmId: req.user.farmId,
      animalId: Number(id),
      statusId: Number(status_id),
      effectiveFrom: fromDate,   // ✅ once, correct value
      reason: reason || null,
      personId: req.user.id,
    });

    return res.status(201).json({ success: true, data: record });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error('RecordStatus error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const GetStatusHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const animal = await prisma.animal.findFirst({
      where: { id: Number(id), farm_id: req.user.farmId, deleted_at: null },
    });
    if (!animal) {
      return res.status(404).json({ success: false, message: 'Animal not found' });
    }

    const history = await prisma.statusHistory.findMany({
      where: { animal_id: Number(id), deleted_at: null },
      include: { status: true },
      orderBy: { effective_from: 'desc' },
    });

    return res.status(200).json({ success: true, data: history });
  } catch (err) {
    console.error('GetStatusHistory error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const GetCurrentStatusSnapshot = async (req, res) => {
  try {
    const farmId = req.user.farmId;

    const openStatuses = await prisma.statusHistory.findMany({
      where: { effective_to: null, deleted_at: null, animal: { farm_id: farmId, deleted_at: null } },
      include: { status: true, animal: { select: { id: true, tag_number: true, name: true } } },
    });

    const summary = openStatuses.reduce((acc, row) => {
      const key = row.status.name;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({ success: true, data: { summary, animals: openStatuses } });
  } catch (err) {
    console.error('GetCurrentStatusSnapshot error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export { RecordStatus, GetStatusHistory, GetCurrentStatusSnapshot };