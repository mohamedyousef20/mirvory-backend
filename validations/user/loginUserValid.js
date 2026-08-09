import Joi from "joi";
import User from "../../models/user.model.js";
import createError from "../../utils/error.js";

export const loginUserValid = async (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required().external(async (value) => {
            const user = await User.findOne({ email: value });
            if (!user) throw new createError("لا يوجد مستخدم مسجل ", 404);
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
