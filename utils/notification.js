import Notification from "../models/notification.model.js"; // تأكد من صحة المسار للموديل الخاص بك
import mongoose from "mongoose";

/**
 * خدمة إنشاء وبث الإشعار المتوافقة مع هيكل قاعدة البيانات الجديد
 */
export const createNotifications = async ({
    io,
    title,
    message,
    type,
    actor = null,
    userId = [],    // يمكن استقباله كمصفوفة أو معرف مفرد أو نص
    userIds = [],   // كحقل احتياطي للتوافق مع بعض المتحكمات
    role = null,
    data = {},
    link = "",
    orderId = null,
    productId = null,
}) => {
    try {
        // 1️⃣ استخراج وتأمين حقول الروابط (orderId و productId) لملء حقول السكيما الصريحة
        const finalOrderId = orderId || data?.orderId || data?.order?._id || null;
        const finalProductId = productId || data?.productId || data?.product?._id || null;

        // 2️⃣ توحيد وتنظيف المعرفات المستلمة لمنع التكرار ومعالجة كافة أنواع المدخلات
        const rawIds = [
            ...(Array.isArray(userId) ? userId : userId ? [userId] : []),
            ...(Array.isArray(userIds) ? userIds : userIds ? [userIds] : [])
        ];

        // تصفية المعرفات الفريدة والصالحة لـ MongoDB فقط
        const uniqueUserIds = [...new Set(rawIds.map(id => String(id).trim()))]
            .filter(id => mongoose.Types.ObjectId.isValid(id));

        let docsToInsert = [];

        // 3️⃣ بناء وثائق قاعدة البيانات بناءً على نمط الاستهداف
        if (uniqueUserIds.length > 0) {
            // نمط (مستند مخصص لكل مستخدم): يضمن استقلال حقل seen بنسبة 100%
            docsToInsert = uniqueUserIds.map((uId) => ({
                userId: uId,
                role: role || undefined,
                actor: actor || null,
                title: title.trim(),
                message: message.trim(),
                type,
                data,
                orderId: finalOrderId ? new mongoose.Types.ObjectId(finalOrderId) : undefined,
                productId: finalProductId ? new mongoose.Types.ObjectId(finalProductId) : undefined,
                link,
                seen: false,
            }));
        } else if (role) {
            // نمط استهداف دور معين (مثل الإرسال لكافة الـ admins بدون تحديد معرفات مسبقة)
            docsToInsert = [{
                userId: null,
                role,
                actor: actor || null,
                title: title.trim(),
                message: message.trim(),
                type,
                data,
                orderId: finalOrderId ? new mongoose.Types.ObjectId(finalOrderId) : undefined,
                productId: finalProductId ? new mongoose.Types.ObjectId(finalProductId) : undefined,
                link,
                seen: false,
            }];
        } else {
            // نمط البث العام للمنصة بالكامل (ALL_USERS / ANNOUNCEMENT)
            docsToInsert = [{
                userId: null,
                role: null,
                actor: actor || null,
                title: title.trim(),
                message: message.trim(),
                type,
                data,
                orderId: finalOrderId ? new mongoose.Types.ObjectId(finalOrderId) : undefined,
                productId: finalProductId ? new mongoose.Types.ObjectId(finalProductId) : undefined,
                link,
                seen: false,
            }];
        }

        // 4️⃣ الإدخال الآمن والسريع دفعة واحدة في قاعدة البيانات
        if (docsToInsert.length === 0) return [];
        const savedNotifications = await Notification.insertMany(docsToInsert);

        // 5️⃣ البث الفوري واللحظي عبر الـ Socket.io بدون تعليق الغرف
        if (io) {
            if (uniqueUserIds.length > 0) {
                // بث مخصص لغرفة كل مستخدم على حدة وبشكل نقي
                savedNotifications.forEach((notif) => {
                    if (notif.userId) {
                        const userRoom = String(notif.userId);
                        io.to(userRoom).emit("notification", notif);
                    }
                });
            } else if (role) {
                // بث موجه لغرفة الدور المخصص (مثل بث مباشر لكافة الإداريين المتصلين بغرفة الـ admin)
                if (savedNotifications.length > 0) {
                    io.to(role).emit("notification", savedNotifications[0]);
                }
            } else {
                // بث عام وشامل لجميع الاتصالات المفتوحة بالمنصة
                if (savedNotifications.length > 0) {
                    io.emit("notification", savedNotifications[0]);
                }
            }
        }

        return savedNotifications;
    } catch (error) {
        console.error("❌ Error inside createNotifications service:", error);
        // رمي الخطأ ليتم التقاطه في الـ catch block الخاص بالمتحكم المستدعي لمنع العمليات الصامتة
        throw error;
    }
};