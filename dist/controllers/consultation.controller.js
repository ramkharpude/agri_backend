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
exports.getConsultations = exports.bookConsultation = void 0;
const consultation_model_1 = __importDefault(require("../models/consultation.model"));
// @desc    Book a consultation
// @route   POST /api/consultations
// @access  Private (Farmer)
const bookConsultation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { consultantId, scheduledAt, type, notes } = req.body;
        const consultation = yield consultation_model_1.default.create({
            farmerId: req.user.id,
            consultantId: consultantId || 0, // 0 or null if unassigned
            scheduledAt,
            type,
            notes
        });
        res.status(201).json(consultation);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
});
exports.bookConsultation = bookConsultation;
// @desc    Get user consultations
// @route   GET /api/consultations
// @access  Private
const getConsultations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        let whereClause = {};
        if (role === 'consultant') {
            whereClause = { consultantId: userId };
        }
        else {
            whereClause = { farmerId: userId };
        }
        const consultations = yield consultation_model_1.default.findAll({ where: whereClause });
        res.json(consultations);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
});
exports.getConsultations = getConsultations;
