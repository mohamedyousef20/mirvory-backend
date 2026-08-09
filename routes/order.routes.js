import express from 'express';
import { getAdminOrders, getSellerOrders,
     orderComplete, getVendorEarnings,
      updatePayment, cashingOrder,
      createOrder, confirmPreparation, confirmItemPreparation,
      createOrderFilterObj, updateDeliveryStatus,
      getUserOrderById, getUserOrders, printInvoice, processOrderPayout } from '../controllers/order.controller.js';
import { isAdmin, isSeller, protect } from '../middlewares/auth.js';
import { paginate } from '../middlewares/pagination.js';
import { sort } from '../middlewares/sort.js';
import { search, buildFilter, commonFilters } from '../middlewares/search.js';

const router = express.Router();
router.use(protect);

router.post('/complete',isAdmin, orderComplete);
router.post('/process-payout', isAdmin, processOrderPayout);
router.get('/', paginate(12), sort({ createdAt: -1 }), buildFilter(commonFilters.order), getUserOrders);
router.get("/admin/all", isAdmin, paginate(12), sort({ createdAt: -1 }), buildFilter(commonFilters.order), search(['orderNumber']), getAdminOrders);
router.get('/seller', isSeller, paginate(12), sort({ createdAt: -1 }), buildFilter(commonFilters.order), search(['orderNumber']), getSellerOrders);
router.get('/:id', getUserOrderById);
router.get('/:id/invoice', printInvoice);
// router.get('/vendor/:vendorId/earnings', isSeller, getVendorEarnings);
router.patch('/updateDelivery', isAdmin, updateDeliveryStatus);
router.patch('/prepared/:id', isSeller, confirmPreparation);
router.patch('/prepared/:orderId/item/:itemId', isSeller, confirmItemPreparation);
router.patch('/update-payment',isAdmin, updatePayment);
// payment
// router.get("/check-out-session/:cartId", verifyToken, checkOutSession);

router.post("/", createOrder);

// router.patch("/pay/method", verifyToken, updatedOrderPaymentMethod);
export default router;
