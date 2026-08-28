import { Router } from 'express';
import { IsLoginUser } from '../Middlewares/IsLoginUser.js';
import { authorizeRoles } from '../Middlewares/Authorizeroles.js';
import { validate } from '../Middlewares/validate.js';
import {
  ListPregnancies,
  ListDamPregnancies,
  GetPregnancy,
  CreatePregnancy,
  UpdatePregnancy,
  ConfirmPregnancy,
  ClosePregnancy,
  DeletePregnancy,
  CreateBirth,
  GetBirth,
  AddKid,
  UpdateKid,
  RegisterKid,
  UpcomingDeliveries,
  SuccessRate,
  BirthOutcomes,
  MaturityAlerts,
} from '../Controller/BreedingController.js';

import {
  AnimalIdParam,
  PregnancyIdParam,
  BirthIdParam,
  KidIdParam,
  CreatePregnancyValidator,
  UpdatePregnancyValidator,
  ConfirmPregnancyValidator,
  ClosePregnancyValidator,
  CreateBirthValidator,
  AddKidValidator,
  UpdateKidValidator,
  RegisterKidValidator,
  UpcomingDeliveriesQuery,
} from '../Validators/BreedingValidators.js';

const router = Router();

// Every route in this module requires a logged-in user.
router.use(IsLoginUser);

// ── Module 4: Breeding — Pregnancies ─────────────────────────
// Read: any logged-in farm member | Write: owner + manager.

router.get('/pregnancies', ListPregnancies);

router.post(
  '/pregnancies',
  authorizeRoles('owner', 'manager'),
  CreatePregnancyValidator,
  validate,
  CreatePregnancy
);

router.get('/pregnancies/:id', PregnancyIdParam, validate, GetPregnancy);

router.put(
  '/pregnancies/:id',
  authorizeRoles('owner', 'manager'),
  PregnancyIdParam,
  UpdatePregnancyValidator,
  validate,
  UpdatePregnancy
);

router.put(
  '/pregnancies/:id/confirm',
  authorizeRoles('owner', 'manager'),
  PregnancyIdParam,
  ConfirmPregnancyValidator,
  validate,
  ConfirmPregnancy
);

router.put(
  '/pregnancies/:id/close',
  authorizeRoles('owner', 'manager'),
  PregnancyIdParam,
  ClosePregnancyValidator,
  validate,
  ClosePregnancy
);

router.delete(
  '/pregnancies/:id',
  authorizeRoles('owner', 'manager'),
  PregnancyIdParam,
  validate,
  DeletePregnancy
);

router.get('/animals/:id/pregnancies', AnimalIdParam, validate, ListDamPregnancies);

// ── Module 4: Breeding — Births & Kids ───────────────────────

router.post(
  '/births',
  authorizeRoles('owner', 'manager'),
  CreateBirthValidator,
  validate,
  CreateBirth
);

router.get('/births/:id', BirthIdParam, validate, GetBirth);

router.post(
  '/births/:id/kids',
  authorizeRoles('owner', 'manager'),
  BirthIdParam,
  AddKidValidator,
  validate,
  AddKid
);

router.put(
  '/birth-kids/:id',
  authorizeRoles('owner', 'manager'),
  KidIdParam,
  UpdateKidValidator,
  validate,
  UpdateKid
);

router.post(
  '/birth-kids/:id/register-animal',
  authorizeRoles('owner', 'manager'),
  KidIdParam,
  RegisterKidValidator,
  validate,
  RegisterKid
);

// ── Module 4: Breeding — Reports ─────────────────────────────

router.get('/reports/breeding/upcoming-deliveries', UpcomingDeliveriesQuery, validate, UpcomingDeliveries);
router.get('/reports/breeding/success-rate', SuccessRate);
router.get('/reports/breeding/birth-outcomes', BirthOutcomes);
router.get('/reports/breeding/maturity-alerts', MaturityAlerts);

export default router;