import { Router } from 'express';
import { IsLoginUser } from '../Middlewares/IsLoginUser.js';
import { authorizeRoles } from '../Middlewares/Authorizeroles.js';
import { validate } from '../Middlewares/validate.js';
import {
  ListDiseases,
  GetDisease,
  CreateDisease,
  UpdateDisease,
  DeleteDisease,
  ListMedicines,
  CreateMedicine,
  UpdateMedicine,
  DeleteMedicine,
  ListCases,
  GetCase,
  CreateCase,
  UpdateCase,
  ChangeCaseStatus,
  DeleteCase,
  AddTreatment,
  UpdateTreatment,
  DeleteTreatment,
  GetAnimalHealth,
  GetOverview,
  GetDiseaseFrequency,
  GetActiveCases,
  GetOutcomes,
  GetTreatmentCost,
  GetQuarantine,
  GetWithdrawal,
} from '../Controller/HealthController.js';

import {
  DiseaseIdParam,
  MedicineIdParam,
  CaseIdParam,
  TreatmentIdParam,
  AnimalIdParam,
  DiseaseValidator,
  UpdateDiseaseValidator,
  MedicineValidator,
  UpdateMedicineValidator,
  CreateCaseValidator,
  UpdateCaseValidator,
  ChangeCaseStatusValidator,
  CreateTreatmentValidator,
  UpdateTreatmentValidator,
  CaseListQuery,
  RangeQuery,
} from '../Validators/HealthValidators.js';

const router = Router();

// Every route in this module requires a logged-in user (farm scoped).
router.use(IsLoginUser);

// ── Module 6: Health & Disease — Disease catalogue (master data) ──
// Read: any farm member | Write: owner + manager.

router.get('/diseases', ListDiseases);
router.get('/diseases/:id', DiseaseIdParam, validate, GetDisease);
router.post(
  '/diseases',
  authorizeRoles('owner', 'manager'),
  DiseaseValidator,
  validate,
  CreateDisease
);
router.put(
  '/diseases/:id',
  authorizeRoles('owner', 'manager'),
  DiseaseIdParam,
  UpdateDiseaseValidator,
  validate,
  UpdateDisease
);
router.delete(
  '/diseases/:id',
  authorizeRoles('owner', 'manager'),
  DiseaseIdParam,
  validate,
  DeleteDisease
);

// ── Module 6: Health & Disease — Medicine catalogue (master data) ──

router.get('/medicines', ListMedicines);
router.post(
  '/medicines',
  authorizeRoles('owner', 'manager'),
  MedicineValidator,
  validate,
  CreateMedicine
);
router.put(
  '/medicines/:id',
  authorizeRoles('owner', 'manager'),
  MedicineIdParam,
  UpdateMedicineValidator,
  validate,
  UpdateMedicine
);
router.delete(
  '/medicines/:id',
  authorizeRoles('owner', 'manager'),
  MedicineIdParam,
  validate,
  DeleteMedicine
);

// ── Module 6: Health & Disease — Diagnosed cases ─────────────

router.get('/cases', CaseListQuery, validate, ListCases);
router.post(
  '/cases',
  authorizeRoles('owner', 'manager', 'worker'),
  CreateCaseValidator,
  validate,
  CreateCase
);
router.get('/cases/:id', CaseIdParam, validate, GetCase);
router.put(
  '/cases/:id',
  authorizeRoles('owner', 'manager', 'worker'),
  CaseIdParam,
  UpdateCaseValidator,
  validate,
  UpdateCase
);
// Closing / reopening a case records the outcome — managers and owners only.
router.put(
  '/cases/:id/status',
  authorizeRoles('owner', 'manager'),
  CaseIdParam,
  ChangeCaseStatusValidator,
  validate,
  ChangeCaseStatus
);
router.delete(
  '/cases/:id',
  authorizeRoles('owner', 'manager'),
  CaseIdParam,
  validate,
  DeleteCase
);

// ── Module 6: Health & Disease — Treatments per case ─────────

router.post(
  '/cases/:id/treatments',
  authorizeRoles('owner', 'manager', 'worker'),
  CaseIdParam,
  CreateTreatmentValidator,
  validate,
  AddTreatment
);
router.put(
  '/treatments/:id',
  authorizeRoles('owner', 'manager', 'worker'),
  TreatmentIdParam,
  UpdateTreatmentValidator,
  validate,
  UpdateTreatment
);
router.delete(
  '/treatments/:id',
  authorizeRoles('owner', 'manager'),
  TreatmentIdParam,
  validate,
  DeleteTreatment
);

// ── Module 6: Health & Disease — Per-animal history ──────────

router.get('/animals/:id/health', AnimalIdParam, validate, GetAnimalHealth);

// ── Module 6: Health & Disease — Reports ─────────────────────

router.get('/reports/health/overview', GetOverview);
router.get('/reports/health/disease-frequency', RangeQuery, validate, GetDiseaseFrequency);
router.get('/reports/health/active-cases', GetActiveCases);
router.get('/reports/health/outcomes', RangeQuery, validate, GetOutcomes);
router.get('/reports/health/treatment-cost', RangeQuery, validate, GetTreatmentCost);
router.get('/reports/health/quarantine', GetQuarantine);
router.get('/reports/health/withdrawal', RangeQuery, validate, GetWithdrawal);

export default router;
