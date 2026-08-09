import Joi from "joi";
import User from "../../models/User.js";
import createError from "../../utils/error.js";

export const forgotPasswordValid = async (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required().external(async (value) => {
            const user = await User.findOne({ email: value });
            if (!user) throw new createError("No account found with this email", 404);
        })
    });

    try {
        await schema.validateAsync(req.body);
        next();
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};
