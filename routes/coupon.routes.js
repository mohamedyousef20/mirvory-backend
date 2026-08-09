import express from 'express';
import {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCouponCode,
  removeCouponFromCart
} from '../controllers/coupon.controller.js'
import { protect, isAdmin } from '../middlewares/auth.js';

const router = express.Router();
router.use(protect);
router.post('/validate', validateCouponCode);
router.delete('/remove', removeCouponFromCart);
// 🧾 Routes
router.get('/', isAdmin, getAllCoupons);
router.get('/:id', isAdmin, getCouponById);
router.post('/', isAdmin, createCoupon);
router.put('/:id', isAdmin, updateCoupon);
router.delete('/:id', isAdmin, deleteCoupon);



export default router;
