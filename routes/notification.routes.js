import express from 'express';
import {
    getNotifications,
    markAsRead,
    sendNotification,
    getUnreadCount,
    markAllAsRead,
    pollNotifications,
} from '../controllers/notification.controller.js';
import { isAdmin, protect } from '../middlewares/auth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Polling limiter — max 60 req/min (every 30s = 2/min, 60 allows some buffer)
const pollLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { message: 'Too many notification poll requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply protection to all routes
router.use(protect);

// User routes
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.get('/count', getUnreadCount);
router.get('/poll', pollLimiter, pollNotifications); // Polling fallback (Socket.IO disabled)
router.patch('/read', markAsRead);
router.put('/read-all', markAllAsRead);

// Admin-only routes
router.post('/', isAdmin, sendNotification);

export default router;
