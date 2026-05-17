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
exports.getUserUdhari = exports.getOutstandingSummary = exports.getCustomerLedger = void 0;
const ledgerEntry_model_1 = __importDefault(require("../models/ledgerEntry.model"));
const customer_model_1 = __importDefault(require("../models/customer.model"));
const invoice_model_1 = __importDefault(require("../models/invoice.model"));
const sequelize_1 = require("sequelize");
// ─── Get Customer Ledger ──────────────────────────────────────────────────────
const getCustomerLedger = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { customerId } = req.params;
        const customer = yield customer_model_1.default.findByPk(customerId);
        if (!customer)
            return res.status(404).json({ message: 'Customer not found' });
        const entries = yield ledgerEntry_model_1.default.findAll({
            where: { customerId },
            include: [{ model: invoice_model_1.default, as: 'invoice', attributes: ['invoiceNumber', 'netAmount', 'status'] }],
            order: [['createdAt', 'DESC'], ['id', 'DESC']]
        });
        res.status(200).json({
            customer: {
                id: customer.id,
                name: customer.name,
                phoneNumber: customer.phoneNumber,
                outstandingAmount: customer.outstandingAmount
            },
            entries
        });
    }
    catch (error) {
        console.error('Get Customer Ledger Error:', error);
        res.status(500).json({ message: 'Error fetching ledger', error: error.message });
    }
});
exports.getCustomerLedger = getCustomerLedger;
// ─── Get Outstanding Summary (all customers with pending) ─────────────────────
const getOutstandingSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customers = yield customer_model_1.default.findAll({
            where: { outstandingAmount: { [sequelize_1.Op.gt]: 0 } },
            order: [['outstandingAmount', 'DESC']],
            attributes: ['id', 'name', 'phoneNumber', 'outstandingAmount']
        });
        const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingAmount, 0);
        res.status(200).json({ customers, totalOutstanding });
    }
    catch (error) {
        console.error('Get Outstanding Summary Error:', error);
        res.status(500).json({ message: 'Error fetching outstanding', error: error.message });
    }
});
exports.getOutstandingSummary = getOutstandingSummary;
// ─── User App: Get My Udhari ──────────────────────────────────────────────────
const getUserUdhari = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return res.status(401).json({ message: 'Not authenticated' });
        const customer = yield customer_model_1.default.findOne({ where: { userId } });
        if (!customer)
            return res.status(200).json({ outstandingAmount: 0, entries: [] });
        const entries = yield ledgerEntry_model_1.default.findAll({
            where: { customerId: customer.id },
            include: [{ model: invoice_model_1.default, as: 'invoice', attributes: ['invoiceNumber', 'netAmount'] }],
            order: [['createdAt', 'DESC'], ['id', 'DESC']]
        });
        res.status(200).json({
            outstandingAmount: customer.outstandingAmount,
            entries
        });
    }
    catch (error) {
        console.error('Get User Udhari Error:', error);
        res.status(500).json({ message: 'Error fetching udhari', error: error.message });
    }
});
exports.getUserUdhari = getUserUdhari;
