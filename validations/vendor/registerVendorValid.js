import Joi from "joi";
import Vendor from "../../models/Vendor.js";
import createError from "../../utils/error.js";

export const registerVendorValid = async (req, res, next) => {
    const schema = Joi.object({
        shopName: Joi.string().min(3).required(),
        email: Joi.string().email().required().external(async (value) => {
            const vendor = await Vendor.findOne({ email: value });
            if (vendor) throw new createError("Vendor with this email already exists", 400);
        }),
        password: Joi.string().min(8).required()
    });

    try {
        await schema.validateAsync(req.body);
        next();
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};
