import Announcement from '../models/announcement.model.js';
import mongoose from 'mongoose';
import createError from '../utils/error.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createAnnouncement = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') throw createError("مرفوض", 403);

        const { title, titleEn, content, contentEn, isMain, startDate, endDate, image } = req.body;
        const announcement = new Announcement({ title, titleEn, content, contentEn, image, isMain, startDate, endDate });

        await announcement.save();
        res.status(201).json({ status: "success", data: announcement });
    } catch (error) { next(error); }
};

export const getAnnouncements = async (req, res, next) => {
    try {
        const announcements = await Announcement.find({ status: 'active', isMain: false }).sort({ createdAt: -1 }).lean();
        res.json(announcements);
    } catch (error) { next(error); }
};

export const getAnnouncementsForAdmin = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') throw createError("مرفوض", 403);
        const announcements = await Announcement.find().sort({ createdAt: -1 }).lean();
        res.json(announcements);
    } catch (error) { next(error); }
};

export const getMainAnnouncement = async (req, res, next) => {
    try {
        const announcements = await Announcement.find({
            isMain: true, status: 'active', startDate: { $lte: new Date() }, endDate: { $gte: new Date() }
        }).sort({ createdAt: -1 }).lean();

        res.json(announcements);
    } catch (error) { next(error); }
};

export const getAnnouncementById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError("المعرف غير صالح", 400);

        const announcement = await Announcement.findById(id).lean();
        if (!announcement) throw createError('الإعلان غير موجود', 404);
        res.json(announcement);
    } catch (error) { next(error); }
};

export const updateAnnouncement = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') throw createError("مرفوض", 403);

        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError("المعرف غير صالح", 400);

        const updateData = { ...req.body, updatedAt: new Date() };
        const updatedAnnouncement = await Announcement.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        if (!updatedAnnouncement) throw createError('الإعلان غير موجود', 404);
        res.json({ status: "success", data: updatedAnnouncement });
    } catch (error) { next(error); }
};

export const deleteAnnouncement = async (req, res, next) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') throw createError("مرفوض", 403);

        const { id } = req.params;
        if (!isValidObjectId(id)) throw createError("المعرف غير صالح", 400);

        const deleted = await Announcement.findByIdAndDelete(id);
        if (!deleted) throw createError('الإعلان غير موجود', 404);
        res.json({ success: true, message: 'تم الحذف بنجاح' });
    } catch (error) { next(error); }
};