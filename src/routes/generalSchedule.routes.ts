import express from 'express';
import {
    createGeneralSchedule,
    getAllGeneralSchedules,
    getGeneralScheduleById,
    updateGeneralSchedule,
    deleteGeneralSchedule
} from '../controllers/generalSchedule.controller';

import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/', protect, createGeneralSchedule);
router.get('/', protect, getAllGeneralSchedules);
router.get('/:id', protect, getGeneralScheduleById);
router.put('/:id', protect, updateGeneralSchedule);
router.delete('/:id', protect, deleteGeneralSchedule);

export default router;
