const { baseSchema, Joi, patterns } = require('./base.schema');

// Coupon types and enums
const COUPON_TYPES = ['percentage', 'fixed_amount', 'free_shipping'];
const COUPON_APPLIES_TO = ['all', 'categories', 'products', 'collections'];
const CUSTOMER_ELIGIBILITY = ['everyone', 'specific_customers', 'minimum_amount'];

// Create coupon schema
const createCouponSchema = baseSchema.keys({
  code: Joi.string().uppercase().replace(/\s+/g, '').required(),
  description: Joi.string().allow(''),
  type: Joi.string().valid(...COUPON_TYPES).required(),
  value: Joi.number().when('type', {
    is: 'free_shipping',
    then: Joi.number().valid(0),
    otherwise: Joi.number().min(0.01).required()
  }),
  minPurchase: Joi.number().min(0).default(0),
  maxDiscount: Joi.number().when('type', {
    is: 'percentage',
    then: Joi.number().min(0).required(),
    otherwise: Joi.number().min(0)
  }),
  startDate: Joi.date().iso().default(Date.now),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
  isActive: Joi.boolean().default(true),
  maxUses: Joi.number().integer().min(1),
  maxUsesPerCustomer: Joi.number().integer().min(1),
  appliesTo: Joi.string().valid(...COUPON_APPLIES_TO).default('all'),
  products: Joi.array().items(Joi.string().pattern(patterns.objectId)),
  categories: Joi.array().items(Joi.string().pattern(patterns.objectId)),
  customerEligibility: Joi.string().valid(...CUSTOMER_ELIGIBILITY).default('everyone'),
  customerIds: Joi.array().items(Joi.string().pattern(patterns.objectId)),
  minimumAmount: Joi.number().min(0),
  isSingleUse: Joi.boolean().default(false),
  isExclusive: Joi.boolean().default(false),
  usageCount: Joi.number().integer().min(0).default(0),
});

// Update coupon schema
const updateCouponSchema = baseSchema.keys({
  code: Joi.string().uppercase().replace(/\s+/g, ''),
  description: Joi.string().allow(''),
  type: Joi.string().valid(...COUPON_TYPES),
  value: Joi.number().min(0.01),
  minPurchase: Joi.number().min(0),
  maxDiscount: Joi.number().min(0),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
  isActive: Joi.boolean(),
  maxUses: Joi.number().integer().min(1),
  maxUsesPerCustomer: Joi.number().integer().min(1),
  appliesTo: Joi.string().valid(...COUPON_APPLIES_TO),
  products: Joi.array().items(Joi.string().pattern(patterns.objectId)),
  categories: Joi.array().items(Joi.string().pattern(patterns.objectId)),
  customerEligibility: Joi.string().valid(...CUSTOMER_ELIGIBILITY),
  customerIds: Joi.array().items(Joi.string().pattern(patterns.objectId)),
  minimumAmount: Joi.number().min(0),
  isSingleUse: Joi.boolean(),
  isExclusive: Joi.boolean(),
}).min(1);

// Validate coupon schema
const validateCouponSchema = baseSchema.keys({
  code: Joi.string().required(),
  cartTotal: Joi.number().min(0).required(),
  productIds: Joi.array().items(Joi.string().pattern(patterns.objectId)),
  categoryIds: Joi.array().items(Joi.string().pattern(patterns.objectId)),
  customerId: Joi.string().pattern(patterns.objectId),
});

// Coupon query schema
const couponQuerySchema = baseSchema.keys({
  code: Joi.string(),
  type: Joi.string().valid(...COUPON_TYPES),
  isActive: Joi.boolean(),
  isExpired: Joi.boolean(),
  search: Joi.string(),
  sort: Joi.string().valid('newest', 'oldest', 'most_used', 'least_used', 'value_asc', 'value_desc').default('newest'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

module.exports = {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
  couponQuerySchema,
  COUPON_TYPES,
  COUPON_APPLIES_TO,
  CUSTOMER_ELIGIBILITY,
};
