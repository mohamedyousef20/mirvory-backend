const { baseSchema, Joi, patterns } = require('./base.schema');

// Order status and payment enums
const ORDER_STATUS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const PAYMENT_METHODS = ['credit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'];
const PAYMENT_STATUS = ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'];

// Order item schema
const orderItemSchema = Joi.object({
  product: Joi.string().pattern(patterns.objectId).required(),
  variant: Joi.string().pattern(patterns.objectId),
  name: Joi.string().required(),
  price: Joi.number().min(0).precision(2).required(),
  quantity: Joi.number().integer().min(1).required(),
  sku: Joi.string().allow(''),
  image: Joi.string().uri().allow(''),
});

// Shipping address schema
const shippingAddressSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  address: Joi.string().required(),
  address2: Joi.string().allow(''),
  city: Joi.string().required(),
  state: Joi.string().required(),
  postalCode: Joi.string().required(),
  country: Joi.string().required(),
  phone: Joi.string().pattern(patterns.phone).allow(''),
});

// Create order schema
const createOrderSchema = baseSchema.keys({
  items: Joi.array().items(orderItemSchema).min(1).required(),
  shippingAddress: shippingAddressSchema.required(),
  billingAddress: Joi.alternatives().try(
    shippingAddressSchema,
    Joi.boolean().valid(false)
  ),
  paymentMethod: Joi.string().valid(...PAYMENT_METHODS).required(),
  shippingMethod: Joi.string().required(),
  shippingCost: Joi.number().min(0).precision(2).default(0),
  taxAmount: Joi.number().min(0).precision(2).default(0),
  discountAmount: Joi.number().min(0).precision(2).default(0),
  couponCode: Joi.string().allow('', null),
  notes: Joi.string().allow(''),
  customerNote: Joi.string().allow(''),
});

// Update order status schema
const updateOrderStatusSchema = baseSchema.keys({
  status: Joi.string().valid(...ORDER_STATUS).required(),
  trackingNumber: Joi.string().when('status', {
    is: 'shipped',
    then: Joi.string().required(),
    otherwise: Joi.string().allow('', null)
  }),
  notifyCustomer: Joi.boolean().default(false),
  comment: Joi.string().allow(''),
});

// Update payment status schema
const updatePaymentStatusSchema = baseSchema.keys({
  status: Joi.string().valid(...PAYMENT_STATUS).required(),
  transactionId: Joi.string().when('status', {
    is: Joi.valid('paid', 'refunded', 'partially_refunded'),
    then: Joi.string().required(),
    otherwise: Joi.string().allow('', null)
  }),
  amount: Joi.number().when('status', {
    is: 'partially_refunded',
    then: Joi.number().min(0.01).required(),
    otherwise: Joi.number().allow(null)
  }),
  paymentMethod: Joi.string().valid(...PAYMENT_METHODS),
  notes: Joi.string().allow(''),
});

// Order query schema
const orderQuerySchema = baseSchema.keys({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().valid('newest', 'oldest', 'total_asc', 'total_desc').default('newest'),
  status: Joi.string().valid(...ORDER_STATUS, 'all'),
  customer: Joi.string().pattern(patterns.objectId),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')),
  search: Joi.string(),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
  orderQuerySchema,
  ORDER_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
};
