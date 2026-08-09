import Coupon from '../models/coupon.model.js';
import Cart from '../models/cart.model.js';
import Order from '../models/order.model.js';
import createError from '../utils/error.js';
// import { createNotifications } from '../utils/notification.js';
import User from '../models/user.model.js';

export const getAllCoupons = async (req, res, next) => {
    try {
        const coupons = await Coupon.find().sort('-createdAt').lean();
        res.json(coupons);
    } catch (error) { next(error); }
};

export const getCouponById = async (req, res, next) => {
    try {
        const coupon = await Coupon.findById(req.params.id).lean();
        if (!coupon) throw createError("كوبون غير موجود", 404);
        res.json(coupon);
    } catch (error) { next(error); }
};

export const createCoupon = async (req, res, next) => {
    try {
        const code = req.body.code.toUpperCase();
        const existing = await Coupon.findOne({ code }).lean();
        if (existing) throw createError("كود الخصم موجود مسبقاً", 400);

        const coupon = new Coupon({ ...req.body, code });
        await coupon.save();

        // // 🔔 NOTIFICATION: Coupon Created (broadcast to all users)
        // (async () => {
        //     try {
        //         const io = req.app.get("io");
        //         const allUsers = await User.find({ isActive: true });

        //         if (allUsers.length > 0) {
        //             await createNotifications({
        //                 io,
        //                 title: '🎉 كوبون جديد!',
        //                 message: `كوبون جديد متاح الآن: ${code} - خصم ${coupon.discountType === 'percentage' ? coupon.discountValue + '%' : coupon.discountValue + ' جنيه'}`,
        //                 type: 'COUPON_CREATED',
        //                 actor: req.user._id,
        //                 userId: allUsers.map(u => u._id.toString()),
        //                 data: { couponId: coupon._id, code: coupon.code },
        //                 link: '/coupons',
        //             });
        //         }
        //     } catch (err) {
        //         console.error("Notification Error:", err);
        //     }
        // })();

        res.status(201).json(coupon);
    } catch (error) { next(error); }
};

export const updateCoupon = async (req, res, next) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) throw createError("كوبون غير موجود", 404);

        if (req.body.code && req.body.code.toUpperCase() !== coupon.code) {
            const existing = await Coupon.findOne({ code: req.body.code.toUpperCase() }).lean();
            if (existing) throw createError("كود الخصم الجديد موجود مسبقاً", 400);
        }

        const updateFields = {
            ...req.body,
            code: req.body.code ? req.body.code.toUpperCase() : coupon.code,
            minCartValue: req.body.minPurchaseAmount !== undefined ? req.body.minPurchaseAmount : req.body.minCartValue,
            maxDiscount: req.body.maxDiscountAmount !== undefined ? req.body.maxDiscountAmount : req.body.maxDiscount,
            updatedAt: new Date(),
        };

        const updatedCoupon = await Coupon.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true });
        res.json(updatedCoupon);
    } catch (error) { next(error); }
};

export const deleteCoupon = async (req, res, next) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) throw createError("كوبون غير موجود", 404);
        res.json(coupon);
    } catch (error) { next(error); }
};

export const validateCouponCode = async (req, res, next) => {
    try {
        const { code } = req.body;

        if (!code) {
            throw createError("كود الخصم مطلوب", 400);
        }

        const cart = await Cart.findOne({
            user: req.user._id
        }).populate("items.product");

        if (!cart || !cart.items || cart.items.length === 0) {
            throw createError("السلة فارغة", 400);
        }

        // حساب إجمالي المنتجات الحالي
        const cartTotal = cart.items.reduce((total, item) => {
            const productPrice =
                item.product.discountedPrice ??
                item.product.price ??
                item.price ??
                0;

            return total + (productPrice * item.quantity);
        }, 0);

        if (cartTotal <= 0) {
            throw createError("إجمالي السلة غير صالح", 400);
        }

        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            isActive: true,
            validFrom: { $lte: new Date() },
            validUntil: { $gte: new Date() }
        });

        if (!coupon) {
            throw createError(
                "كود الخصم غير صالح أو منتهي الصلاحية",
                400
            );
        }

        if (cartTotal < coupon.minCartValue) {
            throw createError(
                `يجب أن تكون السلة بقيمة ${coupon.minCartValue} كحد أدنى لتطبيق الخصم`,
                400
            );
        }

        if (
            coupon.usageLimit &&
            coupon.usedCount >= coupon.usageLimit
        ) {
            throw createError(
                "تم تجاوز الحد الأقصى لاستخدام الكوبون",
                400
            );
        }

        if (coupon.onePerUser) {
            const existingUsage = await Order.findOne({
                buyer: req.user._id,
                "coupon.code": coupon.code
            }).lean();

            if (existingUsage) {
                throw createError(
                    "لقد قمت باستخدام هذا الكود مسبقاً",
                    400
                );
            }
        }

        // حساب الخصم
        let discountAmount;

        if (coupon.discountType === "percentage") {
            discountAmount =
                (cartTotal * coupon.discountValue) / 100;
        } else {
            discountAmount = coupon.discountValue;
        }

        // تطبيق الحد الأقصى للخصم
        if (
            coupon.maxDiscount &&
            discountAmount > coupon.maxDiscount
        ) {
            discountAmount = coupon.maxDiscount;
        }

        // لا يمكن أن يكون الخصم أكبر من قيمة السلة
        discountAmount = Math.min(
            discountAmount,
            cartTotal
        );

        discountAmount = Number(discountAmount.toFixed(2));

        const discountedTotal = Number(
            Math.max(0, cartTotal - discountAmount).toFixed(2)
        );

        // ==========================================
        // IMPORTANT:
        // حفظ بيانات الكوبون + تحديث cart.total
        // ==========================================

        cart.appliedCoupon = {
            code: coupon.code,
            discountAmount,
            discountedTotal,
            originalTotal: cartTotal,
            appliedAt: new Date()
        };

        // 🔥 هذا هو السطر المهم
        cart.total = discountedTotal;

        await cart.save();

        // ==========================================
        // Response
        // ==========================================

        res.json({
            success: true,
            valid: true,

            coupon: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                maxDiscount: coupon.maxDiscount
            },

            originalTotal: cartTotal,
            discountedTotal,
            discountAmount,

            // 🔥 رجّع total أيضًا
            total: cart.total,

            message: "تم تطبيق الخصم بنجاح"
        });

    } catch (error) {
        next(error);
    }
};

export const removeCouponFromCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
        if (!cart) throw createError("السلة غير موجودة", 404);
        if (!cart.appliedCoupon) throw createError("لا يوجد كوبون مطبق", 400);

        const removedCoupon = cart.appliedCoupon;
        const originalSubtotal = cart.items.reduce((total, item) => total + ((item.product.discountedPrice ?? item.product.price) * item.quantity), 0);

        cart.appliedCoupon = undefined;
        cart.total = originalSubtotal;
        await cart.save();

        res.json({
            success: true, message: 'تم إزالة الكوبون بنجاح',
            data: { cart: { _id: cart._id, items: cart.items, total: originalSubtotal, appliedCoupon: null }, removedCoupon, originalTotal: originalSubtotal }
        });
    } catch (error) { next(error); }
};