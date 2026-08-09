import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, 
    index: true
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Middleware to populate products for find queries
wishlistSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'products.product',
    select: 'title description images price discountedPrice discountPercentage category ratings status'
  });
  next();
});

// Method to add product to wishlist
wishlistSchema.methods.addProduct = async function (productId) {
  const exists = this.products.some(item => item.product._id.toString() === productId.toString());
  
  if (!exists) {
    this.products.push({ product: productId });
    await this.save();
  }
  
  return this;
};

// Method to remove product from wishlist
wishlistSchema.methods.removeProduct = async function (productId) {
  this.products = this.products.filter(item => item.product._id.toString() !== productId.toString());
  await this.save();
  return this;
};

// Method to check if product is in wishlist
wishlistSchema.methods.hasProduct = function (productId) {
  return this.products.some(item => item.product._id.toString() === productId.toString());
};

// Index for better performance
wishlistSchema.index({ user: 1 });
wishlistSchema.index({ 'products.product': 1 });

export default mongoose.model('Wishlist', wishlistSchema);
