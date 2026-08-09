// middleware/validation/user.validation.js
import Joi from "joi";

export const registerUserValid = async (req, res, next) => {
    // Address schema
    const addressSchema = Joi.object({
        governorate: Joi.string()
            .valid("cairo", "giza", "qalyubia")
            .required()
            .messages({
                "any.only": "المحافظة يجب أن تكون داخل القاهرة الكبرى فقط",
                "string.empty": "المحافظة مطلوبة"
            }),

        city: Joi.string()
            .min(2)
            .required()
            .messages({
                "string.empty": "المدينة / المنطقة مطلوبة"
            }),

        addressLine: Joi.string()
            .min(5)
            .max(300)
            .required()
            .messages({
                "string.empty": "العنوان التفصيلي مطلوب"
            })
    });

    // Vendor profile schema
    const vendorProfileSchema = Joi.object({
        storeName: Joi.string().when(Joi.ref('/role'), {
            is: 'seller',
            then: Joi.required(),
            otherwise: Joi.optional().allow('')
        }),

        businessType: Joi.string()
            .valid('individual', 'company', 'enterprise')
            .default('individual'),

        taxID: Joi.string()
            .optional()
            .allow(''),

        description: Joi.string()
            .max(500)
            .optional()
            .allow(''),

        // Optional advanced fields
        ownerName: Joi.string().optional().allow(''),
        phone: Joi.string()
            .pattern(/^01[0125][0-9]{8}$/)
            .optional()
            .allow(''),

        nationalId: Joi.string()
            .length(14)
            .optional()
            .allow(''),

        city: Joi.string().optional().allow(''),

        payoutMethod: Joi.string()
            .valid('instapay', 'vodafone_cash', 'bank')
            .optional()
            .allow(''),

        payoutAccount: Joi.string()
            .optional()
            .allow('')
    }).optional();

    // Main schema
    const schema = Joi.object({
        firstName: Joi.string()
            .min(3)
            .max(30)
            .required(),

        lastName: Joi.string()
            .min(3)
            .max(30)
            .required(),

        email: Joi.string()
            .email()
            .required(),

        password: Joi.string()
            .min(8)
            .required(),

        phone: Joi.string()
            .pattern(/^01[0125][0-9]{8}$/)
            .required(),

        role: Joi.string()
            .valid("user", "seller")
            .default("user"),

        // FIXED: Allow address object
        address: addressSchema.required(),

        // FIXED: Allow vendor profile
        vendorProfile: vendorProfileSchema
    });

    try {
        // Validate request body
        const validatedData = await schema.validateAsync(req.body, {
            abortEarly: false,
            allowUnknown: false,
            stripUnknown: true
        });

        // Replace body with validated data
        req.body = validatedData;

        next();

    } catch (error) {
        

        if (error.details && Array.isArray(error.details)) {
            const errorMessages = error.details.map(detail => detail.message);

            return res.status(400).json({
                success: false,
                message: "Registration data is invalid",
                errors: errorMessages,
                errorCount: errorMessages.length,
                fields: error.details.map(detail => detail.path.join('.'))
            });
        }

        return res.status(400).json({
            success: false,
            message: error.message || "Error validating data",
            error: error.message
        });
    }
};