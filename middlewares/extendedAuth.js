// import jwt from 'jsonwebtoken';
// import User from '../models/user.model.js';
// import UserExtension from '../models/extendedUser.model.js';
// import Permission from '../models/permission.model.js';

// // Enhanced protect middleware that loads user extensions
// export const protectWithExtensions = async (req, res, next) => {
//   try {
//     let token;

//     // First check for token in cookies (for frontend withCredentials: true)
//     if (req.cookies && req.cookies.accessToken) {
//       token = req.cookies.accessToken;
//     }
//     // Fallback to Authorization header (for API clients)
//     else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//       token = req.headers.authorization.split(' ')[1];
//     }

//     if (!token) {
//       return res.status(401).json({ message: 'الرجاء تسجيل الدخول غير مصرح' });
//     }

//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       req.user = await User.findById(decoded.id);

//       if (!req.user) {
//         return res.status(401).json({ message: 'User not found' });
//       }

//       // Load user extensions if they exist
//       req.userExtensions = await UserExtension.findOne({ userId: req.user._id })
//         .populate('adminProfile.permissions');

//       // Set extended role (fallback to original role for backward compatibility)
//       req.extendedRole = req.userExtensions?.extendedRole || req.user.role;

//       next();
//     } catch (error) {
//       res.status(401).json({ message: ' لا يوجد مسخدم غير مصرح' });
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Super Admin middleware
// export const isSuperAdmin = (req, res, next) => {
//   const role = req.extendedRole || req.user?.role;

//   if (req.user && (role === 'super_admin' || role === 'admin')) {
//     next();
//   } else {
//     res.status(403).json({ message: 'مطلوب صلاحيات المسؤول العام' });
//   }
// };

// // Permission-based middleware
// export const hasPermission = (permission) => {
//   return async (req, res, next) => {
//     try {
//       const role = req.extendedRole || req.user?.role;

//       // Super admins have all permissions
//       if (role === 'super_admin') {
//         return next();
//       }

//       // Check if user has the specific permission
//       if (req.userExtensions && req.userExtensions.adminProfile) {
//         const hasPermission = req.userExtensions.adminProfile.permissions.some(
//           p => p.name === permission
//         );

//         if (hasPermission) {
//           return next();
//         }
//       }

//       res.status(403).json({
//         message: `مطلوب صلاحية: ${permission}`
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   };
// };

// // Multiple permissions middleware (user needs at least one)
// export const hasAnyPermission = (permissions) => {
//   return async (req, res, next) => {
//     try {
//       const role = req.extendedRole || req.user?.role;

//       // Super admins have all permissions
//       if (role === 'super_admin') {
//         return next();
//       }

//       // Check if user has any of the required permissions
//       if (req.userExtensions && req.userExtensions.adminProfile) {
//         const hasPermission = req.userExtensions.adminProfile.permissions.some(
//           p => permissions.includes(p.name)
//         );

//         if (hasPermission) {
//           return next();
//         }
//       }

//       res.status(403).json({
//         message: `مطلوب إحدى الصلاحيات: ${permissions.join(', ')}`
//       });
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   };
// };

// // Backward compatible middleware (maintains existing functionality)
// export const isAdmin = (req, res, next) => {
//   const role = req.extendedRole || req.user?.role;

//   if (req.user && (role === 'admin' || role === 'super_admin')) {
//     next();
//   } else {
//     res.status(403).json({ message: 'مطلوب صلاحيات المسؤل' });
//   }
// };

// export const isSeller = (req, res, next) => {
//   const role = req.extendedRole || req.user?.role;

//   if (req.user && (role === 'seller' || role === 'admin' || role === 'super_admin')) {
//     next();
//   } else {
//     res.status(403).json({ message: 'مطلوب صلاحيات البائع' });
//   }
// };

// export const isUser = (req, res, next) => {
//   const role = req.extendedRole || req.user?.role;

//   if (req.user && (role === 'user' || role === 'admin' || role === 'super_admin')) {
//     // Check if email is verified
//     if (!req.user.isVerified) {
//       return res.status(403).json({
//         message: 'يرجى تفعيل البريد الإلكتروني أولاً للوصول إلى هذه الخدمة'
//       });
//     }
//     next();
//   } else {
//     res.status(403).json({ message: 'مطلوب صلاحيات المستخدم' });
//   }
// };

// // Department-based access control
// export const isDepartment = (department) => {
//   return (req, res, next) => {
//     if (req.userExtensions && req.userExtensions.adminProfile) {
//       if (req.userExtensions.adminProfile.department === department || req.extendedRole === 'super_admin') {
//         return next();
//       }
//     }

//     res.status(403).json({
//       message: `مطلوب صلاحيات قسم: ${department}`
//     });
//   };
// };

// // Helper function to check if user has permission (for use in controllers)
// export const checkUserPermission = (user, userExtensions, permission) => {
//   const role = userExtensions?.extendedRole || user.role;

//   // Super admins have all permissions
//   if (role === 'super_admin') {
//     return true;
//   }

//   // Check specific permission
//   if (userExtensions && userExtensions.adminProfile) {
//     return userExtensions.adminProfile.permissions.some(
//       p => p.name === permission
//     );
//   }

//   return false;
// };
