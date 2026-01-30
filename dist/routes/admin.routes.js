"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admin_controller_1 = require("../controllers/admin.controller");
const router = express_1.default.Router();
// Main Dashboard
router.get('/stats', admin_controller_1.getDashboardStats);
// Shop Dashboard
router.get('/shop-stats', admin_controller_1.getShopStats);
// router.get('/diseases', (req, res, next) => { console.log('Admin Diseases hit'); next(); }, getAllDiseases);
router.get('/diseases', admin_controller_1.getAllDiseases);
// router.get('/users', (req, res, next) => { console.log('Admin Users hit'); next(); }, getAllUsers);
router.get('/users', admin_controller_1.getAllUsers);
// router.get('/plots', (req, res, next) => { console.log('Admin Plots hit'); next(); }, getAllPlots);
router.get('/plots', admin_controller_1.getAllPlots);
// router.get('/users/:userId/plots', (req, res, next) => { console.log('Admin User Plots hit'); next(); }, getUserPlots);
router.get('/users/:userId/plots', admin_controller_1.getUserPlots);
// router.get('/users/:userId/plots/history', (req, res, next) => { console.log('Admin User History hit'); next(); }, getUserPlotHistory);
router.get('/users/:userId/plots/history', admin_controller_1.getUserPlotHistory);
router.put('/plots/:id/status', admin_controller_1.togglePlotStatus);
exports.default = router;
