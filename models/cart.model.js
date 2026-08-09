import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  sizes: [{
    type: String,
    required: true
  }],
  colors: [{
    type: String,
    required: true
  }]
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appliedCoupon: {
    code: String,
    discountAmount: Number,
    discountedTotal: Number,
    originalTotal: Number,
    appliedAt: Date
  },
  items: [cartItemSchema],
  total: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

cartSchema.methods.updateTotal = function () {
  const subtotal = this.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  if (
    this.appliedCoupon &&
    typeof this.appliedCoupon.discountAmount === "number"
  ) {
    const discountAmount = Math.min(
      this.appliedCoupon.discountAmount,
      subtotal
    );

    this.total = Number(
      Math.max(0, subtotal - discountAmount).toFixed(2)
    );

    this.appliedCoupon.originalTotal = Number(
      subtotal.toFixed(2)
    );

    this.appliedCoupon.discountAmount = Number(
      discountAmount.toFixed(2)
    );

    this.appliedCoupon.discountedTotal = this.total;
  } else {
    this.total = Number(subtotal.toFixed(2));
  }

  return this.save();
};
cartSchema.pre("save", function (next) {
  const subtotal = this.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  if (
    this.appliedCoupon &&
    typeof this.appliedCoupon.discountAmount === "number"
  ) {
    const discountAmount = Math.min(
      this.appliedCoupon.discountAmount,
      subtotal
    );

    this.total = Number(
      Math.max(0, subtotal - discountAmount).toFixed(2)
    );

    this.appliedCoupon.originalTotal = Number(
      subtotal.toFixed(2)
    );

    this.appliedCoupon.discountAmount = Number(
      discountAmount.toFixed(2)
    );

    this.appliedCoupon.discountedTotal = this.total;
  } else {
    this.total = Number(subtotal.toFixed(2));
  }

  this.updatedAt = Date.now();

  next();
});
export default mongoose.model('Cart', cartSchema);