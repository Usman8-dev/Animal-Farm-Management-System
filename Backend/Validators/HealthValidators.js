import { body, param, query } from 'express-validator';

const IdParam = [param('id').isInt({ min: 1 }).withMessage('Invalid id')];

const DiseaseIdParam = [param('id').isInt({ min: 1 }).withMessage('Invalid disease id')];
const MedicineIdParam = [param('id').isInt({ min: 1 }).withMessage('Invalid medicine id')];
const CaseIdParam = [param('id').isInt({ min: 1 }).withMessage('Invalid health case id')];
const TreatmentIdParam = [param('id').isInt({ min: 1 }).withMessage('Invalid treatment id')];
const AnimalIdParam = [param('id').isInt({ min: 1 }).withMessage('Invalid animal id')];

const DISEASE_CATEGORIES = [
  'BACTERIAL',
  'VIRAL',
  'PARASITIC',
  'FUNGAL',
  'NUTRITIONAL',
  'METABOLIC',
  'OTHER',
];

const CASE_STATUSES = ['OPEN', 'UNDER_TREATMENT', 'RECOVERED', 'CHRONIC', 'DIED', 'CULLED'];
const SEVERITIES = ['MILD', 'MODERATE', 'SEVERE', 'CRITICAL'];
const ROUTES = ['ORAL', 'INJECTION_IM', 'INJECTION_IV', 'SUBCUTANEOUS', 'TOPICAL', 'OTHER'];

// ── Disease catalogue (master data) ──────────────────────────

const DiseaseValidator = [
  body('code')
    .notEmpty().withMessage('Code is required')
    .trim().isLength({ max: 40 }).withMessage('Code is too long'),
  body('name')
    .notEmpty().withMessage('Name is required')
    .trim().isLength({ max: 120 }).withMessage('Name is too long'),
  body('category').optional({ nullable: true }).isIn(DISEASE_CATEGORIES).withMessage('Invalid category'),
  body('symptoms')
    .optional({ nullable: true, checkFalsy: true })
    .trim().isLength({ max: 1000 }).withMessage('Symptoms are too long'),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .trim().isLength({ max: 1000 }).withMessage('Description is too long'),
  body('is_contagious').optional().isBoolean().withMessage('is_contagious must be a boolean'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
];

const UpdateDiseaseValidator = [
  body('code').optional().notEmpty().withMessage('Code cannot be empty')
    .trim().isLength({ max: 40 }).withMessage('Code is too long'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty')
    .trim().isLength({ max: 120 }).withMessage('Name is too long'),
  body('category').optional({ nullable: true }).isIn(DISEASE_CATEGORIES).withMessage('Invalid category'),
  body('symptoms').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 1000 }),
  body('description').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 1000 }),
  body('is_contagious').optional().isBoolean().withMessage('is_contagious must be a boolean'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
];

// ── Medicine catalogue (master data) ─────────────────────────

const MedicineValidator = [
  body('code')
    .notEmpty().withMessage('Code is required')
    .trim().isLength({ max: 40 }).withMessage('Code is too long'),
  body('name')
    .notEmpty().withMessage('Name is required')
    .trim().isLength({ max: 120 }).withMessage('Name is too long'),
  body('unit')
    .optional({ nullable: true, checkFalsy: true })
    .trim().isLength({ max: 30 }).withMessage('Unit is too long'),
  body('withdrawal_days')
    .optional({ nullable: true })
    .isInt({ min: 0 }).withMessage('withdrawal_days must be 0 or greater'),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .trim().isLength({ max: 1000 }).withMessage('Description is too long'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
];

const UpdateMedicineValidator = [
  body('code').optional().notEmpty().withMessage('Code cannot be empty')
    .trim().isLength({ max: 40 }).withMessage('Code is too long'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty')
    .trim().isLength({ max: 120 }).withMessage('Name is too long'),
  body('unit').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 30 }),
  body('withdrawal_days').optional({ nullable: true }).isInt({ min: 0 })
    .withMessage('withdrawal_days must be 0 or greater'),
  body('description').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 1000 }),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
];

// ── Health cases ─────────────────────────────────────────────

const CreateCaseValidator = [
  body('animal_id').isInt({ min: 1 }).withMessage('animal_id is required'),
  body('disease_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('disease_id must be a valid id'),
  body('diagnosis').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 160 })
    .withMessage('diagnosis is too long'),
  body('category').optional({ nullable: true }).isIn(DISEASE_CATEGORIES).withMessage('Invalid category'),
  body('severity').optional({ nullable: true }).isIn(SEVERITIES).withMessage('Invalid severity'),
  body('status').optional({ nullable: true }).isIn(CASE_STATUSES).withMessage('Invalid status'),
  body('diagnosed_on').optional({ nullable: true }).isISO8601().withMessage('diagnosed_on must be a valid date'),
  body('diagnosed_by').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 120 })
    .withMessage('diagnosed_by is too long'),
  body('is_contagious').optional().isBoolean().withMessage('is_contagious must be a boolean'),
  body('is_quarantined').optional().isBoolean().withMessage('is_quarantined must be a boolean'),
  body('symptoms').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 1000 }),
  body('notes').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 1000 }),
];

const UpdateCaseValidator = [
  body('animal_id').optional().isInt({ min: 1 }).withMessage('animal_id must be a valid id'),
  body('disease_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('disease_id must be a valid id'),
  body('diagnosis').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 160 }),
  body('category').optional({ nullable: true }).isIn(DISEASE_CATEGORIES).withMessage('Invalid category'),
  body('severity').optional({ nullable: true }).isIn(SEVERITIES).withMessage('Invalid severity'),
  body('diagnosed_on').optional({ nullable: true }).isISO8601().withMessage('diagnosed_on must be a valid date'),
  body('diagnosed_by').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 120 }),
  body('is_contagious').optional().isBoolean().withMessage('is_contagious must be a boolean'),
  body('is_quarantined').optional().isBoolean().withMessage('is_quarantined must be a boolean'),
  body('symptoms').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 1000 }),
  body('notes').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 1000 }),
];

const ChangeCaseStatusValidator = [
  body('status').notEmpty().withMessage('status is required')
    .isIn(CASE_STATUSES).withMessage('Invalid status'),
  body('outcome_date').optional({ nullable: true }).isISO8601().withMessage('outcome_date must be a valid date'),
  body('outcome_notes').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 1000 }),
  body('is_quarantined').optional().isBoolean().withMessage('is_quarantined must be a boolean'),
];

// ── Treatments ───────────────────────────────────────────────

const CreateTreatmentValidator = [
  body('medicine_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('medicine_id must be a valid id'),
  body('medicine_name').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 120 })
    .withMessage('medicine_name is too long'),
  body('dosage').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 80 })
    .withMessage('dosage is too long'),
  body('route').optional({ nullable: true }).isIn(ROUTES).withMessage('Invalid route'),
  body('frequency').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 80 })
    .withMessage('frequency is too long'),
  body('start_date').optional({ nullable: true }).isISO8601().withMessage('start_date must be a valid date'),
  body('end_date').optional({ nullable: true }).isISO8601().withMessage('end_date must be a valid date'),
  body('administered_by').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 120 })
    .withMessage('administered_by is too long'),
  body('withdrawal_days').optional({ nullable: true }).isInt({ min: 0 })
    .withMessage('withdrawal_days must be 0 or greater'),
  body('cost').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('cost must be 0 or greater'),
  body('notes').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 1000 }),
];

const UpdateTreatmentValidator = [
  body('medicine_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('medicine_id must be a valid id'),
  body('medicine_name').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 120 }),
  body('dosage').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 80 }),
  body('route').optional({ nullable: true }).isIn(ROUTES).withMessage('Invalid route'),
  body('frequency').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 80 }),
  body('start_date').optional({ nullable: true }).isISO8601().withMessage('start_date must be a valid date'),
  body('end_date').optional({ nullable: true }).isISO8601().withMessage('end_date must be a valid date'),
  body('administered_by').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 120 }),
  body('withdrawal_days').optional({ nullable: true }).isInt({ min: 0 })
    .withMessage('withdrawal_days must be 0 or greater'),
  body('cost').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('cost must be 0 or greater'),
  body('notes').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 1000 }),
];

// ── Queries ──────────────────────────────────────────────────

const CaseListQuery = [
  query('status').optional({ nullable: true }).isIn(CASE_STATUSES).withMessage('Invalid status filter'),
  query('severity').optional({ nullable: true }).isIn(SEVERITIES).withMessage('Invalid severity filter'),
  query('category').optional({ nullable: true }).isIn(DISEASE_CATEGORIES).withMessage('Invalid category filter'),
  query('animal_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('animal_id must be a valid id'),
  query('disease_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('disease_id must be a valid id'),
  query('from').optional({ nullable: true }).isISO8601().withMessage('from must be a valid date'),
  query('to').optional({ nullable: true }).isISO8601().withMessage('to must be a valid date'),
];

const RangeQuery = [
  query('from').optional({ nullable: true }).isISO8601().withMessage('from must be a valid date'),
  query('to').optional({ nullable: true }).isISO8601().withMessage('to must be a valid date'),
  query('days').optional({ nullable: true }).isInt({ min: 0 }).withMessage('days must be 0 or greater'),
];

export {
  IdParam,
  DiseaseIdParam,
  MedicineIdParam,
  CaseIdParam,
  TreatmentIdParam,
  AnimalIdParam,
  DISEASE_CATEGORIES,
  CASE_STATUSES,
  SEVERITIES,
  ROUTES,
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
};
