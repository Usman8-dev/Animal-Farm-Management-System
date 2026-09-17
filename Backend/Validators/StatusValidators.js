import { body, param } from 'express-validator';

// ── Animal Status (master data) ─────────────────────────────

export const AnimalStatusValidator = [
  body('code')
    .trim()
    .notEmpty().withMessage('Code is required')
    .isLength({ max: 20 }).withMessage('Code must be 20 characters or fewer'),

  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 40 }).withMessage('Name must be 2-40 characters'),

  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['PRESENCE', 'REPRODUCTIVE', 'HEALTH'])
    .withMessage('Category must be PRESENCE, REPRODUCTIVE, or HEALTH'),

  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be true or false'),
];

// ── Status Change Event ──────────────────────────────────────

export const RecordStatusValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid animal id'),

  body('status_id')
    .notEmpty().withMessage('status_id is required')
    .isInt({ min: 1 }).withMessage('status_id must be a valid id'),

  body('effective_from')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('effective_from must be a valid date'),
    
  body('effective_to')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('effective_from must be a valid date'),

  body('reason')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Reason must be 500 characters or fewer'),
];