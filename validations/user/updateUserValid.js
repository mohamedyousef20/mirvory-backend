import Joi from "joi";

export const updateUserValid = async (req, res, next) => {
    const schema = Joi.object({
        firstName: Joi.string().min(3).messages({
            "string.min": "First name must be at least 3 characters",
            "string.base": "First name must be a valid string"
        }),

        lastName: Joi.string().min(3).messages({
            "string.min": "Last name must be at least 3 characters",
            "string.base": "Last name must be a valid string"
        }),

        phone: Joi.string().pattern(/^01[0125][0-9]{8}$/).messages({
            "string.pattern.base": "Invalid phone number, must be a valid Egyptian number",
            "string.base": "Phone must be a valid string"
        }),

        addresses: Joi.array().items(
            Joi.object({
                street: Joi.string().messages({
                    "string.empty": "Street is required"
                }),
                city: Joi.string().messages({
                    "string.empty": "City is required"
                }),
                state: Joi.string().messages({
                    "string.empty": "State is required"
                }),
                country: Joi.string().default("Egypt"),
                isDefault: Joi.boolean().default(false)
            })
        )
    });
    try {
        await schema.validateAsync(req.body, {
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: true
        });
        next();
    } catch (error) {
        

        if (error.details && Array.isArray(error.details)) {
            const errorMessages = error.details.map(detail => {
                return detail.message;
            });

            return res.status(400).json({
                success: false,
                message: "Updated Profile  data is invalid",
                errors: errorMessages,
                errorCount: errorMessages.length,
                fields: error.details.map(detail => detail.path[0])
            });
        }

        return res.status(400).json({
            success: false,
            message: error.message || "Error validating data",
            error: error.message
        });
    }
};