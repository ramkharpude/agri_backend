import express from 'express';
import { assignPlotToConsultant, unassignPlot, getMyAssignedPlots, getPlotConsultants, getApprovedConsultants } from '../controllers/plotAssignment.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/', protect, assignPlotToConsultant);          // Admin: assign
router.delete('/:id', protect, unassignPlot);               // Admin: unassign
router.get('/consultant', protect, getMyAssignedPlots);     // Consultant: my plots
router.get('/plot/:plotId', protect, getPlotConsultants);    // Admin: who is assigned
router.get('/consultants', protect, getApprovedConsultants); // Admin: list all approved consultants

export default router;
