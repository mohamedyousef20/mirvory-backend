import ReturnRequest from '../models/returnRequest.model.js';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import User from '../models/user.model.js';
import { createNotifications } from '../utils/notification.js';
import mongoose from 'mongoose';
import createError from '../utils/error.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createReturnRequest = async (req, res, next) => {
  try {
    const { orderId, reason, itemId, images } = req.body;

    if (!isValidObjectId(orderId) || !isValidObjectId(itemId)) {
      throw createError("بيانات الطلب أو المنتج غير صالحة", 400);
    }

    const order = await Order.findById(orderId);
    if (!order) throw createError('الطلب غير موجود', 404);

    if (order.buyer.toString() !== req.user._id.toString()) {
      throw createError('غير مصرح لك، هذا الطلب لا ينتمي لحسابك', 403);
    }

    if (order.deliveryStatus !== 'delivered') {
      throw createError('لا يمكن تقديم طلب إرجاع لطلب لم يتم توصيله بعد', 400);
    }

    if (order.deliveredAt) {
      const daysSinceDelivery = Math.floor((new Date() - new Date(order.deliveredAt)) / (1000 * 60 * 60 * 24));
      if (daysSinceDelivery > 14) {
        throw createError(`انتهت فترة الإرجاع المسموحة (14 يومًا). مضت ${daysSinceDelivery} يومًا منذ التسليم`, 400);
      }
    }

    const orderItem = order.items.find(item => item._id.toString() === itemId);
    if (!orderItem) throw createError('العنصر المحدد غير موجود في بيانات هذا الطلب', 404);

    const existingReturnRequest = await ReturnRequest.findOne({
      user: req.user._id,
      order: orderId,
      item: itemId,
      status: { $in: ['pending', 'approved', 'processing'] }
    }).lean();

    if (existingReturnRequest) {
      throw createError(`لديك بالفعل طلب إرجاع نشط لهذا العنصر بحالة: ${existingReturnRequest.status}`, 400);
    }

    const recentlyRejected = await ReturnRequest.findOne({
      user: req.user._id,
      order: orderId,
      item: itemId,
      status: 'rejected',
      createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) }
    }).lean();

    if (recentlyRejected) {
      throw createError('تم رفض طلب سابق لهذا العنصر مؤخراً. يرجى المحاولة مرة أخرى بعد 48 ساعة من الرفض', 400);
    }

    const returnRequest = new ReturnRequest({
      user: req.user._id,
      order: orderId,
      product: orderItem.product,
      seller: orderItem.seller,
      reason,
      item: itemId,
      images: images || [],
      status: 'pending'
    });

    await returnRequest.save();

    (async () => {
      try {
        const io = req.app.get("io");
        const admin = await User.findOne({ role: 'admin' }).lean();
        await createNotifications({
          io, title: '🔙 طلب استرجاع جديد',
          message: `تم تقديم طلب استرجاع للمنتج في الطلب #${order.orderNumber || order._id.toString().slice(-6)}`,
          type: 'RETURN_REQUESTED', actor: req.user._id,
          userId: orderItem.seller.toString(),
          data: { returnId: returnRequest._id, orderId: order._id }, link: `/seller/returns/${returnRequest._id}`,
        });

        await createNotifications({
          io, title: '📦 طلب استرجاع جديد للإدارة',
          message: `طلب استرجاع من ${req.user.firstName || 'مستخدم'} للطلب #${order.orderNumber || order._id.toString().slice(-6)}`,
          type: 'RETURN_REQUESTED', actor: req.user._id,
          userId: admin._id.toString(),
          data: { returnId: returnRequest._id, orderId: order._id }, link: `/admin/returns/${returnRequest._id}`,
        })
      } catch (err) { console.error('Notification Error:', err.message); }
    })();

    res.status(201).json({ status: "success", message: 'تم تقديم طلب الإرجاع بنجاح', data: returnRequest });
  } catch (error) {
    next(error);
  }
};

export const getReturnRequests = async (req, res, next) => {
  try {
    const returnRequests = await ReturnRequest.find({
      $or: [
        { user: req.user._id },
        { seller: req.user._id }
      ]
    })
      .populate('order')
      .populate('product')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(returnRequests);
  } catch (error) {
    next(error);
  }
};

export const getReturnRequestsForAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw createError("غير مصرح بالدخول", 403);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const returnRequests = await ReturnRequest.find({})
      .populate('user', 'firstName lastName email phone')
      .populate('seller', 'firstName lastName email phone')
      .populate('order', 'orderNumber buyer')
      .populate('product', 'title price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ReturnRequest.countDocuments();
    res.status(200).json({
      data: returnRequests,
      pagination: { currentPage: page, totalPages: Math.ceil(total / limit), total }
    });
  } catch (error) {
    next(error);
  }
};

export const canCreateReturnRequest = async (req, res, next) => {
  try {
    const { orderId, itemId } = req.params;
    if (!isValidObjectId(orderId) || !isValidObjectId(itemId)) throw createError("المعرفات غير صالحة", 400);

    const existingReturnRequest = await ReturnRequest.findOne({
      user: req.user._id,
      order: orderId,
      item: itemId,
      status: { $in: ['pending', 'approved', 'processing'] }
    }).lean();

    const canCreate = !existingReturnRequest;

    res.status(200).json({
      canCreate,
      existingRequest: canCreate ? null : {
        id: existingReturnRequest._id,
        status: existingReturnRequest.status,
        createdAt: existingReturnRequest.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateReturnStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw createError("صلاحيات غير كافية", 403);
    }

    const { status, returnId } = req.body;
    if (!isValidObjectId(returnId)) throw createError("معرف الطلب غير صالح", 400);

    const validStatuses = ['pending', 'approved', 'rejected', 'processed'];
    if (!validStatuses.includes(status)) throw createError('حالة الإرجاع غير صحيحة', 400);

    const returnRequest = await ReturnRequest.findById(returnId);
    if (!returnRequest) throw createError('طلب الإرجاع غير موجود', 404);

    returnRequest.status = status;
    await returnRequest.save();

    (async () => {
      try {
        const io = req.app.get("io");
        const buyerMessages = {
          approved: '✅ تم الموافقة على طلب الإرجاع الخاص بك، وسيتم التنسيق معك قريباً.',
          rejected: '❌ تم رفض طلب الإرجاع الخاص بك.',
          processed: '💸 تم استرجاع المبلغ بنجاح وإغلاق الطلب.',
        };

        const sellerMessages = {
          approved: '🔔 تمت الموافقة على طلب إرجاع منتج من طلباتك.',
          rejected: '🚫 تم رفض طلب الإرجاع الخاص بمنتج من متجرك.',
          processed: '💸 تم إكمال عملية الإرجاع لهذا الطلب.',
        };

        await createNotifications({
          io, title: '📢 تحديث حالة طلب الإرجاع',
          message: buyerMessages[status] || 'تم تحديث حالة طلب الإرجاع الخاص بك.',
          type: 'RETURN_STATUS_UPDATED', actor: req.user._id, userId: [returnRequest.user.toString()],
          data: { returnId: returnRequest._id, status }, link: `/returns/${returnRequest._id}`,
        });

        await createNotifications({
          io, title: '📢 تحديث حالة طلب الإرجاع',
          message: sellerMessages[status] || 'تم تحديث حالة طلب الإرجاع الخاص بمنتج من متجرك.',
          type: 'RETURN_STATUS_UPDATED', actor: req.user._id, userId: [returnRequest.seller.toString()],
          data: { returnId: returnRequest._id, status }, link: `/seller/returns/${returnRequest._id}`,
        });
      } catch (err) { console.error(err); }
    })();

    res.status(200).json({ status: "success", message: 'تم تحديث حالة طلب الإرجاع بنجاح', data: returnRequest });
  } catch (error) {
    next(error);
  }
};

export const deleteReturnRequest = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw createError("صلاحيات غير كافية", 403);
    }

    const { id } = req.body;
    if (!isValidObjectId(id)) throw createError("المعرف غير صالح", 400);

    const deleted = await ReturnRequest.findByIdAndDelete(id);
    if (!deleted) throw createError("الطلب غير موجود بالفعل", 404);

    res.status(200).json({ success: true, message: 'تم حذف طلب الارجاع بنجاح' });
  } catch (error) {
    next(error);
  }
};

export const getReturnRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) throw createError("المعرف غير صالح", 400);

    const returnRequest = await ReturnRequest.findById(id)
      .populate('order', 'orderNumber createdAt')
      .populate('product')
      .populate('user', 'firstName lastName email')
      .populate('seller', 'firstName lastName email');
    if (!returnRequest) throw createError('طلب الإرجاع غير موجود', 404);
    const userId = req.user?._id.toString();
    const role = req.user.role;

    const isOwner = returnRequest.user?._id?.toString() === userId;
    const isSeller = returnRequest.seller?._id?.toString() === userId;
    const isAdmin = role === 'admin' || role === 'super_admin';

    if (!isOwner && !isSeller && !isAdmin) {
      throw createError('غير مصرح لك باستعراض هذا الطلب', 403);
    }

    res.status(200).json(returnRequest);
  } catch (error) {
    next(error);
  }
};