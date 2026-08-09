import { baseSchema, Joi, patterns } from './base.schema.js';

// Cart item schema
const cartItemSchema = Joi.object({
  product: Joi.string().pattern(patterns.objectId).required(),
  variant: Joi.string().pattern(patterns.objectId).allow(null),
  quantity: Joi.number().integer().min(1).default(1),
  price: Joi.number().min(0).precision(2),
  customizations: Joi.object().pattern(/^/, Joi.any()),
});

// Create/update cart schema
const cartSchema = baseSchema.keys({
  items: Joi.array().items(cartItemSchema).min(1).required(),
  couponCode: Joi.string().allow('', null),
  notes: Joi.string().allow(''),
  currency: Joi.string().length(3).uppercase().default('USD'),
});

// Update cart item quantity schema
const updateCartItemSchema = baseSchema.keys({
  quantity: Joi.number().integer().min(0).required(),
  action: Joi.string().valid('set', 'increment', 'decrement').default('set'),
});

// Apply coupon schema
const applyCouponSchema = baseSchema.keys({
  code: Joi.string().required(),
});

// Cart calculation schema (for server-side calculations)
const calculateCartSchema = baseSchema.keys({
  items: Joi.array().items(
    Joi.object({
      product: Joi.string().pattern(patterns.objectId).required(),
      variant: Joi.string().pattern(patterns.objectId).allow(null),
      quantity: Joi.number().integer().min(1).required(),
    })
  ).required(),
  couponCode: Joi.string().allow('', null),
  shippingMethod: Joi.string().allow('', null),
  shippingAddress: Joi.object({
    country: Joi.string().required(),
    state: Joi.string().required(),
    postalCode: Joi.string().allow(''),
  }).allow(null),
});

// Validate cart item
export const validateCartItem = (item) => {
  const schema = Joi.object({
    productId: Joi.string().pattern(patterns.objectId).required(),
    variantId: Joi.string().pattern(patterns.objectId).allow(null),
    quantity: Joi.number().integer().min(1).required(),
    price: Joi.number().min(0).required(),
    name: Joi.string().required(),
    image: Joi.string().allow('', null),
    sku: Joi.string().allow('', null)
  });
  
  return schema.validate(item);
};

// Validate cart
export const validateCart = (cart) => {
  const schema = Joi.object({
    items: Joi.array().items(cartItemSchema).min(1).required(),
    couponCode: Joi.string().allow('', null),
    notes: Joi.string().allow(''),
    currency: Joi.string().default('USD')
  });
  
  return schema.validate(cart);
};

// Validate update cart item
export const validateUpdateCartItem = (data) => {
  const schema = Joi.object({
    quantity: Joi.number().integer().min(0).required(),
    action: Joi.string().valid('set', 'increment', 'decrement').default('set')
  });
  
  return schema.validate(data);
};

// Validate apply coupon
export const validateApplyCoupon = (data) => {
  const schema = Joi.object({
    code: Joi.string().required()
  });
  
  return schema.validate(data);
};

// Validate object ID
export const validateObjectId = (id) => {
  return Joi.string().pattern(patterns.objectId).required().validate(id);
};

export {
  cartItemSchema,
  cartSchema,
  updateCartItemSchema,
  applyCouponSchema,
  calculateCartSchema
};
