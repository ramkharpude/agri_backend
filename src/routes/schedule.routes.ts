import express from 'express';
import { getPlotSchedules, createSchedule, updateSchedule, deleteSchedule, updateScheduleStatus } from '../controllers/schedule.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/:plotId', protect, getPlotSchedules);
router.post('/', protect, createSchedule);
router.put('/:id', protect, updateSchedule);
router.delete('/:id', protect, deleteSchedule);
router.put('/:id/status', protect, updateScheduleStatus);

export default router;
