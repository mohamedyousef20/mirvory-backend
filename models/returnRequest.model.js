import mongoose from 'mongoose';

const returnRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    item: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

    reason: {
      type: String,
      required: true,
      trim: true
    },

    images: {
      type: [String],
      default: []
    },

    status: {
      type: String,
      enum: [
        'pending',
        'approved',
        'rejected',
        'processing',
        'processed'
      ],
      default: 'pending',
      index: true
    },

    rejectionReason: String,

    refundAmount: {
      type: Number,
      default: 0
    },

    refundStatus: {
      type: String,
      enum: ['pending', 'approved', 'refunded', 'rejected'],
      default: 'pending'
    },

    deleteAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// TTL auto delete
// returnRequestSchema.index(
//   { deleteAt: 1 },
//   { expireAfterSeconds: 0 }
// );

export default mongoose.model('ReturnRequest', returnRequestSchema);