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
exports.getPlotById = exports.completePlot = exports.getPlotHistory = exports.getUserPlots = exports.createPlot = void 0;
const plot_model_1 = __importDefault(require("../models/plot.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
// Create a new plot
const createPlot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, season, crop, variety, sowingDate, soilType, area, length, width, numberOfPlants, village, taluka, district } = req.body;
        const userId = req.user.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const newPlot = yield plot_model_1.default.create({
            userId,
            name,
            season,
            crop,
            variety,
            sowingDate,
            soilType,
            area,
            length,
            width,
            numberOfPlants,
            village,
            taluka,
            district
        });
        res.status(201).json(newPlot);
    }
    catch (error) {
        console.error('Create Plot Error:', error);
        res.status(500).json({ message: 'Error creating plot', error: error.message });
    }
});
exports.createPlot = createPlot;
// Get all plots for the logged-in user (Active only)
const getUserPlots = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const plots = yield plot_model_1.default.findAll({
            where: {
                userId,
                status: 'active'
            },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(plots);
    }
    catch (error) {
        console.error('Get Plots Error:', error);
        res.status(500).json({ message: 'Error fetching plots', error: error.message });
    }
});
exports.getUserPlots = getUserPlots;
// Get completed plot history
const getPlotHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const plots = yield plot_model_1.default.findAll({
            where: {
                userId,
                status: 'completed'
            },
            order: [['updatedAt', 'DESC']]
        });
        res.status(200).json(plots);
    }
    catch (error) {
        console.error('Get History Error:', error);
        res.status(500).json({ message: 'Error fetching history', error: error.message });
    }
});
exports.getPlotHistory = getPlotHistory;
// Mark plot as completed
const completePlot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const plot = yield plot_model_1.default.findOne({ where: { id, userId } });
        if (!plot) {
            return res.status(404).json({ message: 'Plot not found' });
        }
        plot.status = 'completed';
        yield plot.save();
        res.status(200).json({ message: 'Plot marked as completed', plot });
    }
    catch (error) {
        console.error('Complete Plot Error:', error);
        res.status(500).json({ message: 'Error updating plot status', error: error.message });
    }
});
exports.completePlot = completePlot;
// Get single plot by ID (for Admin/User)
const getPlotById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const plot = yield plot_model_1.default.findByPk(id, {
            include: [{ model: user_model_1.default, as: 'user', attributes: ['fullName', 'phoneNumber', 'id'] }]
        });
        if (!plot) {
            return res.status(404).json({ message: 'Plot not found' });
        }
        res.status(200).json(plot);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching plot', error: error.message });
    }
});
exports.getPlotById = getPlotById;
