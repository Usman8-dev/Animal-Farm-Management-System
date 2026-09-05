import { Router } from 'express';
import { IsLoginUser } from '../Middlewares/IsLoginUser.js';
import { authorizeRoles } from '../Middlewares/Authorizeroles.js';
import { validate } from '../Middlewares/validate.js';
import {
  ListVaccinationTypes,
  GetVaccinationType,
  CreateVaccinationType,
  UpdateVaccinationType,
  DeleteVaccinationType,
  ListScheduleRules,
  CreateScheduleRule,
  UpdateScheduleRule,
  DeleteScheduleRule,
  ListVaccinations,
  ListAnimalVaccinations,
  CreateVaccination,
  UpdateVaccination,
  DeleteVaccination,
  GetDosesDue,
  GetAnimalNextDue,
  GetCompliance,
  GetCost,
  GetByBatch,
  GetSeasonal,
} from '../Controller/VaccinationController.js';

import {
  VaccinationTypeIdParam,
  RuleIdParam,
  VaccinationIdParam,
  AnimalIdParam,
  VaccinationTypeValidator,
  ScheduleRuleValidator,
  UpdateScheduleRuleValidator,
  CreateVaccinationValidator,
  UpdateVaccinationValidator,
  DosesDueQuery,
  CostQuery,
  BatchParam,
} from '../Validators/VaccinationValidators.js';

const router = Router();

router.use(IsLoginUser);

// ── Module 5: Vaccination — Types (master data) ──────────────
// Read: any farm member | Write: owner + manager.

router.get('/vaccination-types', ListVaccinationTypes);
router.get('/vaccination-types/:id', VaccinationTypeIdParam, validate, GetVaccinationType);
router.post('/vaccination-types', authorizeRoles('owner', 'manager'), VaccinationTypeValidator, validate, CreateVaccinationType);
router.put('/vaccination-types/:id', authorizeRoles('owner', 'manager'), VaccinationTypeIdParam, VaccinationTypeValidator, validate, UpdateVaccinationType);
router.delete('/vaccination-types/:id', authorizeRoles('owner', 'manager'), VaccinationTypeIdParam, validate, DeleteVaccinationType);

// ── Module 5: Vaccination — Schedule Rules (master data) ─────

router.get('/schedule-rules', ListScheduleRules);
router.post('/schedule-rules', authorizeRoles('owner', 'manager'), ScheduleRuleValidator, validate, CreateScheduleRule);
router.put('/schedule-rules/:id', authorizeRoles('owner', 'manager'), RuleIdParam, UpdateScheduleRuleValidator, validate, UpdateScheduleRule);
router.delete('/schedule-rules/:id', authorizeRoles('owner', 'manager'), RuleIdParam, validate, DeleteScheduleRule);

// ── Module 5: Vaccination — Administered doses ───────────────

router.get('/vaccinations', ListVaccinations);
router.post('/vaccinations', authorizeRoles('owner', 'manager', 'worker'), CreateVaccinationValidator, validate, CreateVaccination);
router.put('/vaccinations/:id', authorizeRoles('owner', 'manager', 'worker'), VaccinationIdParam, UpdateVaccinationValidator, validate, UpdateVaccination);
router.delete('/vaccinations/:id', authorizeRoles('owner', 'manager'), VaccinationIdParam, validate, DeleteVaccination);

router.get('/animals/:id/vaccinations', AnimalIdParam, validate, ListAnimalVaccinations);
router.get('/animals/:id/next-due', AnimalIdParam, validate, GetAnimalNextDue);

// ── Module 5: Vaccination — Scheduling & Reports ─────────────

router.get('/doses-due', DosesDueQuery, validate, GetDosesDue);
router.get('/reports/vaccination/compliance', GetCompliance);
router.get('/reports/vaccination/cost', CostQuery, validate, GetCost);
router.get('/reports/vaccination/seasonal', GetSeasonal);
router.get('/reports/vaccination/by-batch/:batch', BatchParam, validate, GetByBatch);

export default router;