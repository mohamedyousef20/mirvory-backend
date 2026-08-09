import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minPurchaseAmount: {
    type: Number,
    default: 0
  },
  maxDiscountAmount: {
    type: Number
  },
  validFrom: {
    type: Date,
    required: true,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  maxUses: {
    type: Number,
    default: 1
  },
  currentUses: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups
couponSchema.index({ code: 1, isActive: 1 });

// Pre-save hook to update updatedAt
couponSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Static method to validate a coupon
couponSchema.statics.validateCoupon = async function (code, cartTotal) {
  const coupon = await this.findOne({
    code,
    isActive: true,
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() },
    $expr: { $lt: ['$currentUses', '$maxUses'] }
  });

  if (!coupon) {
    return { isValid: false, message: 'Invalid or expired coupon code' };
  }

  if (cartTotal < coupon.minPurchaseAmount) {
    return {
      isValid: false,
      message: `Minimum purchase amount of $${coupon.minPurchaseAmount} required`
    };
  }

  let discount = coupon.discountValue;

  if (coupon.discountType === 'percentage') {
    discount = (cartTotal * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }
  }

  return {
    isValid: true,
    coupon: {
      _id: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount: discount,
      maxDiscountAmount: coupon.maxDiscountAmount
    }
  };
};

export default mongoose.model('Coupon', couponSchema);
