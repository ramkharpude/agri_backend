import express from 'express';
import {
    createGeneralSchedule,
    getAllGeneralSchedules,
    getGeneralScheduleById,
    updateGeneralSchedule,
    deleteGeneralSchedule
} from '../controllers/generalSchedule.controller';

const router = express.Router();

router.post('/', createGeneralSchedule);
router.get('/', getAllGeneralSchedules);
router.get('/:id', getGeneralScheduleById);
router.put('/:id', updateGeneralSchedule);
router.delete('/:id', deleteGeneralSchedule);

export default router;
