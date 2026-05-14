import express from 'express';
import { getDashboardStats, getAllDiseases, getAllUsers, getAllPlots, getUserPlots, getShopStats, getUserPlotHistory, togglePlotStatus, getPendingConsultants, approveConsultant, rejectConsultant } from '../controllers/admin.controller';

const router = express.Router();

// Main Dashboard
router.get('/stats', getDashboardStats);

// Shop Dashboard
router.get('/shop-stats', getShopStats);

router.get('/diseases', getAllDiseases);
router.get('/users', getAllUsers);
router.get('/plots', getAllPlots);
router.get('/users/:userId/plots', getUserPlots);
router.get('/users/:userId/plots/history', getUserPlotHistory);
router.put('/plots/:id/status', togglePlotStatus);

// Consultant Management
router.get('/pending-consultants', getPendingConsultants);
router.put('/consultants/:id/approve', approveConsultant);
router.put('/consultants/:id/reject', rejectConsultant);

export default router;
