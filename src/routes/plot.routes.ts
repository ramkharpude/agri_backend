import express from 'express';
import { createPlot, getUserPlots, getPlotById, getPlotHistory, completePlot } from '../controllers/plot.controller';
import { protect } from '../middleware/auth.middleware'; // Assuming auth middleware exists

const router = express.Router();

router.post('/', protect, createPlot);
router.get('/', protect, getUserPlots);
router.get('/history', protect, getPlotHistory); // Specific path before param
router.get('/:id', protect, getPlotById);
router.put('/:id/complete', protect, completePlot);

export default router;
