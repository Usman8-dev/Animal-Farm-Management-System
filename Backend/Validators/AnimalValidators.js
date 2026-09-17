import { body, param, query } from 'express-validator';

// ── Animal Type ──────────────────────────────────────────────

export const AnimalTypeValidator = [
  body('code')
    .trim()
    .notEmpty().withMessage('Code is required')
    .isLength({ max: 20 }).withMessage('Code must be 20 characters or fewer'),

  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),

  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be true or false'),
];

// ── Breed ─────────────────────────────────────────────────────

export const BreedValidator = [
  body('animal_type_id')
    .notEmpty().withMessage('animal_type_id is required')
    .isInt({ min: 1 }).withMessage('animal_type_id must be a valid id'),

  body('code')
    .trim()
    .notEmpty().withMessage('Code is required'),

  body('name')
    .trim()
    .notEmpty().withMessage('Name is required'),

  body('gestation_days')
    .notEmpty().withMessage('gestation_days is required')
    .isInt({ min: 1 }).withMessage('gestation_days must be a positive integer'),

  body('maturity_days')
    .notEmpty().withMessage('maturity_days is required')
    .isInt({ min: 1 }).withMessage('maturity_days must be a positive integer'),

  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be true or false'),
];

// Gender Validator 

export const GenderValidator = [
  body('code')
    .trim()
    .notEmpty().withMessage('Code is required')
    .isLength({ max: 20 }).withMessage('Code must be 20 characters or fewer')
    .toUpperCase(),

  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 30 }).withMessage('Name must be 2-30 characters'),
];

// ── Animal ────────────────────────────────────────────────────

export const AnimalValidator = [
  body('tag_number')
    .trim()
    .notEmpty().withMessage('Tag number is required')
    .isLength({ max: 40 }).withMessage('Tag number must be 40 characters or fewer'),

  body('name')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 80 }).withMessage('Name must be 80 characters or fewer'),

  body('animal_type_id')
    .notEmpty().withMessage('animal_type_id is required')
    .isInt({ min: 1 }).withMessage('animal_type_id must be a valid id'),

  body('breed_id')
    .notEmpty().withMessage('breed_id is required')
    .isInt({ min: 1 }).withMessage('breed_id must be a valid id'),

  body('gender_id')
    .notEmpty().withMessage('gender_id is required')
    .isInt({ min: 1 }).withMessage('gender_id must be a valid id'),

  body('birth_date')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('birth_date must be a valid date')
    .custom((value) => new Date(value) <= new Date())
    .withMessage('birth_date cannot be in the future'),

  body('acquisition_type')
    .notEmpty().withMessage('acquisition_type is required')
    .isIn(['BORN_IN_FARM', 'PURCHASED'])
    .withMessage('acquisition_type must be BORN_IN_FARM or PURCHASED'),

  body('acquired_on')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('acquired_on must be a valid date'),

  body('mother_id')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('mother_id must be a valid id'),

  body('father_id')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('father_id must be a valid id'),

  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 }).withMessage('Notes must be 2000 characters or fewer'),
];

export const AnimalListQueryValidator = [
  query('animal_type_id').optional().isInt({ min: 1 }),
  query('breed_id').optional().isInt({ min: 1 }),
  query('gender_id').optional().isInt({ min: 1 }),
  query('acquisition_type').optional().isIn(['BORN_IN_FARM', 'PURCHASED']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

export const AnimalIdParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid animal id'),
];

// ── Animal Image ──────────────────────────────────────────────
// Accepts either a pasted URL (application/json) or an uploaded
// device image file (multipart/form-data, field "image").

export const AnimalImageValidator = [
  body('url')
    .optional({ checkFalsy: true })
    .trim()
    .isURL().withMessage('Must be a valid URL'),

  body('caption')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 }).withMessage('Caption must be 200 characters or fewer'),

  body('is_primary')
    .optional()
    .isBoolean().withMessage('is_primary must be true or false'),

  // Require either a pasted URL or an uploaded image file
  body().custom((_, { req }) => {
    const hasUrl = typeof req.body.url === 'string' && req.body.url.trim().length > 0;
    const hasFile = !!(req.file && req.file.filename);
    if (!hasUrl && !hasFile) {
      throw new Error('Provide an image URL or upload an image file');
    }
    return true;
  }),
];