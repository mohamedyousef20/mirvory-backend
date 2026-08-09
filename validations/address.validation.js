const { baseSchema, Joi, patterns } = require('./base.schema');

// Address types
const ADDRESS_TYPES = ['shipping', 'billing', 'both'];

// Base address schema
const addressSchema = baseSchema.keys({
  type: Joi.string().valid(...ADDRESS_TYPES).default('shipping'),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  company: Joi.string().allow(''),
  addressLine1: Joi.string().required(),
  addressLine2: Joi.string().allow(''),
  city: Joi.string().required(),
  state: Joi.string().required(),
  postalCode: Joi.string().required(),
  country: Joi.string().required(),
  phone: Joi.string().pattern(patterns.phone).allow(''),
  isDefault: Joi.boolean().default(false),
  isBilling: Joi.boolean().default(false),
  isShipping: Joi.boolean().default(true),
  notes: Joi.string().allow(''),
});

// Create address schema
const createAddressSchema = addressSchema;

// Update address schema
const updateAddressSchema = baseSchema.keys({
  type: Joi.string().valid(...ADDRESS_TYPES),
  firstName: Joi.string().min(2).max(50),
  lastName: Joi.string().min(2).max(50),
  company: Joi.string().allow(''),
  addressLine1: Joi.string(),
  addressLine2: Joi.string().allow(''),
  city: Joi.string(),
  state: Joi.string(),
  postalCode: Joi.string(),
  country: Joi.string(),
  phone: Joi.string().pattern(patterns.phone).allow(''),
  isDefault: Joi.boolean(),
  isBilling: Joi.boolean(),
  isShipping: Joi.boolean(),
  notes: Joi.string().allow(''),
}).min(1);

// Address query schema
const addressQuerySchema = baseSchema.keys({
  type: Joi.string().valid(...ADDRESS_TYPES, 'all'),
  isDefault: Joi.boolean(),
  search: Joi.string(),
  sort: Joi.string().valid('newest', 'oldest', 'name_asc', 'name_desc').default('newest'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

// Set default address schema
const setDefaultAddressSchema = baseSchema.keys({
  type: Joi.string().valid('shipping', 'billing').required(),
});

// Address validation schema (for checkout)
const validateAddressSchema = baseSchema.keys({
  address: addressSchema.required(),
  validatePhone: Joi.boolean().default(true),
  validatePostalCode: Joi.boolean().default(true),
});

module.exports = {
  createAddressSchema,
  updateAddressSchema,
  addressQuerySchema,
  setDefaultAddressSchema,
  validateAddressSchema,
  ADDRESS_TYPES,
};
