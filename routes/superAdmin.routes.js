// import express from 'express';
// import SuperAdminController from '../controllers/superAdmin.controller.js';
// import { protectWithExtensions, isSuperAdmin, hasPermission } from '../middlewares/extendedAuth.js';

// const router = express.Router();

// // Apply authentication and super admin middleware to all routes
// router.use(protectWithExtensions);
// router.use(isSuperAdmin);

// // User Management Routes
// router.get('/users', SuperAdminController.getAllUsers);
// router.post('/users/change-role', hasPermission('manage_users'), SuperAdminController.changeUserRole);
// router.post('/users/suspend', hasPermission('manage_users'), SuperAdminController.suspendUser);
// router.post('/users/unsuspend', hasPermission('manage_users'), SuperAdminController.unsuspendUser);
// router.post('/users/delete', hasPermission('manage_users'), SuperAdminController.deleteUser);

// // Permission Management Routes
// router.get('/permissions', SuperAdminController.getAllPermissions);
// router.post('/users/grant-permissions', hasPermission('manage_users'), SuperAdminController.grantPermissions);
// router.post('/users/revoke-permissions', hasPermission('manage_users'), SuperAdminController.revokePermissions);

// export default router;
