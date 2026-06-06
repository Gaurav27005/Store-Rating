const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

const passwordRules = (field = 'password') => [
  body(field)
    .isLength({ min: 8, max: 16 })
    .withMessage('Password must be 8–16 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must include at least one uppercase letter')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must include at least one special character'),
];

const userValidation = [
  body('name')
    .trim()                          // strip leading/trailing spaces before validation
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 60 })
    .withMessage('Name must be at most 60 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  ...passwordRules('password'),
  body('address')
    .optional({ checkFalsy: true })
    .isLength({ max: 400 })
    .withMessage('Address must be at most 400 characters'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

const passwordUpdateValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  ...passwordRules('newPassword'),
];

const storeValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Store name is required')
    .isLength({ max: 60 })
    .withMessage('Store name must be at most 60 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid store email'),
  body('address')
    .optional({ checkFalsy: true })
    .isLength({ max: 400 })
    .withMessage('Address must be at most 400 characters'),
];

const ratingValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
];

module.exports = {
  handleValidation,
  userValidation,
  loginValidation,
  passwordUpdateValidation,
  storeValidation,
  ratingValidation,
};
