import express from 'express';
import { protect, isSeller, isAdmin } from '../middlewares/auth.js';
import {
  getSellerAnalytics,
  getAdminAnalytics
} from '../controllers/dashboard.controller.js';

const router = express.Router();

// Analytics Routes
router.get('/seller', protect, isSeller, getSellerAnalytics);
router.get('/admin', protect, isAdmin, getAdminAnalytics);

export default router;
