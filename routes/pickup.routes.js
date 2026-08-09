import express from 'express';
import {
    createPickupPoint,
    getPickupPoints,
    updatePickupPoint,
    deletePickupPoint
} from '../controllers/pickup.controller.js';
import { protect, isAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Get all pickup points
router.get('/', getPickupPoints);


router.use(protect);

// Create pickup point
router.post('/', isAdmin, createPickupPoint);


// Update pickup point
router.put('/:id', isAdmin, updatePickupPoint);

// Delete pickup point
router.delete('/:id', isAdmin, deletePickupPoint);

export default router;