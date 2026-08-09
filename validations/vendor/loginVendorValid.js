import Joi from "joi";
import Vendor from "../../models/Vendor.js";
import createError from "../../utils/error.js";

export const loginVendorValid = async (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required().external(async (value) => {
            const vendor = await Vendor.findOne({ email: value });
            if (!vendor) throw new createError("Vendor not found", 404);
        }),
        password: Joi.string().required()
    });

    try {
        await schema.validateAsync(req.body);
        next();
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};
