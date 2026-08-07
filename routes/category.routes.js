import express from 'express'
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory

} from '../controllers/category.controller.js';

import { protect, isAdmin } from '../middlewares/auth.js';
// import { createCategorySchema, updateCategorySchema } from '../validations/category.validation.js';

const router = express.Router();


// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', getCategories);

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Public
router.get('/:id', getCategoryById);



// @route   POST /api/categories
// @desc    Create category
// @access  Private/Admin
router.use(protect, isAdmin)

router.post('/',createCategory);

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private/Admin
router.put('/:id' , updateCategory);

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private/Admin
router.delete('/:id' ,deleteCategory);

export default router;

