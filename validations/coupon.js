const Joi = require('joi');

// Validation for creating/updating a coupon
exports.validateCoupon = (coupon) => {
  const schema = Joi.object({
    code: Joi.string().min(4).max(20).required(),
    discountType: Joi.string().valid('percentage', 'fixed').required(),
    discountValue: Joi.number().min(0).required(),
    minPurchaseAmount: Joi.number().min(0),
    maxDiscountAmount: Joi.number().min(0).when('discountType', {
      is: 'percentage',
      then: Joi.number().min(0).required(),
      otherwise: Joi.number().min(0)
    }),
    validFrom: Joi.date(),
    validUntil: Joi.date().greater(Joi.ref('validFrom')).required(),
    maxUses: Joi.number().min(1).default(1),
    isActive: Joi.boolean().default(true)
  });

  return schema.validate(coupon);
};

// Validation for applying a coupon
exports.validateCouponApplication = (data) => {
  const schema = Joi.object({
    code: Joi.string().required(),
    cartTotal: Joi.number().min(0).required()
  });

  return schema.validate(data);
};
