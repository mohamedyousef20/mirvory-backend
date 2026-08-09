const { validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');

/**
 * Middleware to validate request data against a Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} source - Where to get the data from (body, query, params)
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      allowUnknown: false,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // Replace the request data with the validated data
    req[source] = value;
    next();
  };
};

// Middleware to handle validation errors from express-validator
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        type: err.type || 'validation_error',
      })),
    });
  }
  next();
};

module.exports = {
  validate,
  validateRequest,
};
