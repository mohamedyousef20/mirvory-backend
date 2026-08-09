import PickupPoint from '../models/pickupPoint.model.js';
import mongoose from 'mongoose';
import createError from '../utils/error.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createPickupPoint = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw createError("غير مصرح لك بإجراء هذه العملية", 403);
    }

    const { stationName, location, address, phone, workingHours, status } = req.body;
    if (!stationName || !address || !phone) {
      throw createError("جميع الحقول الأساسية مطلوبة (اسم المحطة، العنوان، الهاتف)", 400);
    }

    const pickupPoint = new PickupPoint({
      stationName: stationName.trim(),
      location,
      address: address.trim(),
      phone: phone.trim(),
      workingHours,
      status: status || 'active'
    });

    await pickupPoint.save();
    res.status(201).json({ status: "success", data: pickupPoint });
  } catch (error) {
    next(error);
  }
};

export const getPickupPoints = async (req, res, next) => {
  try {
    const pickupPoints = await PickupPoint.find({ status: 'active' }).lean();
    res.status(200).json(pickupPoints);
  } catch (error) {
    next(error);
  }
};

export const updatePickupPoint = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw createError("غير مصرح لك بإجراء هذه العملية", 403);
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) throw createError("معرف نقطة الاستلام غير صالح", 400);

    const { stationName, location, address, phone, workingHours, status } = req.body;

    const updatedPickupPoint = await PickupPoint.findByIdAndUpdate(
      id,
      {
        stationName: stationName?.trim(),
        location,
        address: address?.trim(),
        phone: phone?.trim(),
        workingHours,
        status,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!updatedPickupPoint) throw createError("نقطة الاستلام غير موجودة", 404);

    res.status(200).json({ status: "success", data: updatedPickupPoint });
  } catch (error) {
    next(error);
  }
};

export const deletePickupPoint = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw createError("غير مصرح لك بإجراء هذه العملية", 403);
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) throw createError("معرف نقطة الاستلام غير صالح", 400);

    const deletedPickupPoint = await PickupPoint.findByIdAndDelete(id);
    if (!deletedPickupPoint) throw createError("نقطة الاستلام غير موجودة", 404);

    res.status(200).json({ status: "success", message: 'تم حذف نقطة الاستلام بنجاح' });
  } catch (error) {
    next(error);
  }
};