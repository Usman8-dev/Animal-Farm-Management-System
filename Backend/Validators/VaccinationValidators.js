import { body, param, query } from 'express-validator';

const IdParam = [param('id').isInt({ min: 1 }).withMessage('Invalid id')];

const VaccinationTypeIdParam = [param('id').isInt({ min: 1 }).withMessage('Invalid vaccination type id')];
const RuleIdParam = [param('id').isInt({ min: 1 }).withMessage('Invalid schedule rule id')];
const VaccinationIdParam = [param('id').isInt({ min: 1 }).withMessage('Invalid vaccination id')];
const AnimalIdParam = [param('id').isInt({ min: 1 }).withMessage('Invalid animal id')];

const VaccinationTypeValidator = [
  body('code')
    .notEmpty().withMessage('Code is required')
    .trim().isLength({ max: 40 }).withMessage('Code is too long'),
  body('name')
    .notEmpty().withMessage('Name is required')
    .trim().isLength({ max: 120 }).withMessage('Name is too long'),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .trim().isLength({ max: 500 }).withMessage('Description is too long'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
];

const ScheduleRuleValidator = [
  body('vaccination_type_id').isInt({ min: 1 }).withMessage('vaccination_type_id is required'),
  body('animal_type_id').isInt({ min: 1 }).withMessage('animal_type_id is required'),
  body('dose_number').isInt({ min: 1 }).withMessage('dose_number must be 1 or greater'),
  body('age_days').isInt({ min: 0 }).withMessage('age_days must be 0 or greater'),
  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .trim().isLength({ max: 500 }).withMessage('notes is too long'),
];

const UpdateScheduleRuleValidator = [
  body('vaccination_type_id').optional().isInt({ min: 1 }).withMessage('vaccination_type_id must be valid'),
  body('animal_type_id').optional().isInt({ min: 1 }).withMessage('animal_type_id must be valid'),
  body('dose_number').optional().isInt({ min: 1 }).withMessage('dose_number must be 1 or greater'),
  body('age_days').optional().isInt({ min: 0 }).withMessage('age_days must be 0 or greater'),
  body('notes').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 500 }),
];

const CreateVaccinationValidator = [
  body('animal_id').isInt({ min: 1 }).withMessage('animal_id is required'),
  body('vaccination_type_id').isInt({ min: 1 }).withMessage('vaccination_type_id is required'),
  body('category').optional({ nullable: true }).isIn(['NORMAL', 'SEASONAL']).withMessage('category must be NORMAL or SEASONAL'),
  body('administered_date').optional({ nullable: true }).isISO8601().withMessage('administered_date must be a valid date'),
  body('next_due_date').optional({ nullable: true }).isISO8601().withMessage('next_due_date must be a valid date'),
  body('dose_number').optional({ nullable: true }).isInt({ min: 1 }).withMessage('dose_number must be 1 or greater'),
  body('batch_number').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 80 }).withMessage('batch_number is too long'),
  body('administered_by').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 120 }).withMessage('administered_by is too long'),
  body('cost').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('cost must be 0 or greater'),
  body('notes').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('notes is too long'),
];

const UpdateVaccinationValidator = [
  body('animal_id').optional().isInt({ min: 1 }).withMessage('animal_id must be valid'),
  body('vaccination_type_id').optional().isInt({ min: 1 }).withMessage('vaccination_type_id must be valid'),
  body('category').optional({ nullable: true }).isIn(['NORMAL', 'SEASONAL']).withMessage('category must be NORMAL or SEASONAL'),
  body('administered_date').optional({ nullable: true }).isISO8601().withMessage('administered_date must be a valid date'),
  body('next_due_date').optional({ nullable: true }).isISO8601().withMessage('next_due_date must be a valid date'),
  body('dose_number').optional({ nullable: true }).isInt({ min: 1 }).withMessage('dose_number must be 1 or greater'),
  body('batch_number').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 80 }),
  body('administered_by').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 120 }),
  body('cost').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('cost must be 0 or greater'),
  body('notes').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 500 }),
];

const DosesDueQuery = [
  query('days').optional().isInt({ min: 1 }).withMessage('days must be a positive integer'),
];

const CostQuery = [
  query('from').optional({ nullable: true }).isISO8601().withMessage('from must be a valid date'),
  query('to').optional({ nullable: true }).isISO8601().withMessage('to must be a valid date'),
];

const BatchParam = [param('batch').isString().trim().notEmpty().withMessage('batch number is required').isLength({ max: 80 })];

export {
  IdParam,
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
};