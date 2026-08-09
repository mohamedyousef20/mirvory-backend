// controllers/guestCart.controller.js
// Guest cart validation endpoint — validates product availability and returns current prices
// No auth required. Guest cart data lives in the browser's localStorage.

import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import createError from '../utils/error.js';

/**
 * POST /api/guest-cart/validate
 * Body: { items: [{ productId, quantity, size?, color? }] }
 * Returns enriched items with current price, title, image, and stock status.
 * Used by the frontend to render the guest cart and before proceeding to checkout.
 */
export const validateGuestCart = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(200).json({ success: true, items: [], subtotal: 0 });
    }

    if (items.length > 50) {
      return next(new createError('السلة تحتوي على عدد كبير جداً من المنتجات', 400));
    }

    // Validate all productIds
    const productIds = items.map((item) => {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        throw new createError(`معرّف منتج غير صالح: ${item.productId}`, 400);
      }
      return new mongoose.Types.ObjectId(item.productId);
    });

    const products = await Product.find({ _id: { $in: productIds } })
      .select('_id title titleEn images price discountedPrice quantity status isApproved')
      .lean();

    const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));

    let subtotal = 0;
    const enrichedItems = items.map((item) => {
      const product = productMap[item.productId];

      if (!product) {
        return {
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          available: false,
          reason: 'المنتج غير موجود',
          title: '',
          titleEn: '',
          image: null,
          price: 0,
          maxQuantity: 0,
        };
      }

      const isAvailable = product.status === 'available' && product.isApproved;
      const effectivePrice = product.discountedPrice ?? product.price;
      const availableQty = product.quantity;
      const requestedQty = Math.min(item.quantity, availableQty);

      if (isAvailable && requestedQty > 0) {
        subtotal += effectivePrice * requestedQty;
      }

      return {
        productId: item.productId,
        quantity: item.quantity,
        adjustedQuantity: isAvailable ? requestedQty : 0,
        size: item.size || null,
        color: item.color || null,
        available: isAvailable,
        inStock: availableQty > 0,
        reason: !isAvailable ? 'المنتج غير متاح' : availableQty === 0 ? 'نفد المخزون' : null,
        title: product.title,
        titleEn: product.titleEn || product.title,
        image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null,
        price: effectivePrice,
        maxQuantity: availableQty,
      };
    });

    const shippingFee = subtotal > 500 ? 0 : 30;
    const total = subtotal + shippingFee;

    return res.status(200).json({
      success: true,
      items: enrichedItems,
      subtotal,
      shippingFee,
      total,
    });
  } catch (err) {
    next(err);
  }
};
