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
exports.diagnoseDisease = exports.getDiseaseDetails = exports.getUserDiseases = exports.reportDisease = void 0;
const disease_model_1 = __importDefault(require("../models/disease.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const notification_service_1 = require("../services/notification.service");
const notification_controller_1 = require("./notification.controller");
// Report a new disease
const reportDisease = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, plotId } = req.body;
        const userId = req.user.id;
        let imageUrls = [];
        if (req.files && Array.isArray(req.files)) {
            // Multer-storage-cloudinary puts the URL in file.path
            imageUrls = req.files.map(file => file.path);
        }
        const newReport = yield disease_model_1.default.create({
            userId,
            plotId: plotId || null,
            title,
            description,
            images: imageUrls,
            status: 'pending'
        });
        res.status(201).json(newReport);
    }
    catch (error) {
        console.error('Report Disease Error:', error);
        res.status(500).json({ message: 'Error reporting disease', error: error.message });
    }
});
exports.reportDisease = reportDisease;
// Get user's disease history
const getUserDiseases = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const reports = yield disease_model_1.default.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(reports);
    }
    catch (error) {
        console.error('Get Diseases Error:', error);
        res.status(500).json({ message: 'Error fetching history', error: error.message });
    }
});
exports.getUserDiseases = getUserDiseases;
// Get specific disease details
const getDiseaseDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const report = yield disease_model_1.default.findByPk(id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        res.status(200).json(report);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching details', error: error.message });
    }
});
exports.getDiseaseDetails = getDiseaseDetails;
// Diagnose a disease (Admin only)
const diagnoseDisease = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { solution } = req.body;
        const consultantName = req.user.fullName; // Assuming admin's name is used
        const report = yield disease_model_1.default.findByPk(id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        report.solution = solution;
        report.consultantName = consultantName;
        report.status = 'resolved';
        yield report.save();
        // Send Push Notification
        const user = yield user_model_1.default.findByPk(report.userId);
        if (user && user.pushToken) {
            yield (0, notification_service_1.sendPushNotification)(user.pushToken, 'Disease Diagnosis Update', `Your report "${report.title}" has been updated with a solution.`);
        }
        // Save to in-app notifications
        yield (0, notification_controller_1.createNotification)(report.userId, 'Disease Report Diagnosed', `Your report "${report.title}" has been resolved. Tap to view solution.`, 'disease', report.id.toString());
        res.status(200).json(report);
    }
    catch (error) {
        console.error('Diagnose Disease Error:', error);
        res.status(500).json({ message: 'Error updating diagnosis', error: error.message });
    }
});
exports.diagnoseDisease = diagnoseDisease;
