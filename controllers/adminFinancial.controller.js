// import User from '../models/user.model.js';
// import UserExtension from '../models/extendedUser.model.js';
// import AuditLogService from '../services/auditLog.service.js';

// class AdminFinancialController {
//   // Manual balance adjustment
//   static async manualAdjustBalance(req, res) {
//     try {
//       const { userId, amount, type, reason } = req.body;
//       const adminId = req.user._id;

//       // Validate input
//       if (!userId || !amount || !type || !reason) {
//         return res.status(400).json({
//           success: false,
//           message: 'جميع الحقول مطلوبة: userId, amount, type, reason'
//         });
//       }

//       if (!['credit', 'debit'].includes(type)) {
//         return res.status(400).json({
//           success: false,
//           message: 'نوع العملية يجب أن يكون credit أو debit'
//         });
//       }

//       if (amount <= 0) {
//         return res.status(400).json({
//           success: false,
//           message: 'المبلغ يجب أن يكون أكبر من صفر'
//         });
//       }

//       // Find target user
//       const targetUser = await User.findById(userId);
//       if (!targetUser) {
//         return res.status(404).json({
//           success: false,
//           message: 'المستخدم غير موجود'
//         });
//       }

//       // Get or create user extension
//       let userExtension = await UserExtension.findOne({ userId });
//       if (!userExtension) {
//         userExtension = new UserExtension({ userId });
//       }

//       // Initialize financial control if not exists
//       if (!userExtension.financialControl) {
//         userExtension.financialControl = {
//           isFrozen: false,
//           adjustmentHistory: [],
//           withdrawalLimits: {
//             daily: 10000,
//             monthly: 100000
//           },
//           requiresApproval: false
//         };
//       }

//       // Check if wallet is frozen
//       if (userExtension.financialControl.isFrozen) {
//         return res.status(403).json({
//           success: false,
//           message: 'المحفظة مجمدة، لا يمكن إجراء تعديلات'
//         });
//       }

//       const previousBalance = targetUser.wallet.balance;
//       let newBalance;

//       if (type === 'credit') {
//         newBalance = previousBalance + amount;
//       } else {
//         if (previousBalance < amount) {
//           return res.status(400).json({
//             success: false,
//             message: 'الرصيد غير كافي للخصم'
//           });
//         }
//         newBalance = previousBalance - amount;
//       }

//       // Update user balance
//       targetUser.wallet.balance = newBalance;
//       await targetUser.save();

//       // Add adjustment record
//       userExtension.financialControl.adjustmentHistory.push({
//         amount,
//         type,
//         reason,
//         adjustedBy: adminId,
//         previousBalance,
//         newBalance,
//         createdAt: new Date()
//       });

//       await userExtension.save();

//       // Log the action
//       await AuditLogService.logAction({
//         adminId,
//         targetUserId: userId,
//         actionType: 'balance_adjustment',
//         entityType: 'wallet',
//         entityId: targetUser.wallet._id,
//         oldValue: { balance: previousBalance },
//         newValue: { balance: newBalance },
//         reason,
//         ipAddress: AuditLogService.getClientIP(req),
//         userAgent: AuditLogService.getUserAgent(req),
//         metadata: { amount, type }
//       });

//       res.status(200).json({
//         success: true,
//         message: 'تم تعديل الرصيد بنجاح',
//         data: {
//           previousBalance,
//           newBalance,
//           adjustment: { amount, type, reason }
//         }
//       });

//     } catch (error) {
//       console.error('Manual balance adjustment error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'حدث خطأ أثناء تعديل الرصيد',
//         error: error.message
//       });
//     }
//   }

//   // Freeze user balance
//   static async freezeBalance(req, res) {
//     try {
//       const { userId, reason } = req.body;
//       const adminId = req.user._id;

//       if (!userId || !reason) {
//         return res.status(400).json({
//           success: false,
//           message: 'userId و reason مطلوبان'
//         });
//       }

//       const targetUser = await User.findById(userId);
//       if (!targetUser) {
//         return res.status(404).json({
//           success: false,
//           message: 'المستخدم غير موجود'
//         });
//       }

//       // Get or create user extension
//       let userExtension = await UserExtension.findOne({ userId });
//       if (!userExtension) {
//         userExtension = new UserExtension({ userId });
//       }

//       // Initialize financial control if not exists
//       if (!userExtension.financialControl) {
//         userExtension.financialControl = {
//           isFrozen: false,
//           adjustmentHistory: [],
//           withdrawalLimits: {
//             daily: 10000,
//             monthly: 100000
//           },
//           requiresApproval: false
//         };
//       }

//       // Check if already frozen
//       if (userExtension.financialControl.isFrozen) {
//         return res.status(400).json({
//           success: false,
//           message: 'المحفظة مجمدة بالفعل'
//         });
//       }

//       // Freeze the balance
//       userExtension.financialControl.isFrozen = true;
//       userExtension.financialControl.freezeReason = reason;
//       userExtension.financialControl.frozenBy = adminId;
//       userExtension.financialControl.frozenAt = new Date();

//       await userExtension.save();

//       // Log the action
//       await AuditLogService.logAction({
//         adminId,
//         targetUserId: userId,
//         actionType: 'balance_freeze',
//         entityType: 'wallet',
//         entityId: targetUser.wallet._id,
//         oldValue: { isFrozen: false },
//         newValue: { isFrozen: true, freezeReason: reason },
//         reason,
//         ipAddress: AuditLogService.getClientIP(req),
//         userAgent: AuditLogService.getUserAgent(req)
//       });

//       res.status(200).json({
//         success: true,
//         message: 'تم تجميد المحفظة بنجاح',
//         data: {
//           frozenAt: userExtension.financialControl.frozenAt,
//           freezeReason: reason
//         }
//       });

//     } catch (error) {
//       console.error('Freeze balance error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'حدث خطأ أثناء تجميد المحفظة',
//         error: error.message
//       });
//     }
//   }

//   // Unfreeze user balance
//   static async unfreezeBalance(req, res) {
//     try {
//       const { userId, reason } = req.body;
//       const adminId = req.user._id;

//       if (!userId || !reason) {
//         return res.status(400).json({
//           success: false,
//           message: 'userId و reason مطلوبان'
//         });
//       }

//       const targetUser = await User.findById(userId);
//       if (!targetUser) {
//         return res.status(404).json({
//           success: false,
//           message: 'المستخدم غير موجود'
//         });
//       }

//       const userExtension = await UserExtension.findOne({ userId });
//       if (!userExtension || !userExtension.financialControl) {
//         return res.status(400).json({
//           success: false,
//           message: 'المحفظة غير مجمدة'
//         });
//       }

//       // Check if already unfrozen
//       if (!userExtension.financialControl.isFrozen) {
//         return res.status(400).json({
//           success: false,
//           message: 'المحفظة غير مجمدة'
//         });
//       }

//       const previousState = {
//         isFrozen: true,
//         freezeReason: userExtension.financialControl.freezeReason,
//         frozenBy: userExtension.financialControl.frozenBy,
//         frozenAt: userExtension.financialControl.frozenAt
//       };

//       // Unfreeze the balance
//       userExtension.financialControl.isFrozen = false;
//       userExtension.financialControl.freezeReason = undefined;
//       userExtension.financialControl.frozenBy = undefined;
//       userExtension.financialControl.frozenAt = undefined;

//       await userExtension.save();

//       // Log the action
//       await AuditLogService.logAction({
//         adminId,
//         targetUserId: userId,
//         actionType: 'balance_unfreeze',
//         entityType: 'wallet',
//         entityId: targetUser.wallet._id,
//         oldValue: previousState,
//         newValue: { isFrozen: false },
//         reason,
//         ipAddress: AuditLogService.getClientIP(req),
//         userAgent: AuditLogService.getUserAgent(req)
//       });

//       res.status(200).json({
//         success: true,
//         message: 'تم إلغاء تجميد المحفظة بنجاح'
//       });

//     } catch (error) {
//       console.error('Unfreeze balance error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'حدث خطأ أثناء إلغاء تجميد المحفظة',
//         error: error.message
//       });
//     }
//   }

//   // Get user adjustment history
//   static async getAdjustmentHistory(req, res) {
//     try {
//       const { userId } = req.params;
//       const { page = 1, limit = 20 } = req.query;

//       const userExtension = await UserExtension.findOne({ userId })
//         .populate('financialControl.adjustmentHistory.adjustedBy', 'firstName lastName email');

//       if (!userExtension || !userExtension.financialControl) {
//         return res.status(404).json({
//           success: false,
//           message: 'لا يوجد سجل تعديلات لهذا المستخدم'
//         });
//       }

//       const adjustments = userExtension.financialControl.adjustmentHistory
//         .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
//         .slice((page - 1) * limit, page * limit);

//       const total = userExtension.financialControl.adjustmentHistory.length;

//       res.status(200).json({
//         success: true,
//         data: adjustments,
//         pagination: {
//           page: parseInt(page),
//           limit: parseInt(limit),
//           total,
//           pages: Math.ceil(total / limit)
//         }
//       });

//     } catch (error) {
//       console.error('Get adjustment history error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'حدث خطأ أثناء جلب سجل التعديلات',
//         error: error.message
//       });
//     }
//   }

//   // Get user financial status
//   static async getUserFinancialStatus(req, res) {
//     try {
//       const { userId } = req.params;

//       const user = await User.findById(userId).select('wallet balance role');
//       const userExtension = await UserExtension.findOne({ userId });

//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           message: 'المستخدم غير موجود'
//         });
//       }

//       const financialStatus = {
//         currentBalance: user.wallet.balance,
//         currency: user.wallet.currency,
//         isFrozen: userExtension?.financialControl?.isFrozen || false,
//         freezeReason: userExtension?.financialControl?.freezeReason,
//         frozenAt: userExtension?.financialControl?.frozenAt,
//         withdrawalLimits: userExtension?.financialControl?.withdrawalLimits || {
//           daily: 10000,
//           monthly: 100000
//         },
//         requiresApproval: userExtension?.financialControl?.requiresApproval || false,
//         totalAdjustments: userExtension?.financialControl?.adjustmentHistory?.length || 0
//       };

//       res.status(200).json({
//         success: true,
//         data: financialStatus
//       });

//     } catch (error) {
//       console.error('Get user financial status error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'حدث خطأ أثناء جلب الحالة المالية',
//         error: error.message
//       });
//     }
//   }
// }

// export default AdminFinancialController;
