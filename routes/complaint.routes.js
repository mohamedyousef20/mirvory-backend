import express from 'express';
import multer from 'multer';
import {
  createComplaint,
  getMyComplaints,
  getAllComplaintsAdmin,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  addAdminReply,
  deleteComplaint,
  getComplaintStats,
  getUnresolvedCount
} from '../controllers/complaint.controller.js';
import { protect, isAdmin } from '../middlewares/auth.js';
import { paginate } from '../middlewares/pagination.js';
import { sort } from '../middlewares/sort.js';
import { search, buildFilter, commonFilters } from '../middlewares/search.js';

// Configure multer for memory storage (for FormData)
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create a new complaint (supports FormData for image uploads)
router.post('/', upload.none(), createComplaint);

// Get all complaints for the current user
router.get('/user', paginate(12), sort({ createdAt: -1 }), buildFilter(commonFilters.complaint), search(['title', 'message']), getMyComplaints);

// Get all complaints for admin
router.get('/admin', isAdmin, paginate(12), sort({ createdAt: -1 }), buildFilter(commonFilters.complaint), search(['title', 'message']), getAllComplaintsAdmin);

// Get complaint statistics (admin only)
router.get('/stats', isAdmin, getComplaintStats);

// Get unresolved complaints count (admin only)
router.get('/unresolved-count', isAdmin, getUnresolvedCount);

// Get all complaints (legacy endpoint)
router.get('/', paginate(12), sort({ createdAt: -1 }), buildFilter(commonFilters.complaint), search(['title', 'message']), getAllComplaints);

// Get a single complaint by ID
router.get('/:id', getComplaintById);

// Update complaint status (admin only)
router.patch('/status', isAdmin, updateComplaintStatus);

// Add admin reply to complaint (admin only)
router.post('/reply', isAdmin, addAdminReply);

// Delete a complaint
router.delete('/', deleteComplaint);

export default router;
