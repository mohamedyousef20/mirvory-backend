const { baseSchema, Joi, patterns } = require('./base.schema');

// Review status enum
const REVIEW_STATUS = ['pending', 'approved', 'rejected'];

// Review schema
const createReviewSchema = baseSchema.keys({
  product: Joi.string().pattern(patterns.objectId).required(),
  variant: Joi.string().pattern(patterns.objectId).allow('', null),
  order: Joi.string().pattern(patterns.objectId).required(),
  rating: Joi.number().min(1).max(5).required(),
  title: Joi.string().min(5).max(100).required(),
  comment: Joi.string().min(10).required(),
  images: Joi.array().items(Joi.string().uri()).max(5),
  isAnonymous: Joi.boolean().default(false),
  status: Joi.string().valid(...REVIEW_STATUS).default('pending'),
  verifiedPurchase: Joi.boolean().default(false),
});

// Update review schema
const updateReviewSchema = baseSchema.keys({
  rating: Joi.number().min(1).max(5),
  title: Joi.string().min(5).max(100),
  comment: Joi.string().min(10),
  images: Joi.array().items(Joi.string().uri()).max(5),
  isAnonymous: Joi.boolean(),
  status: Joi.string().valid(...REVIEW_STATUS),
}).min(1);

// Review query schema
const reviewQuerySchema = baseSchema.keys({
  product: Joi.string().pattern(patterns.objectId),
  user: Joi.string().pattern(patterns.objectId),
  status: Joi.string().valid(...REVIEW_STATUS, 'all'),
  minRating: Joi.number().min(1).max(5),
  maxRating: Joi.number().min(1).max(5),
  sort: Joi.string().valid('newest', 'oldest', 'highest_rating', 'lowest_rating').default('newest'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  withUser: Joi.boolean().default(false),
  withProduct: Joi.boolean().default(false),
});

// Review response schema (for admin)
const updateReviewStatusSchema = baseSchema.keys({
  status: Joi.string().valid(...REVIEW_STATUS).required(),
  adminComment: Joi.string().allow(''),
});

module.exports = {
  createReviewSchema,
  updateReviewSchema,
  updateReviewStatusSchema,
  reviewQuerySchema,
  REVIEW_STATUS,
};
