import express from 'express';
import {
    createAnnouncement,
    getAnnouncements,
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement,
    getMainAnnouncement,
    getAnnouncementsForAdmin,
} from '../controllers/announcement.controller.js';
import { protect, isAdmin } from '../middlewares/auth.js';

const router = express.Router();


// Get active announcement (public)
router.get('/', getAnnouncements);
// Get main announcement (public)
router.get('/main', getMainAnnouncement);


// Protect all routes below this middleware
router.use(protect);
router.get('/all', getAnnouncementsForAdmin);

router.get('/:id', getAnnouncementById);

// Get all announcements (admin)

router.use(isAdmin)
// Create announcement (admin only)
router.post('/', createAnnouncement);

// Get single announcement (authenticated users)

// Update announcement (admin only)
router.patch('/:id', updateAnnouncement);

// Delete announcement (admin only)
router.delete('/:id', deleteAnnouncement);

export default router;