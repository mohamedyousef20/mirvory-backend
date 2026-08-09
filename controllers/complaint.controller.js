import Complaint from '../models/complaint.model.js';
import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import createError from '../utils/error.js';
import { createNotifications } from '../utils/notification.js';
import { formatPaginationResponse } from '../middlewares/pagination.js';

// Create a new complaint
export const createComplaint = async (req, res, next) => {
  try {
    let title, message, orderId, images;

    // Handle both FormData and JSON
    if (req.is('multipart/form-data')) {
      title = req.body.title;
      message = req.body.message;
      orderId = req.body.orderId;
      images = req.body.images ? (Array.isArray(req.body.images) ? req.body.images : [req.body.images]) : [];
    } else {
      ({ title, message, orderId, images } = req.body);
    }

    if (!title || !message) {
      return next(new createError('العنوان والرسالة مطلوبان', 400));
    }

    // Validate order if provided
    let order = null;
    if (orderId) {
      order = await Order.findById(orderId);
      if (!order) {
        return next(new createError('الطلب غير موجود', 404));
      }
    }

    const complaint = new Complaint({
      title: title.trim(),
      message: message.trim(),
      user: req.user._id,
      order: orderId || undefined,
      images: images || [],
      priority: 'medium', // Default priority
      status: 'pending'
    });

    await complaint.save();

    // Populate user and order for response
    await complaint.populate('user', 'firstName lastName email');
    if (order) {
      await complaint.populate('order', 'orderNumber');
    }

    // Notify admins about new complaint
    try {
      const io = req.app.get('io');
      const admin = await User.findOne({ role: 'admin' }).select('_id');

      await createNotifications({
        io,
        title: '📢 شكوى جديدة',
        message: `تم تقديم شكوى جديدة: ${complaint.title}`,
        type: 'COMPLAINT_CREATED',
        actor: req.user._id,
        userId: admin._id.toString(),
        data: { complaintId: complaint._id },
        link: `/admin/complaints/${complaint._id}`,
      });

    } catch (err) {
      console.error('Notification Error:', err);
    }


    res.status(201).json({
      success: true,
      message: 'تم إرسال الشكوى بنجاح',
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

// Get all complaints for the current user
export const getMyComplaints = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const sortObj = req.sort || { createdAt: -1 };
    const filterObj = req.filter || {};
    const searchFilter = req.searchFilter || {};

    const filter = { user: req.user._id, ...filterObj, ...searchFilter };

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate('user', 'firstName lastName email')
        .populate('order', 'orderNumber')
        .sort(sortObj)
        .skip(skip)
        .limit(limit),
      Complaint.countDocuments(filter)
    ]);

    res.json(formatPaginationResponse(complaints, total, req.pagination));
  } catch (error) {
    next(error);
  }
};

// Get all complaints for admin
export const getAllComplaintsAdmin = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const sortObj = req.sort || { createdAt: -1 };
    const filterObj = req.filter || {};
    const searchFilter = req.searchFilter || {};

    const filter = { ...filterObj, ...searchFilter };

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate('user', 'firstName lastName email')
        .populate('order', 'orderNumber')
        .sort(sortObj)
        .skip(skip)
        .limit(limit),
      Complaint.countDocuments(filter)
    ]);

    res.json(formatPaginationResponse(complaints, total, req.pagination));
  } catch (error) {
    next(error);
  }
};

// Get all complaints (legacy endpoint)
export const getAllComplaints = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const sortObj = req.sort || { createdAt: -1 };
    const filterObj = req.filter || {};
    const searchFilter = req.searchFilter || {};

    const filter = { ...filterObj, ...searchFilter };

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate('user', 'firstName lastName email')
        .populate('order', 'orderNumber')
        .sort(sortObj)
        .skip(skip)
        .limit(limit),
      Complaint.countDocuments(filter)
    ]);

    res.json(formatPaginationResponse(complaints, total, req.pagination));
  } catch (error) {
    next(error);
  }
};

// Get a single complaint by ID
export const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('user', 'firstName lastName email role')
      .populate('order', 'orderNumber')
      .populate('adminReplies.user', 'firstName lastName role');

    if (!complaint) {
      return next(new createError('الشكوى غير موجودة', 404));
    }

    // Check if user is authorized to view this complaint
    if (req.user.role !== 'admin' && complaint.user._id.toString() !== req.user._id.toString()) {
      return next(new createError('غير مصرح لك بعرض هذه الشكوى', 403));
    }

    res.json({
      success: true,
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

// Update complaint status (admin only)
export const updateComplaintStatus = async (req, res, next) => {
  try {
    const { id, status } = req.body;

    if (!id || !status) {
      return next(new createError('معرف الشكوى والحالة مطلوبان', 400));
    }

    if (!['pending', 'open', 'in_progress', 'resolved', 'cancelled'].includes(status)) {
      return next(new createError('حالة غير صالحة', 400));
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return next(new createError('الشكوى غير موجودة', 404));
    }

    complaint.status = status;

    if (status === 'resolved') {
      complaint.resolvedAt = new Date();
      complaint.resolvedBy = req.user._id;
    }

    await complaint.save();

    // Populate for response
    await complaint.populate('user', 'firstName lastName email');
    await complaint.populate('order', 'orderNumber');
    // Notify user about status update
    try {
      const io = req.app.get('io');
      const statusMessages = {
        pending: 'تم تحديث حالة شكواك إلى: قيد الانتظار',
        open: 'تم فتح الشكوى ومراجعتها',
        in_progress: 'جاري معالجة شكواك',
        resolved: 'تم حل شكواك بنجاح',
        cancelled: 'تم إلغاء شكواك'
      };

      await createNotifications({
        io,
        title: '📢 تحديث حالة الشكوى',
        message: statusMessages[status],
        type: 'COMPLAINT_STATUS_UPDATED',
        actor: req.user._id,
        userId: complaint.user._id.toString(),
        data: { complaintId: complaint._id, status },
        link: `/complaints`,
      });
    } catch (err) {
      console.error('Notification Error:', err);
    }


    res.json({
      success: true,
      message: 'تم تحديث حالة الشكوى بنجاح',
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

// Add admin reply to complaint
export const addAdminReply = async (req, res, next) => {
  try {
    const { id, adminReply } = req.body;

    if (!id || !adminReply) {
      return next(new createError('معرف الشكوى والرد مطلوبان', 400));
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return next(new createError('الشكوى غير موجودة', 404));
    }

    complaint.adminReplies.push({
      user: req.user._id,
      message: adminReply.trim(),
      createdAt: new Date()
    });

    // Update status to in_progress if it was pending
    if (complaint.status === 'pending') {
      complaint.status = 'in_progress';
    }

    await complaint.save();

    // Populate for response
    await complaint.populate('user', 'firstName lastName email');
    await complaint.populate('order', 'orderNumber');
    await complaint.populate('adminReplies.user', 'firstName lastName role');

    // Notify user about new reply
    (async () => {
      try {
        const io = req.app.get('io');

        await createNotifications({
          io,
          title: '💬 رد جديد على شكواك',
          message: 'قام أحد المسؤولين بالرد على شكواك',
          type: 'COMPLAINT_REPLY',
          actor: req.user._id,
          userId: [complaint.user.toString()],
          data: { complaintId: complaint._id },
          link: `/complaints`,
        });
      } catch (err) {
        console.error('Notification Error:', err);
      }
    })();

    res.json({
      success: true,
      message: 'تم إضافة الرد بنجاح',
      data: complaint
    });
  } catch (error) {
    next(error);
  }
};

// Delete a complaint
export const deleteComplaint = async (req, res, next) => {
  try {
    const { id } = req.body;

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return next(new createError('الشكوى غير موجودة', 404));
    }

    // Only allow deletion if user is admin or complaint owner and not resolved
    if (req.user.role !== 'admin') {
      if (complaint.user.toString() !== req.user._id.toString()) {
        return next(new createError('غير مصرح لك بحذف هذه الشكوى', 403));
      }
      if (complaint.status === 'resolved') {
        return next(new createError('لا يمكن حذف شكوى تم حلها', 400));
      }
    }

    await Complaint.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'تم حذف الشكوى بنجاح'
    });
  } catch (error) {
    next(error);
  }
};

// Get complaint statistics (admin only)
export const getComplaintStats = async (req, res, next) => {
  try {
    const stats = await Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsMap = {
      pending: 0,
      in_progress: 0,
      resolved: 0,
      cancelled: 0
    };

    stats.forEach(stat => {
      statsMap[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: statsMap
    });
  } catch (error) {
    next(error);
  }
};

// Get unresolved complaints count (admin only)
export const getUnresolvedCount = async (req, res, next) => {
  try {
    const count = await Complaint.countDocuments({
      status: { $in: ['pending', 'in_progress'] }
    });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    next(error);
  }
};
