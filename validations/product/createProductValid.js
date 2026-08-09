import Joi from "joi";
import { Types } from "mongoose";
import Vendor from "../../models/Vendor.js";
import createError from "../../utils/error.js";

export const createProductValid = async (req, res, next) => {
    const schema = Joi.object({
        title: Joi.string().min(3).required(),
        description: Joi.string(),
        price: Joi.number().min(0.01).required(),
        stock: Joi.number().min(0).default(0),
        category: Joi.string().required(),
        vendorId: Joi.string().required().custom(async (value) => {
            if (!Types.ObjectId.isValid(value)) {
                throw new createError("Invalid vendor ID format", 400);
            }
            const vendor = await Vendor.findById(value);
            if (!vendor) throw new createError("Vendor not found", 404);
        }),
        images: Joi.array().items(Joi.string().uri()),
        specifications: Joi.object()
    });

    try {
        await schema.validateAsync(req.body);
        next();
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};
