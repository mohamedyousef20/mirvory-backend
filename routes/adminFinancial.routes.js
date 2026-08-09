// import express from 'express';
// import AdminFinancialController from '../controllers/adminFinancial.controller.js';
// import { protectWithExtensions, isSuperAdmin, hasPermission } from '../middlewares/extendedAuth.js';

// const router = express.Router();

// // Apply authentication and permission middleware to all routes
// router.use(protectWithExtensions);
// router.use(hasPermission('manage_wallets'));

// // Balance Management Routes
// router.post('/balance/adjust', AdminFinancialController.manualAdjustBalance);
// router.post('/balance/freeze', AdminFinancialController.freezeBalance);
// router.post('/balance/unfreeze', AdminFinancialController.unfreezeBalance);

// // Financial Information Routes
// router.get('/users/:userId/adjustment-history', AdminFinancialController.getAdjustmentHistory);
// router.get('/users/:userId/financial-status', AdminFinancialController.getUserFinancialStatus);

// export default router;
