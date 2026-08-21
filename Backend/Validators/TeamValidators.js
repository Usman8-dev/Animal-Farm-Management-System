import { body, param } from 'express-validator';

const TeamMemberIdParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid team member id'),
];

const TeamMemberCreateValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 120 })
    .withMessage('Name is too long'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  body('gender')
    .trim()
    .notEmpty()
    .withMessage('Gender is required'),

  body('cnic_number')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('Invalid CNIC'),

  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['manager', 'worker'])
    .withMessage('Role must be manager or worker'),
];

const TeamMemberUpdateValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 120 })
    .withMessage('Name is too long'),

  body('gender')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Gender cannot be empty'),

  body('cnic_number')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('Invalid CNIC'),

  body('role')
    .optional()
    .isIn(['manager', 'worker'])
    .withMessage('Role must be manager or worker'),

  body('status')
    .optional()
    .isIn(['active', 'pending', 'removed'])
    .withMessage('Invalid status'),

  body('password')
    .optional({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

export {
  TeamMemberIdParamValidator,
  TeamMemberCreateValidator,
  TeamMemberUpdateValidator,
};