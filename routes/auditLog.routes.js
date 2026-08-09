// import express from 'express';
// import AuditLogService from '../services/auditLog.service.js';
// import { protectWithExtensions, isSuperAdmin, hasPermission } from '../middlewares/extendedAuth.js';

// const router = express.Router();

// // Apply authentication and permission middleware to all routes
// router.use(protectWithExtensions);
// router.use(hasPermission('manage_system'));

// // Get audit logs with filtering
// router.get('/', async (req, res) => {
//   try {
//     const {
//       adminId,
//       targetUserId,
//       actionType,
//       entityType,
//       startDate,
//       endDate,
//       page = 1,
//       limit = 50
//     } = req.query;

//     const filters = {};
//     if (adminId) filters.adminId = adminId;
//     if (targetUserId) filters.targetUserId = targetUserId;
//     if (actionType) filters.actionType = actionType;
//     if (entityType) filters.entityType = entityType;
//     if (startDate) filters.startDate = startDate;
//     if (endDate) filters.endDate = endDate;

//     const result = await AuditLogService.getAuditLogs(filters, parseInt(page), parseInt(limit));

//     res.status(200).json({
//       success: true,
//       data: result.logs,
//       pagination: result.pagination
//     });

//   } catch (error) {
//     console.error('Get audit logs error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'حدث خطأ أثناء جلب سجل التدقيق',
//       error: error.message
//     });
//   }
// });

// // Get audit logs for specific user
// router.get('/user/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { page = 1, limit = 20 } = req.query;

//     const result = await AuditLogService.getUserAuditLogs(userId, parseInt(page), parseInt(limit));

//     res.status(200).json({
//       success: true,
//       data: result.logs,
//       pagination: result.pagination
//     });

//   } catch (error) {
//     console.error('Get user audit logs error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'حدث خطأ أثناء جلب سجل تدقيق المستخدم',
//       error: error.message
//     });
//   }
// });

// // Get audit logs by admin
// router.get('/admin/:adminId', async (req, res) => {
//   try {
//     const { adminId } = req.params;
//     const { page = 1, limit = 20 } = req.query;

//     const result = await AuditLogService.getAdminAuditLogs(adminId, parseInt(page), parseInt(limit));

//     res.status(200).json({
//       success: true,
//       data: result.logs,
//       pagination: result.pagination
//     });

//   } catch (error) {
//     console.error('Get admin audit logs error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'حدث خطأ أثناء جلب سجل تدقيق المشرف',
//       error: error.message
//     });
//   }
// });

// // Get audit statistics
// router.get('/stats', async (req, res) => {
//   try {
//     const { adminId, startDate, endDate } = req.query;

//     const stats = await AuditLogService.getAuditStats(adminId, startDate, endDate);

//     res.status(200).json({
//       success: true,
//       data: stats
//     });

//   } catch (error) {
//     console.error('Get audit stats error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'حدث خطأ أثناء جلب إحصائيات التدقيق',
//       error: error.message
//     });
//   }
// });

// export default router;
