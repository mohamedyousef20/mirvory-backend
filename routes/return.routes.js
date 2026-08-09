import express from 'express';
import { createReturnRequest, deleteReturnRequest, getReturnRequestById, getReturnRequests, getReturnRequestsForAdmin, updateReturnStatus } from '../controllers/return.controller.js';
import { isAdmin, protect } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

// إنشاء طلب استرجاع
router.post('/', createReturnRequest);

// جلب طلبات الاسترجاع
router.get('/', getReturnRequests);

router.get('/admin', isAdmin, getReturnRequestsForAdmin);

router.get('/:id', getReturnRequestById);

router.patch('/', isAdmin, updateReturnStatus);

router.delete('/', isAdmin, deleteReturnRequest);

export default router;
