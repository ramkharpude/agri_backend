"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.togglePlotStatus = exports.getUserPlotHistory = exports.getUserPlots = exports.getAllPlots = exports.getAllUsers = exports.getAllDiseases = exports.getShopStats = exports.getDashboardStats = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const plot_model_1 = __importDefault(require("../models/plot.model"));
const disease_model_1 = __importDefault(require("../models/disease.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
const sequelize_1 = require("sequelize");
const getDashboardStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const usersCount = yield user_model_1.default.count();
        const plotsCount = yield plot_model_1.default.count({ where: { status: 'active' } });
        const diseasesCount = yield disease_model_1.default.count();
        // Get recent 5 pending diseases
        const recentDiseases = yield disease_model_1.default.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            where: { status: 'pending' }
        });
        res.status(200).json({
            usersCount,
            plotsCount,
            diseasesCount,
            recentDiseases
        });
    }
    catch (error) {
        console.error('Admin Stats Error:', error);
        res.status(500).json({ message: 'Error fetching admin stats', error: error.message });
    }
});
exports.getDashboardStats = getDashboardStats;
const getShopStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productsCount = yield product_model_1.default.count();
        const ordersCount = yield order_model_1.default.count();
        // Count low stock (e.g., quantity < 50)
        // Adjust threshold as needed
        const lowStockCount = yield product_model_1.default.count({
            where: {
                stock: { [sequelize_1.Op.lt]: 5 }
            }
        });
        // Calculate Revenue (Sum of totalAmount for non-cancelled orders)
        // Note: SQLite sum might return string
        const revenueResult = yield order_model_1.default.sum('totalAmount', {
            where: {
                status: { [sequelize_1.Op.ne]: 'cancelled' }
            }
        });
        const totalRevenue = revenueResult || 0;
        res.status(200).json({
            productsCount,
            ordersCount,
            lowStockCount,
            revenue: totalRevenue
        });
    }
    catch (error) {
        console.error("Shop Stats Error:", error);
        res.status(500).json({ message: 'Error fetching shop stats', error: error.message });
    }
});
exports.getShopStats = getShopStats;
const getAllDiseases = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const diseases = yield disease_model_1.default.findAll({
            order: [['createdAt', 'DESC']],
            include: [
                { model: user_model_1.default, as: 'user', attributes: ['fullName', 'phoneNumber'] },
                { model: plot_model_1.default, as: 'plot', attributes: ['name', 'crop'] }
            ]
        });
        res.status(200).json(diseases);
    }
    catch (error) {
        console.error('Admin All Diseases Error:', error);
        res.status(500).json({ message: 'Error fetching diseases', error: error.message });
    }
});
exports.getAllDiseases = getAllDiseases;
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_model_1.default.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(users);
    }
    catch (error) {
        console.error('Admin All Users Error:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});
exports.getAllUsers = getAllUsers;
const getAllPlots = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const plots = yield plot_model_1.default.findAll({
            where: { status: 'active' },
            order: [['createdAt', 'DESC']],
            include: [
                { model: user_model_1.default, as: 'user', attributes: ['fullName', 'phoneNumber'] }
            ]
        });
        res.status(200).json(plots);
    }
    catch (error) {
        console.error('Admin All Plots Error:', error);
        res.status(500).json({ message: 'Error fetching plots', error: error.message });
    }
});
exports.getAllPlots = getAllPlots;
const getUserPlots = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const plots = yield plot_model_1.default.findAll({
            where: { userId, status: 'active' },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(plots);
    }
    catch (error) {
        console.error('Admin User Plots Error:', error);
        res.status(500).json({ message: 'Error fetching user plots', error: error.message });
    }
});
exports.getUserPlots = getUserPlots;
const getUserPlotHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const plots = yield plot_model_1.default.findAll({
            where: { userId, status: 'completed' },
            order: [['updatedAt', 'DESC']]
        });
        res.status(200).json(plots);
    }
    catch (error) {
        console.error('Admin User History Error:', error);
        res.status(500).json({ message: 'Error fetching user history', error: error.message });
    }
});
exports.getUserPlotHistory = getUserPlotHistory;
// Toggle Plot Status (Active/Completed)
const togglePlotStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const plot = yield plot_model_1.default.findByPk(id);
        if (!plot) {
            return res.status(404).json({ message: 'Plot not found' });
        }
        const newStatus = plot.status === 'completed' ? 'active' : 'completed';
        plot.status = newStatus;
        yield plot.save();
        res.status(200).json({ message: `Plot status updated to ${newStatus}`, plot });
    }
    catch (error) {
        console.error('Toggle Plot Status Error:', error);
        res.status(500).json({ message: 'Error updating plot status', error: error.message });
    }
});
exports.togglePlotStatus = togglePlotStatus;
