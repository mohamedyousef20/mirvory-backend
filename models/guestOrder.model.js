// models/guestOrder.model.js
import mongoose from 'mongoose';
import crypto from 'crypto';

const guestOrderSchema = new mongoose.Schema({
  // Tracking token — public, used by guests to track orders
  trackingToken: {
    type: String,
    unique: true,
    index: true,
  },

  // Encrypted guest contact info
  guestEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  guestPhone: {
    type: String,
    required: true,
  },
  guestName: {
    type: String,
    required: true,
    trim: true,
  },

  // Reference to the actual Order document
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },

  // Optional: link to registered account after the fact
  linkedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // IP fingerprint for duplicate / spam detection (hashed)
  ipHash: {
    type: String,
    index: true,
  },

  // TTL: auto-delete guest records after 90 days
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  },
}, { timestamps: true });

// TTL index
guestOrderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for rate-limiting lookups
guestOrderSchema.index({ ipHash: 1, createdAt: -1 });

// Pre-save: generate trackingToken
guestOrderSchema.pre('save', function (next) {
  if (!this.isNew || this.trackingToken) return next();
  this.trackingToken = crypto.randomBytes(20).toString('hex');
  next();
});

export default mongoose.model('GuestOrder', guestOrderSchema);
