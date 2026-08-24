import { Router } from 'express';
import { IsLoginUser } from '../Middlewares/IsLoginUser.js';
import { authorizeRoles } from '../Middlewares/Authorizeroles.js'; // see note at bottom
import { validate } from '../Middlewares/validate.js';
import {
  ListWeights,
  AddWeight,
  UpdateWeight,
  DeleteWeight,
  ListValuations,
  AddValuation,
  UpdateValuation,
  DeleteValuation,
  GetGrowthTrend,
  GetTotalHerdValue,
} from '../Controller/WeightValuationController.js';

import {
  AnimalIdParam,
  WeightIdParam,
  ValuationIdParam,
  AddWeightValidator,
  UpdateWeightValidator,
  AddValuationValidator,
  UpdateValuationValidator,
  GrowthTrendQueryValidator,
} from '../Validators/WeightValuationValidators.js';

const router = Router();

// Every route in this module requires a logged-in user
router.use(IsLoginUser);

// ── Module 3: Weight ─────────────────────────────────────────
// Read: any logged-in farm member | Write: owner + manager

router.get(
  '/animals/:id/weights',
  AnimalIdParam,
  validate,
  ListWeights
);

router.post(
  '/animals/:id/weights',
  authorizeRoles('owner', 'manager'),
  AnimalIdParam,
  AddWeightValidator,
  validate,
  AddWeight
);

router.put(
  '/weights/:id',
  authorizeRoles('owner', 'manager'),
  WeightIdParam,
  UpdateWeightValidator,
  validate,
  UpdateWeight
);

router.delete(
  '/weights/:id',
  authorizeRoles('owner', 'manager'),
  WeightIdParam,
  validate,
  DeleteWeight
);

// ── Module 3: Valuation ──────────────────────────────────────

router.get(
  '/animals/:id/valuations',
  AnimalIdParam,
  validate,
  ListValuations
);

router.post(
  '/animals/:id/valuations',
  authorizeRoles('owner', 'manager'),
  AnimalIdParam,
  AddValuationValidator,
  validate,
  AddValuation
);

router.put(
  '/valuations/:id',
  authorizeRoles('owner', 'manager'),
  ValuationIdParam,
  UpdateValuationValidator,
  validate,
  UpdateValuation
);

router.delete(
  '/valuations/:id',
  authorizeRoles('owner', 'manager'),
  ValuationIdParam,
  validate,
  DeleteValuation
);

// ── Module 3: Reports ────────────────────────────────────────

router.get(
  '/reports/weight/growth-trend',
  GrowthTrendQueryValidator,
  validate,
  GetGrowthTrend
);

router.get(
  '/reports/valuation/total-herd-value',
  GetTotalHerdValue
);

export default router;
