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
exports.approveOnlineOrder = exports.getPendingOnlineOrders = exports.createOnlineOrder = exports.cancelInvoice = exports.getUserInvoices = exports.getInvoicesByCustomer = exports.getAllInvoices = exports.getInvoiceById = exports.createInvoice = void 0;
const database_1 = __importDefault(require("../config/database"));
const product_model_1 = __importDefault(require("../models/product.model"));
const customer_model_1 = __importDefault(require("../models/customer.model"));
const invoice_model_1 = __importDefault(require("../models/invoice.model"));
const invoiceItem_model_1 = __importDefault(require("../models/invoiceItem.model"));
const ledgerEntry_model_1 = __importDefault(require("../models/ledgerEntry.model"));
const stockMovement_model_1 = __importDefault(require("../models/stockMovement.model"));
const notification_service_1 = require("../services/notification.service");
const notification_model_1 = __importDefault(require("../models/notification.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const auth_controller_1 = require("./auth.controller");
// ─── Generate Invoice Number ──────────────────────────────────────────────────
const generateInvoiceNumber = () => __awaiter(void 0, void 0, void 0, function* () {
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
        String(today.getMonth() + 1).padStart(2, '0') +
        String(today.getDate()).padStart(2, '0');
    // Count today's invoices to get sequence
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const count = yield invoice_model_1.default.count({
        where: {
            createdAt: {
                [require('sequelize').Op.gte]: startOfDay,
                [require('sequelize').Op.lt]: endOfDay
            }
        }
    });
    const seq = String(count + 1).padStart(4, '0');
    return `INV-${dateStr}-${seq}`;
});
// ─── Create Invoice (ATOMIC BILLING) ──────────────────────────────────────────
const createInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const transaction = yield database_1.default.transaction();
    try {
        const { customerId, items, discountAmount, paymentMode, paidAmount, notes } = req.body;
        if (!customerId || !items || items.length === 0) {
            yield transaction.rollback();
            return res.status(400).json({ message: 'Customer and items are required' });
        }
        // 1. Validate customer
        const customer = yield customer_model_1.default.findByPk(customerId, { transaction });
        if (!customer) {
            yield transaction.rollback();
            return res.status(404).json({ message: 'Customer not found' });
        }
        // 2. Validate stock and prepare items
        let totalAmount = 0;
        const invoiceItems = [];
        const stockUpdates = [];
        for (const item of items) {
            const product = yield product_model_1.default.findByPk(item.productId, { transaction, lock: true });
            if (!product) {
                yield transaction.rollback();
                return res.status(404).json({ message: `Product not found: ID ${item.productId}` });
            }
            if (product.stock < item.quantity) {
                yield transaction.rollback();
                return res.status(400).json({
                    message: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
                });
            }
            const rate = item.rate !== undefined ? Number(item.rate) : (product.offerPrice || product.price);
            const amount = rate * item.quantity;
            totalAmount += amount;
            invoiceItems.push({
                productId: product.id,
                productName: product.name,
                quantity: item.quantity,
                unit: product.unit || 'piece',
                rate,
                amount
            });
            stockUpdates.push({
                product,
                quantity: item.quantity,
                previousStock: product.stock
            });
        }
        // 3. Calculate net amount
        const discount = discountAmount || 0;
        const netAmount = totalAmount - discount;
        // 4. Determine payment status
        let paid = 0;
        let status = 'unpaid';
        if (paymentMode === 'rokh' || paymentMode === 'upi' || paymentMode === 'bank_transfer') {
            paid = netAmount;
            status = 'paid';
        }
        else if (paymentMode === 'partial') {
            paid = paidAmount || 0;
            status = paid >= netAmount ? 'paid' : 'partial';
        }
        else if (paymentMode === 'udhari') {
            paid = 0;
            status = 'unpaid';
        }
        // 5. Generate invoice number
        const invoiceNumber = yield generateInvoiceNumber();
        // 6. Create invoice
        const invoice = yield invoice_model_1.default.create({
            invoiceNumber,
            customerId,
            totalAmount,
            discountAmount: discount,
            netAmount,
            paidAmount: paid,
            paymentMode,
            status,
            notes: notes || null,
            billedBy: ((_a = req.user) === null || _a === void 0 ? void 0 : _a.fullName) || 'Admin'
        }, { transaction });
        // 7. Create invoice items
        for (const item of invoiceItems) {
            yield invoiceItem_model_1.default.create(Object.assign({ invoiceId: invoice.id }, item), { transaction });
        }
        // 8. Reduce stock and create stock movements
        for (const update of stockUpdates) {
            const newStock = update.product.stock - update.quantity;
            yield update.product.update({ stock: newStock }, { transaction });
            yield stockMovement_model_1.default.create({
                productId: update.product.id,
                type: 'sale',
                quantity: -update.quantity,
                previousStock: update.previousStock,
                newStock,
                referenceId: invoiceNumber,
                notes: `Sold via invoice ${invoiceNumber}`
            }, { transaction });
        }
        // 9. Create ledger entry (for udhari/partial tracking)
        const unpaidAmount = netAmount - paid;
        if (unpaidAmount > 0) {
            // Calculate new running balance
            const lastEntry = yield ledgerEntry_model_1.default.findOne({
                where: { customerId },
                order: [['createdAt', 'DESC'], ['id', 'DESC']],
                transaction
            });
            const prevBalance = lastEntry ? lastEntry.balance : 0;
            const newBalance = prevBalance + unpaidAmount;
            yield ledgerEntry_model_1.default.create({
                customerId,
                invoiceId: invoice.id,
                type: 'sale',
                debit: unpaidAmount,
                credit: 0,
                balance: newBalance,
                description: `Invoice ${invoiceNumber} — ₹${netAmount} bill, ₹${paid} paid, ₹${unpaidAmount} udhari`
            }, { transaction });
            // Update customer outstanding
            yield customer.update({
                outstandingAmount: newBalance
            }, { transaction });
        }
        // 10. Commit transaction
        yield transaction.commit();
        // 11. Send notification to customer (if linked to app user)
        if (customer.userId) {
            try {
                const user = yield user_model_1.default.findByPk(customer.userId);
                if (user && user.pushToken) {
                    yield (0, notification_service_1.sendPushNotification)(user.pushToken, '🧾 New Invoice', `Invoice ${invoiceNumber} for ₹${netAmount} has been generated.`);
                }
                yield notification_model_1.default.create({
                    userId: customer.userId,
                    title: '🧾 New Invoice',
                    message: `Invoice ${invoiceNumber} for ₹${netAmount}. ${status === 'paid' ? 'Paid ✅' : `Outstanding: ₹${unpaidAmount}`}`,
                    type: 'invoice',
                    relatedId: invoice.id.toString(),
                    isRead: false
                });
            }
            catch (notifError) {
                console.error('Notification Error (non-critical):', notifError);
            }
        }
        // 12. Return full invoice
        const fullInvoice = yield invoice_model_1.default.findByPk(invoice.id, {
            include: [
                { model: invoiceItem_model_1.default, as: 'items' },
                { model: customer_model_1.default, as: 'customer' }
            ]
        });
        res.status(201).json(fullInvoice);
    }
    catch (error) {
        yield transaction.rollback();
        console.error('Create Invoice Error:', error);
        res.status(500).json({ message: 'Error creating invoice', error: error.message });
    }
});
exports.createInvoice = createInvoice;
// ─── Get Invoice by ID ────────────────────────────────────────────────────────
const getInvoiceById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const invoice = yield invoice_model_1.default.findByPk(req.params.id, {
            include: [
                { model: invoiceItem_model_1.default, as: 'items' },
                { model: customer_model_1.default, as: 'customer' }
            ]
        });
        if (!invoice)
            return res.status(404).json({ message: 'Invoice not found' });
        res.status(200).json(invoice);
    }
    catch (error) {
        console.error('Get Invoice Error:', error);
        res.status(500).json({ message: 'Error fetching invoice', error: error.message });
    }
});
exports.getInvoiceById = getInvoiceById;
// ─── Get All Invoices (with filters) ──────────────────────────────────────────
const getAllInvoices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, paymentMode, date, page = 1, limit = 50 } = req.query;
        let whereClause = {};
        if (status)
            whereClause.status = status;
        if (paymentMode)
            whereClause.paymentMode = paymentMode;
        if (date) {
            const d = new Date(date);
            const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
            whereClause.createdAt = {
                [require('sequelize').Op.gte]: startOfDay,
                [require('sequelize').Op.lt]: endOfDay
            };
        }
        const offset = (Number(page) - 1) * Number(limit);
        const { rows, count } = yield invoice_model_1.default.findAndCountAll({
            where: whereClause,
            include: [{ model: customer_model_1.default, as: 'customer', attributes: ['id', 'name', 'phoneNumber'] }],
            order: [['createdAt', 'DESC']],
            limit: Number(limit),
            offset
        });
        res.status(200).json({ invoices: rows, total: count, page: Number(page), totalPages: Math.ceil(count / Number(limit)) });
    }
    catch (error) {
        console.error('Get All Invoices Error:', error);
        res.status(500).json({ message: 'Error fetching invoices', error: error.message });
    }
});
exports.getAllInvoices = getAllInvoices;
// ─── Get Invoices by Customer ─────────────────────────────────────────────────
const getInvoicesByCustomer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const invoices = yield invoice_model_1.default.findAll({
            where: { customerId: req.params.customerId },
            include: [{ model: invoiceItem_model_1.default, as: 'items' }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(invoices);
    }
    catch (error) {
        console.error('Get Customer Invoices Error:', error);
        res.status(500).json({ message: 'Error fetching invoices', error: error.message });
    }
});
exports.getInvoicesByCustomer = getInvoicesByCustomer;
// ─── User App: Get My Invoices (by linked userId) ─────────────────────────────
const getUserInvoices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return res.status(401).json({ message: 'Not authenticated' });
        // Find customer linked to this user
        const customer = yield customer_model_1.default.findOne({ where: { userId } });
        if (!customer)
            return res.status(200).json([]);
        const invoices = yield invoice_model_1.default.findAll({
            where: { customerId: customer.id },
            include: [{ model: invoiceItem_model_1.default, as: 'items' }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(invoices);
    }
    catch (error) {
        console.error('Get User Invoices Error:', error);
        res.status(500).json({ message: 'Error fetching invoices', error: error.message });
    }
});
exports.getUserInvoices = getUserInvoices;
// ─── Cancel Invoice ───────────────────────────────────────────────────────────
const cancelInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield database_1.default.transaction();
    try {
        const invoiceId = req.params.id;
        const invoice = yield invoice_model_1.default.findByPk(invoiceId, {
            transaction,
            lock: true
        });
        if (!invoice) {
            yield transaction.rollback();
            return res.status(404).json({ message: 'Invoice not found' });
        }
        if (invoice.status === 'cancelled') {
            yield transaction.rollback();
            return res.status(400).json({ message: 'Invoice is already cancelled' });
        }
        // Fetch items separately to avoid Postgres outer join lock issue
        const invoiceItems = yield invoiceItem_model_1.default.findAll({
            where: { invoiceId: invoice.id },
            transaction
        });
        // 1. Restore Stock
        if (invoiceItems && invoiceItems.length > 0) {
            for (const item of invoiceItems) {
                const product = yield product_model_1.default.findByPk(item.productId, { transaction, lock: true });
                if (product) {
                    const newStock = product.stock + item.quantity;
                    yield product.update({ stock: newStock }, { transaction });
                    // Log Reversal Movement
                    yield stockMovement_model_1.default.create({
                        productId: product.id,
                        type: 'adjustment', // Or 'restock'
                        quantity: item.quantity,
                        previousStock: product.stock,
                        newStock: newStock,
                        referenceId: invoice.invoiceNumber,
                        notes: `Restock due to Invoice Cancellation: ${invoice.invoiceNumber}`
                    }, { transaction });
                }
            }
        }
        // 2. Reverse Ledger / Udhari
        const unpaidAmount = invoice.netAmount - invoice.paidAmount;
        if (unpaidAmount > 0) {
            const customer = yield customer_model_1.default.findByPk(invoice.customerId, { transaction, lock: true });
            if (customer) {
                const newBalance = customer.outstandingAmount - unpaidAmount;
                yield ledgerEntry_model_1.default.create({
                    customerId: customer.id,
                    invoiceId: invoice.id,
                    type: 'payment', // Treat reversal as a credit/payment to balance the ledger
                    debit: 0,
                    credit: unpaidAmount,
                    balance: newBalance,
                    description: `Reversal for Cancelled Invoice ${invoice.invoiceNumber}`
                }, { transaction });
                yield customer.update({ outstandingAmount: newBalance }, { transaction });
            }
        }
        // 3. Mark Invoice as Cancelled
        yield invoice.update({ status: 'cancelled' }, { transaction });
        yield transaction.commit();
        res.status(200).json({ message: 'Invoice successfully cancelled and stock restored.', invoice });
    }
    catch (error) {
        yield transaction.rollback();
        console.error('Cancel Invoice Error:', error);
        res.status(500).json({ message: 'Error cancelling invoice', error: error.message });
    }
});
exports.cancelInvoice = cancelInvoice;
// ─── Online Draft Bills (User App Integration) ──────────────────────────────
const createOnlineOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const transaction = yield database_1.default.transaction();
    try {
        const { items, shippingAddress, totalAmount, paymentMethod } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !items || items.length === 0) {
            yield transaction.rollback();
            return res.status(400).json({ message: 'User and items are required' });
        }
        // 1. Find or create Customer profile
        let customer = yield customer_model_1.default.findOne({ where: { userId }, transaction });
        if (!customer) {
            const user = yield user_model_1.default.findByPk(userId, { transaction });
            if (!user) {
                yield transaction.rollback();
                return res.status(404).json({ message: 'User not found' });
            }
            customer = yield customer_model_1.default.create({
                name: user.fullName,
                phoneNumber: user.phoneNumber,
                address: user.address || '',
                userId: user.id,
                outstandingAmount: 0
            }, { transaction });
        }
        // 2. Generate Invoice Number
        const invoiceNumber = yield generateInvoiceNumber();
        // 3. Format shipping info as notes
        const addressText = shippingAddress
            ? `[ONLINE ORDER]\nShip to: ${shippingAddress.fullName}\n${shippingAddress.addressLine}, ${shippingAddress.city}, ${shippingAddress.zipCode}\nPhone: ${shippingAddress.phoneNumber}`
            : '[ONLINE ORDER] Pickup/Direct';
        // 4. Create Draft Invoice (online_pending)
        const invoice = yield invoice_model_1.default.create({
            invoiceNumber,
            customerId: customer.id,
            totalAmount: totalAmount,
            discountAmount: 0,
            netAmount: totalAmount,
            paidAmount: paymentMethod === 'UPI' ? totalAmount : 0,
            paymentMode: paymentMethod || 'upi',
            status: 'online_pending',
            notes: addressText,
            billedBy: 'User App'
        }, { transaction });
        // 5. Add Items
        for (const item of items) {
            // Note: In cart, item is { id, name, price, offerPrice, quantity, ... }
            const rate = item.offerPrice || item.price;
            yield invoiceItem_model_1.default.create({
                invoiceId: invoice.id,
                productId: item.id || item.productId,
                productName: item.name || item.productName,
                quantity: item.quantity,
                unit: item.unit || 'piece',
                rate: rate,
                amount: rate * item.quantity
            }, { transaction });
        }
        yield transaction.commit();
        // Notify Admin (non-critical, don't crash if this fails)
        try {
            yield notification_model_1.default.create({
                userId: 0, // Admin
                title: 'New Online Order',
                message: `A new order (${invoiceNumber}) has been placed by ${customer.name}.`,
                type: 'online_order',
                relatedId: invoice.id.toString(),
                isRead: false
            });
            // Send push notification to admin
            const adminToken = (0, auth_controller_1.getAdminPushToken)();
            if (adminToken) {
                yield (0, notification_service_1.sendPushNotification)(adminToken, '🛒 New Online Order', `${customer.name} placed an order (${invoiceNumber}) for ₹${totalAmount}`);
            }
        }
        catch (notifError) {
            console.error('Admin notification failed (non-critical):', notifError);
        }
        res.status(201).json({ message: 'Order placed successfully', invoice });
    }
    catch (error) {
        try {
            yield transaction.rollback();
        }
        catch (_) { }
        console.error('Create Online Order Error:', error);
        res.status(500).json({ message: 'Error placing order', error: error.message });
    }
});
exports.createOnlineOrder = createOnlineOrder;
const getPendingOnlineOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const invoices = yield invoice_model_1.default.findAll({
            where: { status: 'online_pending' },
            include: [
                { model: customer_model_1.default, as: 'customer', attributes: ['id', 'name', 'phoneNumber'] },
                { model: invoiceItem_model_1.default, as: 'items' }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(invoices);
    }
    catch (error) {
        console.error('Get Pending Orders Error:', error);
        res.status(500).json({ message: 'Error fetching pending orders', error: error.message });
    }
});
exports.getPendingOnlineOrders = getPendingOnlineOrders;
const approveOnlineOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const transaction = yield database_1.default.transaction();
    try {
        const { id } = req.params;
        const invoice = yield invoice_model_1.default.findByPk(id, {
            include: [{ model: invoiceItem_model_1.default, as: 'items' }, { model: customer_model_1.default, as: 'customer' }],
            transaction
        });
        if (!invoice) {
            yield transaction.rollback();
            return res.status(404).json({ message: 'Invoice not found' });
        }
        if (invoice.status !== 'online_pending') {
            yield transaction.rollback();
            return res.status(400).json({ message: 'Invoice is not pending approval' });
        }
        const invoiceItems = invoice.items;
        const customer = invoice.customer;
        // 1. Deduct Stock & Create Stock Movement
        for (const item of invoiceItems) {
            const product = yield product_model_1.default.findByPk(item.productId, { transaction, lock: true });
            if (!product) {
                yield transaction.rollback();
                return res.status(404).json({ message: `Product not found: ${item.productName}` });
            }
            if (product.stock < item.quantity) {
                yield transaction.rollback();
                return res.status(400).json({ message: `Insufficient stock for "${product.name}". Available: ${product.stock}` });
            }
            const newStock = product.stock - item.quantity;
            yield product.update({ stock: newStock }, { transaction });
            yield stockMovement_model_1.default.create({
                productId: product.id,
                type: 'sale',
                quantity: -item.quantity,
                previousStock: product.stock,
                newStock,
                referenceType: 'invoice',
                referenceId: invoice.id,
                notes: `Online Order Approved: ${invoice.invoiceNumber}`
            }, { transaction });
        }
        // 2. Ledger Update
        let finalStatus = 'paid';
        if (invoice.paymentMode === 'udhari') {
            finalStatus = 'unpaid';
            const previousBalance = customer.outstandingAmount;
            const newBalance = previousBalance + invoice.netAmount;
            yield customer.update({ outstandingAmount: newBalance }, { transaction });
            yield ledgerEntry_model_1.default.create({
                customerId: customer.id,
                type: 'debit',
                amount: invoice.netAmount,
                balance: newBalance,
                description: `Online Bill: ${invoice.invoiceNumber}`,
                invoiceId: invoice.id
            }, { transaction });
        }
        // 3. Update Invoice Status
        yield invoice.update({ status: finalStatus, billedBy: ((_a = req.user) === null || _a === void 0 ? void 0 : _a.fullName) || 'Admin' }, { transaction });
        yield transaction.commit();
        // Re-fetch the updated invoice with items for the response
        const updatedInvoice = yield invoice_model_1.default.findByPk(id, {
            include: [
                { model: invoiceItem_model_1.default, as: 'items' },
                { model: customer_model_1.default, as: 'customer' }
            ]
        });
        // Notify user (non-critical)
        try {
            if (customer.userId) {
                const user = yield user_model_1.default.findByPk(customer.userId);
                if (user && user.pushToken) {
                    (0, notification_service_1.sendPushNotification)(user.pushToken, 'Order Approved', `Your order ${invoice.invoiceNumber} has been approved and billed.`);
                }
            }
        }
        catch (notifError) {
            console.error('Push notification failed (non-critical):', notifError);
        }
        res.status(200).json({ message: 'Order approved successfully', invoice: updatedInvoice });
    }
    catch (error) {
        try {
            yield transaction.rollback();
        }
        catch (_) { }
        console.error('Approve Online Order Error:', error);
        res.status(500).json({ message: 'Error approving order', error: error.message });
    }
});
exports.approveOnlineOrder = approveOnlineOrder;
