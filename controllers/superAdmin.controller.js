// import User from '../models/user.model.js';
// import UserExtension from '../models/extendedUser.model.js';
// import Permission from '../models/permission.model.js';
// import AuditLogService from '../services/auditLog.service.js';

// class SuperAdminController {
//   // Get all users with extended information
//   static async getAllUsers(req, res) {
//     try {
//       const {
//         page = 1,
//         limit = 20,
//         role,
//         search,
//         isActive,
//         sortBy = 'createdAt',
//         sortOrder = 'desc'
//       } = req.query;

//       const skip = (page - 1) * limit;
//       const query = {};

//       // Build filters
//       if (role) query.role = role;
//       if (isActive !== undefined) query.isActive = isActive === 'true';

//       if (search) {
//         query.$or = [
//           { firstName: { $regex: search, $options: 'i' } },
//           { lastName: { $regex: search, $options: 'i' } },
//           { email: { $regex: search, $options: 'i' } },
//           { phone: { $regex: search, $options: 'i' } }
//         ];
//       }

//       // Sort configuration
//       const sort = {};
//       sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

//       const [users, total] = await Promise.all([
//         User.find(query)
//           .select('-password -verificationCode -passwordResetCode')
//           .sort(sort)
//           .skip(skip)
//           .limit(parseInt(limit)),
//         User.countDocuments(query)
//       ]);

//       // Get user extensions for all users
//       const userId = users.map(user => user._id);
//       const userExtensions = await UserExtension.find({ userId: { $in: userId } })
//         .populate('adminProfile.permissions');

//       // Merge user data with extensions
//       const usersWithExtensions = users.map(user => {
//         const extension = userExtensions.find(ext => ext.userId.toString() === user._id.toString());
//         return {
//           ...user.toObject(),
//           extendedRole: extension?.extendedRole || user.role,
//           adminProfile: extension?.adminProfile || null,
//           financialControl: extension?.financialControl || null
//         };
//       });

//       res.status(200).json({
//         success: true,
//         data: usersWithExtensions,
//         pagination: {
//           page: parseInt(page),
//           limit: parseInt(limit),
//           total,
//           pages: Math.ceil(total / limit)
//         }
//       });

//     } catch (error) {
//       console.error('Get all users error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'حدث خطأ أثناء جلب المستخدمين',
//         error: error.message
//       });
//     }
//   }

//   // Change user role (with backward compatibility)
//   static async changeUserRole(req, res) {
//     try {
//       const { userId, newRole, reason } = req.body;
//       const adminId = req.user._id;

//       if (!userId || !newRole || !reason) {
//         return res.status(400).json({
//           success: false,
//           message: 'userId, newRole, و reason مطلوبة'
//         });
//       }

//       if (!['super_admin', 'admin', 'seller', 'user'].includes(newRole)) {
//         return res.status(400).json({
//           success: false,
//           message: 'الدور غير صالح'
//         });
//       }

//       const targetUser = await User.findById(userId);
//       if (!targetUser) {
//         return res.status(404).json({
//           success: false,
//           message: 'المستخدم غير موجود'
//         });
//       }

//       const oldRole = targetUser.role;

//       // Get or create user extension
//       let userExtension = await UserExtension.findOne({ userId });
//       if (!userExtension) {
//         userExtension = new UserExtension({ userId });
//       }

//       const oldExtendedRole = userExtension.extendedRole || oldRole;

//       // Update role in original model (for backward compatibility)
//       if (['admin', 'seller', 'user'].includes(newRole)) {
//         targetUser.role = newRole;
//         await targetUser.save();
//       }

//       // Update extended role
//       userExtension.extendedRole = newRole;
//       await userExtension.save();

//       // Log the action
//       await AuditLogService.logAction({
//         adminId,
//         targetUserId: userId,
//         actionType: 'role_change',
//         entityType: 'user',
//         entityId: userId,
//         oldValue: { role: oldRole, extendedRole: oldExtendedRole },
//         newValue: { role: targetUser.role, extendedRole: newRole },
//         reason,
//         ipAddress: AuditLogService.getClientIP(req),
//         userAgent: AuditLogService.getUserAgent(req)
//       });

//       res.status(200).json({
//         success: true,
//         message: 'تم تغيير دور المستخدم بنجاح',
//         data: {
//           oldRole: oldExtendedRole,
//           newRole,
//           userId
//         }
//       });

//     } catch (error) {
//       console.error('Change user role error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'حدث خطأ أثناء تغيير دور المستخدم',
//         error: error.message
//       });
//     }
//   }

//   // Grant permissions to admin
//   static async grantPermissions(req, res) {
//     try {
//       const { userId, permissions, reason } = req.body;
//       const adminId = req.user._id;

//       if (!userId || !permissions || !Array.isArray(permissions) || !reason) {
//         return res.status(400).json({
//           success: false,
//           message: 'userId, permissions (array), و reason مطلوبة'
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

//       // Initialize admin profile if not exists
//       if (!userExtension.adminProfile) {
//         userExtension.adminProfile = {
//           permissions: [],
//           department: 'management',
//           accessLevel: 'limited',
//           twoFactorEnabled: false,
//           backupCodes: []
//         };
//       }

//       // Validate permissions exist
//       const validPermissions = await Permission.find({ name: { $in: permissions } });
//       if (validPermissions.length !== permissions.length) {
//         return res.status(400).json({
//           success: false,
//           message: 'بعض الصلاحيات غير صالحة'
//         });
//       }

//       const oldPermissions = [...userExtension.adminProfile.permissions];

//       // Add new permissions (avoid duplicates)
//       const permissionIds = validPermissions.map(p => p._id);
//       userExtension.adminProfile.permissions = [
//         ...new Set([...userExtension.adminProfile.permissions, ...permissionIds])
//       ];

//       await userExtension.save();

//       // Log the action
//       await AuditLogService.logAction({
//         adminId,
//         targetUserId: userId,
//         actionType: 'permission_grant',
//         entityType: 'permission',
//         entityId: userId,
//         oldValue: { permissions: oldPermissions },
//         newValue: { permissions: userExtension.adminProfile.permissions },
//         reason,
//         ipAddress: AuditLogService.getClientIP(req),
//         userAgent: AuditLogService.getUserAgent(req),
//         metadata: { grantedPermissions: permissions }
//       });

//       res.status(200).json({
//         success: true,
//         message: 'تم منح الصلاحيات بنجاح',
//         data: {
//           grantedPermissions: permissions,
//           totalPermissions: userExtension.adminProfile.permissions.length
//         }
//       });

//     } catch (error) {
//       console.error('Grant permissions error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'حدث خطأ أثناء منح الصلاحيات',
//         error: error.message
//       });
//     }
//   }

//   // Revoke permissions from admin
//   static async revokePermissions(req, res) {
//     try {
//       const { userId, permissions, reason } = req.body;
//       const adminId = req.user._id;

//       if (!userId || !permissions || !Array.isArray(permissions) || !reason) {
//         return res.status(400).json({
//           success: false,
//           message: 'userId, permissions (array), و reason مطلوبة'
//         });
//       }

//       const userExtension = await UserExtension.findOne({ userId })
//         .populate('adminProfile.permissions');

//       if (!userExtension || !userExtension.adminProfile) {
//         return res.status(404).json({
//           success: false,
//           message: 'المستخدم ليس لديه ملف إداري'
//         });
//       }

//       const oldPermissions = [...userExtension.adminProfile.permissions];

//       // Find permission objects to revoke
//       const permissionsToRevoke = await Permission.find({ name: { $in: permissions } });
//       const permissionIdsToRevoke = permissionsToRevoke.map(p => p._id);

//       // Remove specified permissions
//       userExtension.adminProfile.permissions = userExtension.adminProfile.permissions.filter(
//         permId => !permissionIdsToRevoke.some(revokeId => revokeId.equals(permId))
//       );

//       await userExtension.save();

//       // Log the action
//       await AuditLogService.logAction({
//         adminId,
//         targetUserId: userId,
//         actionType: 'permission_revoke',
//         entityType: 'permission',
//         entityId: userId,
//         oldValue: { permissions: oldPermissions },
//         newValue: { permissions: userExtension.adminProfile.permissions },
//         reason,
//         ipAddress: AuditLogService.getClientIP(req),
//         userAgent: AuditLogService.getUserAgent(req),
//         metadata: { revokedPermissions: permissions }
//       });

//       res.status(200).json({
//         success: true,
//         message: 'تم سحب الصلاحيات بنجاح',
//         data: {
//           revokedPermissions: permissions,
//           remainingPermissions: userExtension.adminProfile.permissions.length
//         }
//       });

//     } catch (error) {
//       console.error('Revoke permissions error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'حدث خطأ أثناء سحب الصلاحيات',
//         error: error.message
//       });
//     }
//   }

//   // Suspend user
//   static async suspendUser(req, res) {
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

//       if (!targetUser.isActive) {
//         return res.status(400).json({
//           success: false,
//           message: 'المستخدم معلق بالفعل'
//         });
//       }

//       const oldValue = { isActive: targetUser.isActive };

//       targetUser.isActive = false;
//       await targetUser.save();

//       // Log the action
//       await AuditLogService.logAction({
//         adminId,
//         targetUserId: userId,
//         actionType: 'user_suspend',
//         entityType: 'user',
//         entityId: userId,
//         oldValue,
//         newValue: { isActive: false },
//         reason,
//         ipAddress: AuditLogService.getClientIP(req),
//         userAgent: AuditLogService.getUserAgent(req)
//       });

//       res.status(200).json({
//         success: true,
//         message: 'تم تعليق المستخدم بنجاح'
//       });

//     } catch (error) {
//       console.error('Suspend user error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'حدث خطأ أثناء تعليق المستخدم',
//         error: error.message
//       });
//     }
//   }

//   // Unsuspend user
//   static async unsuspendUser(req, res) {
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

//       if (targetUser.isActive) {
//         return res.status(400).json({
//           success: false,
//           message: 'المستخدم نشط بالفعل'
//         });
//       }

//       const oldValue = { isActive: targetUser.isActive };

//       targetUser.isActive = true;
//       await targetUser.save();

//       // Log the action
//       await AuditLogService.logAction({
//         adminId,
//         targetUserId: userId,
//         actionType: 'user_unsuspend',
//         entityType: 'user',
//         entityId: userId,
//         oldValue,
//         newValue: { isActive: true },
//         reason,
//         ipAddress: AuditLogService.getClientIP(req),
//         userAgent: AuditLogService.getUserAgent(req)
//       });

//       res.status(200).json({
//         success: true,
//         message: 'تم تفعيل المستخدم بنجاح'
//       });

//     } catch (error) {
//       console.error('Unsuspend user error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'حدث خطأ أثناء تفعيل المستخدم',
//         error: error.message
//       });
//     }
//   }

//   // Delete user (soft delete)
//   static async deleteUser(req, res) {
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

//       // Prevent deletion of super admins
//       const userExtension = await UserExtension.findOne({ userId });
//       if (userExtension?.extendedRole === 'super_admin') {
//         return res.status(403).json({
//           success: false,
//           message: 'لا يمكن حذف مشرف عام'
//         });
//       }

//       const oldValue = targetUser.toObject();

//       // Soft delete by deactivating and marking
//       targetUser.isActive = false;
//       targetUser.email = `deleted_${Date.now()}_${targetUser.email}`;
//       await targetUser.save();

//       // Delete user extension
//       if (userExtension) {
//         await UserExtension.deleteOne({ userId });
//       }

//       // Log the action
//       await AuditLogService.logAction({
//         adminId,
//         targetUserId: userId,
//         actionType: 'user_delete',
//         entityType: 'user',
//         entityId: userId,
//         oldValue,
//         newValue: { deleted: true, deletedAt: new Date() },
//         reason,
//         ipAddress: AuditLogService.getClientIP(req),
//         userAgent: AuditLogService.getUserAgent(req)
//       });

//       res.status(200).json({
//         success: true,
//         message: 'تم حذف المستخدم بنجاح'
//       });

//     } catch (error) {
//       console.error('Delete user error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'حدث خطأ أثناء حذف المستخدم',
//         error: error.message
//       });
//     }
//   }

//   // Get all available permissions
//   static async getAllPermissions(req, res) {
//     try {
//       const { category } = req.query;
//       const query = {};

//       if (category) {
//         query.category = category;
//       }

//       const permissions = await Permission.find(query).sort({ category: 1, name: 1 });

//       res.status(200).json({
//         success: true,
//         data: permissions
//       });

//     } catch (error) {
//       console.error('Get all permissions error:', error);
//       res.status(500).json({
//         success: false,
//         message: 'حدث خطأ أثناء جلب الصلاحيات',
//         error: error.message
//       });
//     }
//   }
// }

// export default SuperAdminController;
