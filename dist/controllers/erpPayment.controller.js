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
exports.getUserPayments = exports.getPaymentReceipt = exports.getPaymentsByCustomer = exports.collectPayment = void 0;
const database_1 = __importDefault(require("../config/database"));
const erpPayment_model_1 = __importDefault(require("../models/erpPayment.model"));
const customer_model_1 = __importDefault(require("../models/customer.model"));
const ledgerEntry_model_1 = __importDefault(require("../models/ledgerEntry.model"));
const invoice_model_1 = __importDefault(require("../models/invoice.model"));
const notification_service_1 = require("../services/notification.service");
const notification_model_1 = __importDefault(require("../models/notification.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
// ─── Generate Receipt Number ──────────────────────────────────────────────────
const generateReceiptNumber = () => __awaiter(void 0, void 0, void 0, function* () {
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
        String(today.getMonth() + 1).padStart(2, '0') +
        String(today.getDate()).padStart(2, '0');
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const count = yield erpPayment_model_1.default.count({
        where: {
            createdAt: {
                [require('sequelize').Op.gte]: startOfDay,
                [require('sequelize').Op.lt]: endOfDay
            }
        }
    });
    const seq = String(count + 1).padStart(4, '0');
    return `RCP-${dateStr}-${seq}`;
});
// ─── Collect Payment (ATOMIC) ─────────────────────────────────────────────────
const collectPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const transaction = yield database_1.default.transaction();
    try {
        const { customerId, amount, paymentMode, invoiceId, notes } = req.body;
        if (!customerId || !amount || amount <= 0) {
            yield transaction.rollback();
            return res.status(400).json({ message: 'Customer ID and valid amount are required' });
        }
        // 1. Validate customer
        const customer = yield customer_model_1.default.findByPk(customerId, { transaction });
        if (!customer) {
            yield transaction.rollback();
            return res.status(404).json({ message: 'Customer not found' });
        }
        // 2. Generate receipt number
        const receiptNumber = yield generateReceiptNumber();
        // 3. Create payment record
        const payment = yield erpPayment_model_1.default.create({
            customerId,
            invoiceId: invoiceId || null,
            amount,
            paymentMode: paymentMode || 'cash',
            receiptNumber,
            notes: notes || null,
            collectedBy: ((_a = req.user) === null || _a === void 0 ? void 0 : _a.fullName) || 'Admin'
        }, { transaction });
        // 4. Create ledger credit entry
        const lastEntry = yield ledgerEntry_model_1.default.findOne({
            where: { customerId },
            order: [['createdAt', 'DESC'], ['id', 'DESC']],
            transaction
        });
        const prevBalance = lastEntry ? lastEntry.balance : 0;
        const newBalance = prevBalance - amount;
        yield ledgerEntry_model_1.default.create({
            customerId,
            invoiceId: invoiceId || null,
            type: 'payment',
            debit: 0,
            credit: amount,
            balance: newBalance,
            description: `Payment received — ₹${amount} via ${paymentMode || 'cash'} (Receipt: ${receiptNumber})`
        }, { transaction });
        // 5. Update customer outstanding
        yield customer.update({
            outstandingAmount: Math.max(0, newBalance)
        }, { transaction });
        // 6. If payment against specific invoice, update invoice status
        if (invoiceId) {
            const invoice = yield invoice_model_1.default.findByPk(invoiceId, { transaction });
            if (invoice) {
                const newPaidAmount = invoice.paidAmount + amount;
                let newStatus = invoice.status;
                if (newPaidAmount >= invoice.netAmount) {
                    newStatus = 'paid';
                }
                else if (newPaidAmount > 0) {
                    newStatus = 'partial';
                }
                // Note: We update paidAmount on the invoice for tracking even though
                // invoices are "immutable" — this only tracks cumulative payments, not bill changes
                yield invoice.update({ paidAmount: newPaidAmount, status: newStatus }, { transaction });
            }
        }
        // 7. Commit
        yield transaction.commit();
        // 8. Notify customer
        if (customer.userId) {
            try {
                const user = yield user_model_1.default.findByPk(customer.userId);
                if (user && user.pushToken) {
                    yield (0, notification_service_1.sendPushNotification)(user.pushToken, '💰 Payment Received', `₹${amount} payment recorded. Remaining: ₹${Math.max(0, newBalance)}`);
                }
                yield notification_model_1.default.create({
                    userId: customer.userId,
                    title: '💰 Payment Received',
                    message: `₹${amount} payment recorded (${receiptNumber}). Remaining balance: ₹${Math.max(0, newBalance)}`,
                    type: 'payment',
                    relatedId: payment.id.toString(),
                    isRead: false
                });
            }
            catch (notifError) {
                console.error('Notification Error (non-critical):', notifError);
            }
        }
        res.status(201).json({
            payment,
            newOutstanding: Math.max(0, newBalance)
        });
    }
    catch (error) {
        yield transaction.rollback();
        console.error('Collect Payment Error:', error);
        res.status(500).json({ message: 'Error collecting payment', error: error.message });
    }
});
exports.collectPayment = collectPayment;
// ─── Get Payment History by Customer ──────────────────────────────────────────
const getPaymentsByCustomer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payments = yield erpPayment_model_1.default.findAll({
            where: { customerId: req.params.customerId },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(payments);
    }
    catch (error) {
        console.error('Get Payments Error:', error);
        res.status(500).json({ message: 'Error fetching payments', error: error.message });
    }
});
exports.getPaymentsByCustomer = getPaymentsByCustomer;
// ─── Get Payment Receipt ──────────────────────────────────────────────────────
const getPaymentReceipt = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payment = yield erpPayment_model_1.default.findByPk(req.params.id, {
            include: [{ model: customer_model_1.default, as: 'customer' }]
        });
        if (!payment)
            return res.status(404).json({ message: 'Payment not found' });
        res.status(200).json(payment);
    }
    catch (error) {
        console.error('Get Receipt Error:', error);
        res.status(500).json({ message: 'Error fetching receipt', error: error.message });
    }
});
exports.getPaymentReceipt = getPaymentReceipt;
// ─── User App: Get My Payments ────────────────────────────────────────────────
const getUserPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return res.status(401).json({ message: 'Not authenticated' });
        const customer = yield customer_model_1.default.findOne({ where: { userId } });
        if (!customer)
            return res.status(200).json([]);
        const payments = yield erpPayment_model_1.default.findAll({
            where: { customerId: customer.id },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(payments);
    }
    catch (error) {
        console.error('Get User Payments Error:', error);
        res.status(500).json({ message: 'Error fetching payments', error: error.message });
    }
});
exports.getUserPayments = getUserPayments;
