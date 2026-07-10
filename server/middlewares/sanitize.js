const { body, param, query, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed.",
      details: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

const sanitizeString = (field) => body(field)
  .optional({ nullable: true, checkFalsy: true })
  .isString()
  .trim()
  .escape()
  .isLength({ max: 1000 })
  .withMessage(`${field} must be a string with max 1000 characters.`);

const sanitizeEmail = () => body("email")
  .isEmail()
  .normalizeEmail()
  .isLength({ max: 255 })
  .withMessage("Invalid email format.");

const sanitizeName = () => body("name")
  .isString()
  .trim()
  .escape()
  .isLength({ min: 2, max: 255 })
  .withMessage("Name must be 2-255 characters.");

const sanitizePassword = () => body("password")
  .isString()
  .isLength({ min: 6, max: 128 })
  .withMessage("Password must be 6-128 characters.");

const sanitizeRole = () => body("role")
  .isString()
  .trim()
  .isIn(["FARMER", "FPO_ADMIN", "AGRI_BUSINESS", "EXPERT"])
  .withMessage("Invalid role specified.");

const sanitizePositiveNumber = (field) => body(field)
  .optional({ nullable: true, checkFalsy: true })
  .isFloat({ min: 0 })
  .withMessage(`${field} must be a positive number.`);

const sanitizeId = (field) => param(field)
  .isMongoId()
  .withMessage(`Invalid ${field} ID format.`);

const sanitizeQueryId = (field) => query(field)
  .optional({ nullable: true, checkFalsy: true })
  .isMongoId()
  .withMessage(`Invalid ${field} ID format.`);

module.exports = {
  handleValidationErrors,
  sanitizeString,
  sanitizeEmail,
  sanitizeName,
  sanitizePassword,
  sanitizeRole,
  sanitizePositiveNumber,
  sanitizeId,
  sanitizeQueryId,
};
