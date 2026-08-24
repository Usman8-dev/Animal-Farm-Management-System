import { Router } from 'express';
import { IsLoginUser } from '../Middlewares/IsLoginUser.js';
import { authorizeRoles } from '../Middlewares/Authorizeroles.js';
import { validate } from '../Middlewares/validate.js';

import { AnimalStatusValidator, RecordStatusValidator } from '../Validators/StatusValidators.js';

import {
  ListAnimalStatuses,
  GetAnimalStatus,
  CreateAnimalStatus,
  UpdateAnimalStatus,
  DeleteAnimalStatus,
} from '../Controller/AnimalStatusController.js';

import {
  RecordStatus,
  GetStatusHistory,
  GetCurrentStatusSnapshot,
} from '../Controller/StatusHistoryController.js';

const router = Router();

router.use(IsLoginUser);

router.get('/animal-statuses', ListAnimalStatuses);
router.get('/animal-statuses/:id', GetAnimalStatus);
router.post('/animal-statuses', authorizeRoles('owner', 'manager'), AnimalStatusValidator, validate, CreateAnimalStatus);
router.put('/animal-statuses/:id', authorizeRoles('owner', 'manager'), AnimalStatusValidator, validate, UpdateAnimalStatus);
router.delete('/animal-statuses/:id', authorizeRoles('owner', 'manager'), DeleteAnimalStatus);

router.post('/animals/:id/status', authorizeRoles('owner', 'manager', 'worker'), RecordStatusValidator, validate, RecordStatus);
router.get('/animals/:id/status-history', GetStatusHistory);

router.get('/reports/status/current', GetCurrentStatusSnapshot);

export default router;
