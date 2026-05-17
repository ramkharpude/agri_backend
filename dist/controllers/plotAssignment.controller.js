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
exports.getApprovedConsultants = exports.getPlotConsultants = exports.getMyAssignedPlots = exports.unassignPlot = exports.assignPlotToConsultant = void 0;
const plotAssignment_model_1 = __importDefault(require("../models/plotAssignment.model"));
const plot_model_1 = __importDefault(require("../models/plot.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
// Admin: Assign a plot to a consultant
const assignPlotToConsultant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { plotId, consultantId } = req.body;
        // Verify consultant exists and has correct role
        const consultant = yield user_model_1.default.findByPk(consultantId);
        if (!consultant || !consultant.role || !consultant.role.includes('consultant')) {
            return res.status(400).json({ message: 'Invalid consultant' });
        }
        // Check if already assigned
        const existing = yield plotAssignment_model_1.default.findOne({ where: { plotId, consultantId } });
        if (existing) {
            return res.status(400).json({ message: 'Plot already assigned to this consultant' });
        }
        const assignment = yield plotAssignment_model_1.default.create({ plotId, consultantId });
        res.status(201).json(assignment);
    }
    catch (error) {
        console.error('Assign Plot Error:', error);
        res.status(500).json({ message: 'Error assigning plot', error: error.message });
    }
});
exports.assignPlotToConsultant = assignPlotToConsultant;
// Admin: Remove assignment
const unassignPlot = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const assignment = yield plotAssignment_model_1.default.findByPk(id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        yield assignment.destroy();
        res.status(200).json({ message: 'Assignment removed' });
    }
    catch (error) {
        console.error('Unassign Plot Error:', error);
        res.status(500).json({ message: 'Error removing assignment', error: error.message });
    }
});
exports.unassignPlot = unassignPlot;
// Consultant: Get my assigned plots
const getMyAssignedPlots = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const consultantId = req.user.id;
        const assignments = yield plotAssignment_model_1.default.findAll({
            where: { consultantId },
            include: [{
                    model: plot_model_1.default,
                    as: 'plot',
                    include: [{ model: user_model_1.default, as: 'user', attributes: ['id', 'fullName', 'phoneNumber', 'address'] }]
                }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(assignments);
    }
    catch (error) {
        console.error('Get My Assigned Plots Error:', error);
        res.status(500).json({ message: 'Error fetching assigned plots', error: error.message });
    }
});
exports.getMyAssignedPlots = getMyAssignedPlots;
// Admin: Get consultants for a specific plot
const getPlotConsultants = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { plotId } = req.params;
        const assignments = yield plotAssignment_model_1.default.findAll({
            where: { plotId },
            include: [{ model: user_model_1.default, as: 'consultant', attributes: ['id', 'fullName', 'phoneNumber', 'specialtyCrops', 'profilePhoto'] }]
        });
        res.status(200).json(assignments);
    }
    catch (error) {
        console.error('Get Plot Consultants Error:', error);
        res.status(500).json({ message: 'Error fetching consultants', error: error.message });
    }
});
exports.getPlotConsultants = getPlotConsultants;
// Admin: Get all approved consultants (for assignment dropdown)
const getApprovedConsultants = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { Op } = require('sequelize');
        const consultants = yield user_model_1.default.findAll({
            where: { role: { [Op.like]: '%consultant%' }, isApproved: true },
            attributes: ['id', 'fullName', 'phoneNumber', 'specialtyCrops', 'profilePhoto']
        });
        res.status(200).json(consultants);
    }
    catch (error) {
        console.error('Get Approved Consultants Error:', error);
        res.status(500).json({ message: 'Error fetching consultants', error: error.message });
    }
});
exports.getApprovedConsultants = getApprovedConsultants;
