import Joi from "joi";
import { Types } from "mongoose";
import Vendor from "../../models/Vendor.js";
import createError from "../../utils/error.js";

export const updateProductValid = async (req, res, next) => {
    const schema = Joi.object({
        title: Joi.string().min(3),
        description: Joi.string(),
        price: Joi.number().min(0.01),
        stock: Joi.number().min(0),
        category: Joi.string(),
        vendorId: Joi.string().custom(async (value) => {
            if (value && !Types.ObjectId.isValid(value)) {
                throw new createError("Invalid vendor ID format", 400);
            }
            if (value) {
                const vendor = await Vendor.findById(value);
                if (!vendor) throw new createError("Vendor not found", 404);
            }
        }),
        images: Joi.array().items(Joi.string().uri()),
        specifications: Joi.object()
    }).min(1);

    try {
        await schema.validateAsync(req.body);
        next();
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};
