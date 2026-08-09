import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  query: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  searchCount: {
    type: Number,
    default: 1
  },
  lastSearchedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
searchHistorySchema.index({ user: 1, lastSearchedAt: -1 });
searchHistorySchema.index({ query: 1, searchCount: -1 });

// TTL index to automatically delete old search history (90 days)
searchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model('SearchHistory', searchHistorySchema);
