import express from 'express';
import { protect, isSeller, isAdmin } from '../middlewares/auth.js';
import {
  getSellerCounters,
  getSellerAnalytics,
  getSellerTransactions,
  getAdminCounters,
  getAdminAnalytics,
  getAdminTransactions
} from '../controllers/dashboard.controller.js';

const router = express.Router();

// Seller Dashboard Routes
router.get('/seller/counters', protect, isSeller, getSellerCounters);
router.get('/seller/analytics', protect, isSeller, getSellerAnalytics);
router.get('/seller/transactions', protect, isSeller, getSellerTransactions);

// Admin Dashboard Routes  
router.get('/admin/counters', protect, isAdmin, getAdminCounters);
router.get('/admin/analytics', protect, isAdmin, getAdminAnalytics);
router.get('/admin/transactions', protect, isAdmin, getAdminTransactions);

export default router;
