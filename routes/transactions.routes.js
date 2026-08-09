import express from 'express';
import { protect, isSeller, isAdmin } from '../middlewares/auth.js';
import {
  getSellerTransactions,
  getAdminTransactions
} from '../controllers/dashboard.controller.js';

const router = express.Router();

// Transactions Routes
router.get('/seller', protect, isSeller, getSellerTransactions);
router.get('/admin', protect, isAdmin, getAdminTransactions);

export default router;
