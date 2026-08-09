import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import mongoose from 'mongoose';
import createError from '../utils/error.js';
import { createNotifications } from '../utils/notification.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// 🔒 عزل كامل: كل مستخدم يرى فقط المستندات المرتبطة بمعرفه الخاص بشكل قطعي
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, notifications });
  } catch (error) { next(error); }
};

// 🔒 تحديث آمن: التأكد من أن المستخدم يغير حالة الإشعار الخاص به فقط لمنع التداخل
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!isValidObjectId(id)) throw createError("المعرف غير صالح", 400);

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id }, // شرط التحقق من الملكية لمنع التلاعب بين الأدوار
      {
        seen: true,
        deleteAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      },
      { new: true }
    );

    if (!notification) throw createError('الإشعار غير موجود أو غير تابع لك', 404);
    res.json({ success: true, notification });
  } catch (error) { next(error); }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, seen: false },
      { $set: { seen: true, deleteAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) } }
    );
    res.json({ success: true, message: 'تم تعليم الجميع كمقروء', modifiedCount: result.modifiedCount });
  } catch (error) { next(error); }
};

// 🔒 حساب معزول بناءً على المعرف الفردي الحقيقي فقط
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      seen: false
    });
    res.json({ success: true, count });
  } catch (error) { next(error); }
};

// Polling endpoint — used when Socket.IO is disabled (ENABLE_SOCKET=false)
// Frontend polls this every 30 seconds to get new notifications
export const pollNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const since = req.query.since ? new Date(req.query.since) : new Date(Date.now() - 60 * 1000);

    const [newNotifications, unreadCount] = await Promise.all([
      Notification.find({ userId, createdAt: { $gt: since } })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      Notification.countDocuments({ userId, seen: false }),
    ]);

    res.json({
      success: true,
      notifications: newNotifications,
      unreadCount,
      polledAt: new Date().toISOString(),
    });
  } catch (error) { next(error); }
};

// 🔒 توزيع البيانات بشكل منفصل (Fan-Out) لمنع تداخل حالات القراءة بين الحسابات
export const sendNotification = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw createError("مرفوض، صلاحيات غير كافية", 403);
    }

    const { title, message, type, userId = [], role, orderId } = req.body;
    if (!title || !message || !type) throw createError('العنوان والرسالة ونوع الإشعار مطلوبة', 400);

    const io = req.app.get("io");

    if (userId && userId.length > 0) {
      // 1. إرسال لمجموعة محددة من المعرفات مسبقاً
      await createNotifications({
        io, title, message, type, actor: req.user._id, userId: userId, data: { orderId }, link: orderId ? `/orders/${orderId}` : '/'
      });
    } else if (role) {
      // 2. إرسال لدور محدد (مثال: الـ Seller فقط عند قبول المنتج)
      const targetUsers = await User.find({ role, isActive: true }).select('_id').lean();
      if (targetUsers.length > 0) {
        const userIds = targetUsers.map(u => u._id.toString());
        await createNotifications({
          io, title, message, type, actor: req.user._id, userId: userIds, data: { orderId }
        });
      }
    } else {
      // 3. إشعار عام لجميع المستخدمين في النظام بصورة مستندات فردية معزولة
      const allUsers = await User.find({ isActive: true }).select('_id').lean();
      if (allUsers.length > 0) {
        const allUserIds = allUsers.map(u => u._id.toString());
        await createNotifications({
          io, title, message, type: 'ALL_USERS', actor: req.user._id, userId: allUserIds, data: {}
        });
      }
    }

    res.status(201).json({ success: true, message: 'تم بث وتوزيع الإشعار بنجاح لجميع الحسابات المستهدفة بشكل مستقل' });
  } catch (error) { next(error); }
};