import Joi from 'joi';

// Common validation patterns
export const patterns = {
  email: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
  phone: /^[0-9]{10,15}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  objectId: /^[0-9a-fA-F]{24}$/
};

// Common validation messages
const messages = {
  'string.empty': '{{#label}} is required',
  'string.min': '{{#label}} must be at least {{#limit}} characters',
  'string.max': '{{#label}} must not exceed {{#limit}} characters',
  'string.pattern.base': 'Invalid {{#label}} format',
  'number.min': '{{#label}} must be at least {{#limit}}',
  'number.max': '{{#label}} must not exceed {{#limit}}',
  'any.required': '{{#label}} is required',
  'array.base': '{{#label}} must be an array',
  'object.unknown': '{{#label}} is not allowed',
  'date.base': '{{#label}} must be a valid date',
  'date.greater': '{{#label}} must be after {{:#limit}}',
  'boolean.base': '{{#label}} must be a boolean',
};

// Base schema that can be extended by other schemas
export const baseSchema = Joi.object().options({
  abortEarly: false,
  stripUnknown: true,
  messages
});

export { Joi };

export default { Joi, patterns, messages, baseSchema };
