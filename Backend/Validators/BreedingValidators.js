import { body, param, query } from 'express-validator';

const AnimalIdParam = [param('id').isInt({ min: 1 }).withMessage('Invalid animal id')];
const PregnancyIdParam = [param('id').isInt({ min: 1 }).withMessage('Invalid pregnancy id')];
const BirthIdParam = [param('id').isInt({ min: 1 }).withMessage('Invalid birth id')];
const KidIdParam = [param('id').isInt({ min: 1 }).withMessage('Invalid kid id')];

const CreatePregnancyValidator = [
  body('dam_id').isInt({ min: 1 }).withMessage('dam_id is required'),
  body('sire_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('sire_id must be a valid id'),
  body('sire_ref').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 120 }).withMessage('sire_ref is too long'),
  body('service_date').notEmpty().withMessage('service_date is required').isISO8601().withMessage('service_date must be a valid date'),
  body('notes').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('notes is too long'),
];

const UpdatePregnancyValidator = [
  body('sire_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('sire_id must be a valid id'),
  body('sire_ref').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 120 }).withMessage('sire_ref is too long'),
  body('service_date').optional({ nullable: true }).isISO8601().withMessage('service_date must be a valid date'),
  body('notes').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('notes is too long'),
];

const ConfirmPregnancyValidator = [
  body('confirmed_date').optional({ nullable: true }).isISO8601().withMessage('confirmed_date must be a valid date'),
];

const ClosePregnancyValidator = [
  body('outcome')
    .notEmpty().withMessage('outcome is required')
    .isIn(['LIVE_BIRTH', 'STILLBIRTH', 'ABORTED', 'NOT_PREGNANT'])
    .withMessage('outcome must be LIVE_BIRTH, STILLBIRTH, ABORTED or NOT_PREGNANT'),
  body('outcome_date').optional({ nullable: true }).isISO8601().withMessage('outcome_date must be a valid date'),
];

const CreateBirthValidator = [
  body('pregnancy_id').isInt({ min: 1 }).withMessage('pregnancy_id is required'),
  body('birth_date').optional({ nullable: true }).isISO8601().withMessage('birth_date must be a valid date'),
  body('notes').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('notes is too long'),
];

const AddKidValidator = [
  body('is_stillborn').optional().isBoolean().withMessage('is_stillborn must be a boolean'),
  body('gender').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 50 }).withMessage('gender is too long'),
  body('birth_weight_kg')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('birth_weight_kg must be 0 or greater'),
  body('notes').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('notes is too long'),
];

const UpdateKidValidator = [
  body('is_stillborn').optional().isBoolean().withMessage('is_stillborn must be a boolean'),
  body('gender').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 50 }).withMessage('gender is too long'),
  body('birth_weight_kg')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('birth_weight_kg must be 0 or greater'),
  body('notes').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('notes is too long'),
];

const RegisterKidValidator = [
  body('tag_number').notEmpty().withMessage('tag_number is required').trim().isLength({ max: 40 }).withMessage('tag_number is too long'),
  body('name').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 80 }).withMessage('name is too long'),
  body('gender_id').isInt({ min: 1 }).withMessage('gender_id is required'),
  body('notes').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('notes is too long'),
];

const UpcomingDeliveriesQuery = [
  query('days').optional().isInt({ min: 1 }).withMessage('days must be a positive integer'),
];

export {
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
};