import { body, param, query } from 'express-validator';

const AnimalIdParam = [
  param('id').isInt({ min: 1 }).withMessage('Invalid animal id'),
];

const WeightIdParam = [
  param('id').isInt({ min: 1 }).withMessage('Invalid weight id'),
];

const ValuationIdParam = [
  param('id').isInt({ min: 1 }).withMessage('Invalid valuation id'),
];

const AddWeightValidator = [
  body('weight_kg')
    .notEmpty()
    .withMessage('weight_kg is required')
    .isFloat({ gt: 0 })
    .withMessage('weight_kg must be greater than 0'),
  body('effective_from')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('effective_from must be a valid date'),
  body('source')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage('source is too long'),
  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('notes is too long'),
];

const UpdateWeightValidator = [
  body('weight_kg')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('weight_kg must be greater than 0'),
  body('effective_from')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('effective_from must be a valid date'),
  body('source')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 80 }),
  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 }),
];

const AddValuationValidator = [
  body('value_amount')
    .notEmpty()
    .withMessage('value_amount is required')
    .isFloat({ min: 0 })
    .withMessage('value_amount must be 0 or greater'),
  body('basis')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 80 })
    .withMessage('basis is too long'),
  body('effective_from')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('effective_from must be a valid date'),
  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 }),
];

const UpdateValuationValidator = [
  body('value_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('value_amount must be 0 or greater'),
  body('basis')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 80 }),
  body('effective_from')
    .optional({ nullable: true })
    .isISO8601(),
  body('notes')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 500 }),
];

const GrowthTrendQueryValidator = [
  query('animal_id').isInt({ min: 1 }).withMessage('animal_id is required'),
];

export {
  AnimalIdParam,
  WeightIdParam,
  ValuationIdParam,
  AddWeightValidator,
  UpdateWeightValidator,
  AddValuationValidator,
  UpdateValuationValidator,
  GrowthTrendQueryValidator,
};