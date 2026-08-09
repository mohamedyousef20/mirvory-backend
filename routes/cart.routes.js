// routes/cart.js
import express from 'express'
import { protect } from '../middlewares/auth.js';
import {
  validateCartItem,
  validateUpdateCartItem,
  validateObjectId
} from '../validations/cart.validation.js';
import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  getCartCount,
  updateCartItem,

} from '../controllers/cart.controller.js';

const router = express.Router();

router.use(protect)

// @route   GET /api/cart
// @desc    Get user cart
// @access  Private
router.get('/', getCart);

// @route   POST /api/cart
// @desc    Add item to cart
// @access  Private
router.post('/', addToCart);

// @route   PUT /api/cart/:itemId
// @desc    Update cart item
// @access  Private
router.patch('/increase', updateCartItem);

// @route   DELETE /api/cart/:itemId
// @desc    Remove item from cart
// @access  Private
router.delete('/:itemId', removeFromCart);

// @route   DELETE /api/cart
// @desc    Clear cart
// @access  Private
router.delete('/', clearCart);

// @route   GET /api/cart/count
// @desc    Get cart items count
// @access  Private
router.get('/count', getCartCount);



export default router;