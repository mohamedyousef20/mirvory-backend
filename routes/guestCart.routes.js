// routes/guestCart.routes.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import { validateGuestCart } from '../controllers/guestCart.controller.js';

const router = express.Router();

// Rate limiter: 60 requests per 15 minutes per IP
const guestCartLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { success: false, message: 'تجاوزت الحد المسموح به. حاول لاحقًا.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/guest-cart/validate
 * Validates items in guest cart (prices, stock, availability)
 * No auth required
 */
router.post('/validate', guestCartLimiter, validateGuestCart);

export default router;
