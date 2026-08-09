import Joi from "joi";
import { Types } from "mongoose";
import createError from "../../utils/error.js";

export const idParamValid = (req, res, next) => {
    const schema = Joi.object({
        id: Joi.string().custom((value, helpers) => {
            if (!Types.ObjectId.isValid(value)) {
                throw new createError("Invalid ID format", 400);
            }
            return value;
        }).required()
    });

    const { error } = schema.validate(req.params);
    if (error) {
        return res.status(400).json({ message: error.message });
    }
    next();
};
