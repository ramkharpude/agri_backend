import express from 'express';
import { getDashboardStats, getAllDiseases, getAllUsers, getAllPlots, getUserPlots, getShopStats, getUserPlotHistory, togglePlotStatus } from '../controllers/admin.controller';

const router = express.Router();

// Main Dashboard
router.get('/stats', getDashboardStats);

// Shop Dashboard
router.get('/shop-stats', getShopStats);

// router.get('/diseases', (req, res, next) => { console.log('Admin Diseases hit'); next(); }, getAllDiseases);
router.get('/diseases', getAllDiseases);
// router.get('/users', (req, res, next) => { console.log('Admin Users hit'); next(); }, getAllUsers);
router.get('/users', getAllUsers);
// router.get('/plots', (req, res, next) => { console.log('Admin Plots hit'); next(); }, getAllPlots);
router.get('/plots', getAllPlots);
// router.get('/users/:userId/plots', (req, res, next) => { console.log('Admin User Plots hit'); next(); }, getUserPlots);
router.get('/users/:userId/plots', getUserPlots);
// router.get('/users/:userId/plots/history', (req, res, next) => { console.log('Admin User History hit'); next(); }, getUserPlotHistory);
router.get('/users/:userId/plots/history', getUserPlotHistory);
router.put('/plots/:id/status', togglePlotStatus);

export default router;
