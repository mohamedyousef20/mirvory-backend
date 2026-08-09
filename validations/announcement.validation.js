import { body, param, query } from 'express-validator';
import announcementModel from '../models/announcement.model.js';

// Common validation middleware
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    
    res.status(400).json({ 
      success: false, 
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  };
};

// Announcement validation rules
export const createAnnouncementValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
    
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ min: 10 }).withMessage('Content must be at least 10 characters long'),
    
  body('type')
    .optional()
    .isIn(['info', 'warning', 'success', 'error']).withMessage('Invalid announcement type'),
    
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
    
  body('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid ISO8601 date'),
    
  body('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid ISO8601 date')
    .custom((value, { req }) => {
      if (req.body.startDate && new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
    
  body('isMain')
    .optional()
    .isBoolean().withMessage('isMain must be a boolean'),
    
  validate
];

export const updateAnnouncementValidator = [
  param('id')
    .isInt().withMessage('Invalid announcement ID')
    .custom(async (value) => {
      const announcement = await Announcement.findByPk(value);
      if (!announcement) {
        throw new Error('Announcement not found');
      }
    }),
    
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
    
  body('content')
    .optional()
    .trim()
    .isLength({ min: 10 }).withMessage('Content must be at least 10 characters long'),
    
  body('type')
    .optional()
    .isIn(['info', 'warning', 'success', 'error']).withMessage('Invalid announcement type'),
    
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
    
  body('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid ISO8601 date'),
    
  body('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid ISO8601 date')
    .custom((value, { req }) => {
      if (req.body.startDate && new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
    
  body('isMain')
    .optional()
    .isBoolean().withMessage('isMain must be a boolean'),
    
  validate
];

export const getAnnouncementsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
    
  query('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean')
    .toBoolean(),
    
  query('type')
    .optional()
    .isIn(['info', 'warning', 'success', 'error']).withMessage('Invalid announcement type'),
    
  validate
];

export const announcementIdValidator = [
  param('id')
    .isInt().withMessage('Invalid announcement ID')
    .custom(async (value) => {
      const announcement = await announcementModel.findByPk(value);
      if (!announcement) {
        throw new Error('Announcement not found');
      }
    }),
    
  validate
];
