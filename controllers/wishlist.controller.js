import Wishlist from '../models/wishlist.model.js';
import Product from '../models/product.model.js';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import createError from '../utils/error.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = asyncHandler(async (req, res, next) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id })
    .populate({ path: 'products.product', select: 'title titleEn price images quantity' });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: req.user._id,
      products: []
    });
  }

  res.status(200).json({ success: true, data: wishlist });
});

// @desc    Toggle product in wishlist (add if not exists, remove if exists)
// @route   POST /api/wishlist/toggle/:productId
// @access  Private
export const toggleWishlist = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;

  if (!isValidObjectId(productId)) {
    return next(new createError('معرف المنتج غير صالح', 400));
  }

  const product = await Product.findById(productId).lean();
  if (!product) {
    return next(new createError('المنتج غير موجود', 404));
  }

  let wishlist = await Wishlist.findOne({ user: req.user._id });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: req.user._id,
      products: [{ product: productId }]
    });

    wishlist = await Wishlist.findById(wishlist._id).populate('products.product');
    return res.status(200).json({
      success: true,
      message: 'تم إضافة المنتج للمفضلة بنجاح',
      isFavorite: true,
      data: wishlist
    });
  }

  const productIndex = wishlist.products.findIndex(
    item => (item.product?._id || item.product).toString() === productId
  );

  if (productIndex !== -1) {
    wishlist.products.splice(productIndex, 1);
    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: 'تم إزالة المنتج من المفضلة بنجاح',
      isFavorite: false,
      data: wishlist
    });
  } else {
    wishlist.products.push({ product: productId });
    await wishlist.save();

    wishlist = await Wishlist.findById(wishlist._id).populate('products.product');
    return res.status(200).json({
      success: true,
      message: 'تم إضافة المنتج للمفضلة بنجاح',
      isFavorite: true,
      data: wishlist
    });
  }
});

// @desc    Check if product is in wishlist
// @route   GET /api/wishlist/check/:productId
// @access  Private
export const checkFavorite = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;
  if (!isValidObjectId(productId)) return next(new createError('معرف غير صالح', 400));

  const wishlist = await Wishlist.findOne({ user: req.user._id }).lean();
  if (!wishlist) {
    return res.status(200).json({ success: true, isFavorite: false });
  }

  const isFavorite = wishlist.products.some(
    item => (item.product?._id || item.product).toString() === productId
  );

  res.status(200).json({ success: true, isFavorite });
});

// @desc    Clear wishlist
// @route   DELETE /api/wishlist
// @access  Private
export const clearWishlist = asyncHandler(async (req, res, next) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) return next(new createError('قائمة المفضلة غير موجودة', 404));

  wishlist.products = [];
  await wishlist.save();

  res.status(200).json({ success: true, message: 'تم إفراغ قائمة المفضلة بنجاح', data: wishlist });
});

// @desc    Get wishlist count
// @route   GET /api/wishlist/count
// @access  Private
export const getWishlistCount = asyncHandler(async (req, res, next) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id }).select("products").lean();
  const count = wishlist ? wishlist.products.length : 0;

  res.status(200).json({ success: true, count });
});