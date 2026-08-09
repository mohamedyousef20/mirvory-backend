import Joi from "joi";
import createError from "../../utils/error.js";
import User from "../../models/user.model.js";
import crypto from 'crypto';

// Forgot password validation
export const forgotPasswordValid = async (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required().external(async (value) => {
            const user = await User.findOne({ email: value });
            if (!user) throw new createError("لم نتمكن من العثور على حساب بهذا البريد الإلكتروني", 404);
        })
    });

    try {
        await schema.validateAsync(req.body);
        next();
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// Verify reset code validation
export const verifyResetCodeValid = async (req, res, next) => {
    const schema = Joi.object({
        code: Joi.string().length(6).pattern(/^\d+$/).required().external(async (value) => {
            const hashedResetCode = crypto
                .createHmac("sha256", process.env.JWT_SECRET)
                .update(value)
                .digest("hex");

            const user = await User.findOne({
                passwordResetCode: hashedResetCode,
                passwordResetCodeExpiresAt: { $gt: Date.now() }
            });

            if (!user) throw new createError("كود التحقق غير صالح أو منتهي الصلاحية", 400);
        })
    });

    try {
        await schema.validateAsync(req.body);
        next();
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// Reset password validation
export const resetPasswordValid = async (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required().external(async (value) => {
            const user = await User.findOne({ email: value });
            if (!user) throw new createError("لم نتمكن من العثور على حساب بهذا البريد الإلكتروني", 404);
            if (!user.passwordResetVerified) throw new createError("يجب التحقق من كود إعادة التعيين أولاً", 400);
        }),
        newPassword: Joi.string().min(8).required().messages({
            'string.min': 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
        })
    });

    try {
        await schema.validateAsync(req.body);
        next();
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// Change password validation (for logged-in users)
export const changePasswordValid = async (req, res, next) => {
    const schema = Joi.object({
        currentPassword: Joi.string().required().external(async (value, helpers) => {
            const user = await User.findById(req.user._id);
            if (!user) throw new createError("المستخدم غير موجود", 404);

            const isMatch = await user.comparePassword(value);
            if (!isMatch) throw new createError("كلمة المرور الحالية غير صحيحة", 400);
        }),
        newPassword: Joi.string().min(8).required().invalid(Joi.ref('currentPassword')).messages({
            'string.min': 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
            'any.invalid': 'كلمة المرور الجديدة يجب أن تختلف عن كلمة المرور الحالية'
        }),
        confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
            'any.only': 'كلمات المرور غير متطابقة'
        })
    });

    try {
        await schema.validateAsync(req.body);
        next();
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// Verify email validation
export const verifyEmailValid = async (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required().external(async (value) => {
            const user = await User.findOne({ email: value });
            if (!user) throw new createError("المستخدم غير موجود", 404);
            if (user.isVerified) throw new createError("البريد الإلكتروني مفعل بالفعل", 400);
        }),
        code: Joi.string().length(6).pattern(/^\d+$/).required()
    });

    try {
        await schema.validateAsync(req.body);
        next();
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// Login validation
export const resendValid = async (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required().external(async (value) => {
            const user = await User.findOne({ email: value });
            if (!user) throw new createError("المستخدم غير موجود", 404);
            if (user.isVerified) throw new createError("البريد الإلكتروني مفعل بالفعل", 400);
        }),    });

    try {
        await schema.validateAsync(req.body);
        next();
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// Update profile validation
export const updateProfileValid = async (req, res, next) => {
    const schema = Joi.object({
        firstName: Joi.string().min(3).optional(),
        lastName: Joi.string().min(3).optional(),
        email: Joi.string().email().optional().external(async (value, helpers) => {
            if (value) {
                const existingUser = await User.findOne({
                    email: value,
                    _id: { $ne: req.user._id }
                });
                if (existingUser) throw new createError("البريد الإلكتروني مسجل مسبقاً", 400);
            }
        }),
        phone: Joi.string().pattern(/^01[0125][0-9]{8}$/).optional().messages({
            'string.pattern.base': 'يرجى إدخال رقم هاتف مصري صحيح'
        })
    }).min(1); // At least one field is required for update

    try {
        await schema.validateAsync(req.body);
        next();
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};