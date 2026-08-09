import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';
import asyncHandler from 'express-async-handler';
import createError from '../utils/error.js';

export const getCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id })
    .populate({ path: 'items.product', select: 'title titleEn images price seller quantity' });

  if (!cart) return res.status(404).json({ message: 'السلة غير موجودة' });
  res.json(cart);
});

export const addToCart = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;
  let { quantity = 1, sizes, colors } = req.body;

  quantity = parseInt(quantity);
  if (quantity <= 0) return next(new createError("الكمية يجب أن تكون أكبر من صفر", 400));

  sizes = Array.isArray(sizes) ? sizes : (sizes ? [sizes] : []);
  colors = Array.isArray(colors) ? colors : (colors ? [colors] : []);

  const product = await Product.findById(productId).lean();
  if (!product) return next(new createError("المنتج غير موجود", 404));
  if (!product.isApproved) {
    return next(new createError("هذا المنتج غير متاح للشراء حالياً", 400));
  }

  // المنتج يجب أن يكون متاحًا
  if (product.status !== "available") {
    return next(new createError("هذا المنتج غير متاح للشراء حالياً", 400));
  }

  // البائع لا يمكنه شراء منتجاته
  if (product.seller.toString() === req.user._id.toString()) {
    return next(new createError("لا يمكنك إضافة منتجاتك إلى سلة التسوق", 403));
  }
  let cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $setOnInsert: { user: req.user._id, items: [] } },
    { upsert: true, new: true }
  );

  const existingQty = cart.items.filter(i => i.product.toString() === productId).reduce((sum, i) => sum + i.quantity, 0);
  if (existingQty + quantity > product.quantity) return next(new createError("الكمية المطلوبة تتجاوز المخزون", 400));
  if (sizes.length && sizes.length !== quantity) return next(new createError("عدد المقاسات يجب أن يطابق الكمية", 400));
  if (colors.length && colors.length !== quantity) return next(new createError("عدد الألوان يجب أن يطابق الكمية", 400));

  for (let i = 0; i < quantity; i++) {
    const currentSize = sizes.length ? sizes[i] : null;
    const currentColor = colors.length ? colors[i] : null;

    const existingItem = cart.items.find(item =>
      item.product.toString() === productId &&
      (item.sizes[0] || null) === currentSize &&
      (item.colors[0] || null) === currentColor
    );

    if (existingItem) existingItem.quantity += 1;
    else {
      cart.items.push({
        product: productId, quantity: 1, price: product.price,
        sizes: currentSize ? [currentSize] : [], colors: currentColor ? [currentColor] : []
      });
    }
  }

  if (typeof cart.updateTotal === 'function') await cart.updateTotal();
  res.json(cart);
});

export const updateCartItem = asyncHandler(async (req, res, next) => {
  const { itemId, quantity } = req.body;
  const parsedQty = parseInt(quantity);

  if (parsedQty <= 0) return next(new createError("الكمية يجب أن تكون أكبر من صفر", 400));

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return next(new createError("السلة غير موجودة", 404));

  const item = cart.items.find(i => i._id.toString() === itemId);
  if (!item) return next(new createError("المنتج غير موجود في السلة", 404));

  const product = await Product.findById(item.product).select('quantity').lean();
  if (product && parsedQty > product.quantity) return next(new createError("الكمية تتجاوز المخزون المتاح", 400));

  item.quantity = parsedQty;
  if (typeof cart.updateTotal === 'function') await cart.updateTotal();
  else await cart.save();

  res.json(cart);
});

export const removeFromCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return next(new createError("السلة غير موجودة", 404));

  cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId);
  if (typeof cart.updateTotal === 'function') await cart.updateTotal();
  else await cart.save();

  res.json(cart);
});

export const clearCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return next(new createError("السلة غير موجودة", 404));

  cart.items = [];
  cart.total = 0;
  cart.appliedCoupon = undefined;
  await cart.save();

  res.json(cart);
});

export const getCartCount = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).lean();
  let count = 0;
  if (cart && cart.items) count = cart.items.reduce((total, item) => total + item.quantity, 0);
  res.json({ success: true, count });
});