import Rating from '../models/rating.model.js';
import Product from '../models/product.model.js';
import User from '../models/user.model.js';
import createError from '../utils/error.js';
import { formatPaginationResponse } from '../middlewares/pagination.js';

// Create a new rating
export const createRating = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return next(new createError('التقييم يجب أن يكون بين 1 و 5', 400));
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return next(new createError('المنتج غير موجود', 404));
    }

    // Check if user already rated this product
    const existingRating = await Rating.findOne({
      product: productId,
      user: req.user._id
    });

    if (existingRating) {
      return next(new createError('لقد قمت بتقييم هذا المنتج مسبقاً', 400));
    }

    // Create new rating
    const newRating = new Rating({
      product: productId,
      user: req.user._id,
      rating,
      comment: comment || ''
    });

    await newRating.save();

    // Update product ratings
    await updateProductRatings(productId);

    // Populate for response
    await newRating.populate('user', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'تم إضافة التقييم بنجاح',
      data: newRating
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new createError('لقد قمت بتقييم هذا المنتج مسبقاً', 400));
    }
    next(error);
  }
};

// Get all ratings for a product
export const getProductRatings = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page, limit, skip } = req.pagination;
    const sortObj = req.sort || { createdAt: -1 };

    const [ratings, total] = await Promise.all([
      Rating.find({ product: productId })
        .populate('user', 'firstName lastName')
        .sort(sortObj)
        .skip(skip)
        .limit(limit),
      Rating.countDocuments({ product: productId })
    ]);

    res.json(formatPaginationResponse(ratings, total, req.pagination));
  } catch (error) {
    next(error);
  }
};

// Get user's rating for a product
export const getUserRating = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const rating = await Rating.findOne({
      product: productId,
      user: req.user._id
    }).populate('user', 'firstName lastName');

    if (!rating) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: rating
    });
  } catch (error) {
    next(error);
  }
};

// Update a rating
export const updateRating = async (req, res, next) => {
  try {
    const { productId, ratingId } = req.params;
    const { rating, comment } = req.body;

    if (rating && (rating < 1 || rating > 5)) {
      return next(new createError('التقييم يجب أن يكون بين 1 و 5', 400));
    }

    const ratingDoc = await Rating.findOne({
      _id: ratingId,
      product: productId,
      user: req.user._id
    });

    if (!ratingDoc) {
      return next(new createError('التقييم غير موجود', 404));
    }

    if (rating) ratingDoc.rating = rating;
    if (comment !== undefined) ratingDoc.comment = comment;

    await ratingDoc.save();

    // Update product ratings
    await updateProductRatings(productId);

    await ratingDoc.populate('user', 'firstName lastName');

    res.json({
      success: true,
      message: 'تم تحديث التقييم بنجاح',
      data: ratingDoc
    });
  } catch (error) {
    next(error);
  }
};

// Delete a rating
export const deleteRating = async (req, res, next) => {
  try {
    const { productId, ratingId } = req.params;

    const rating = await Rating.findOne({
      _id: ratingId,
      product: productId,
      user: req.user._id
    });

    if (!rating) {
      return next(new createError('التقييم غير موجود', 404));
    }

    await Rating.findByIdAndDelete(ratingId);

    // Update product ratings
    await updateProductRatings(productId);

    res.json({
      success: true,
      message: 'تم حذف التقييم بنجاح'
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to update product ratings
async function updateProductRatings(productId) {
  const ratings = await Rating.find({ product: productId });

  if (ratings.length === 0) {
    await Product.findByIdAndUpdate(productId, {
      'ratings.average': 0,
      'ratings.count': 0,
      'ratings.distribution': { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    });
    return;
  }

  const total = ratings.reduce((sum, r) => sum + r.rating, 0);
  const average = total / ratings.length;

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach(r => {
    distribution[r.rating]++;
  });

  await Product.findByIdAndUpdate(productId, {
    'ratings.average': parseFloat(average.toFixed(1)),
    'ratings.count': ratings.length,
    'ratings.distribution': distribution
  });
}
