// routes/guestOrder.routes.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import { createGuestOrder, trackGuestOrder, linkGuestOrderToAccount } from '../controllers/guestOrder.controller.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Strict rate limiter for guest checkout (5 attempts per 15 min per IP)
const guestCheckoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'تجاوزت الحد المسموح به من الطلبات. حاول مرة أخرى بعد 15 دقيقة.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Tracking rate limiter (20 per 15 min)
const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'الحد الأقصى لطلبات التتبع. حاول لاحقًا.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/guest-orders — create guest order (no auth required)
router.post('/', guestCheckoutLimiter, createGuestOrder);

// GET /api/guest-orders/track/:token — track a guest order
router.get('/track/:token', trackLimiter, trackGuestOrder);

// POST /api/guest-orders/link-account — link guest order to authenticated account
router.post('/link-account', protect, linkGuestOrderToAccount);

export default router;
