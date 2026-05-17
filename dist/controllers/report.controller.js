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
exports.getErpDashboardStats = exports.getStockValuation = exports.getPendingUdhari = exports.getCustomerWiseSales = exports.getProductWiseSales = exports.getMonthlySales = exports.getWeeklySales = exports.getDailySales = void 0;
const invoice_model_1 = __importDefault(require("../models/invoice.model"));
const invoiceItem_model_1 = __importDefault(require("../models/invoiceItem.model"));
const customer_model_1 = __importDefault(require("../models/customer.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
const erpPayment_model_1 = __importDefault(require("../models/erpPayment.model"));
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
// ─── Daily Sales Report ───────────────────────────────────────────────────────
const getDailySales = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date } = req.query;
        const d = date ? new Date(date) : new Date();
        const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
        const invoices = yield invoice_model_1.default.findAll({
            where: { createdAt: { [sequelize_1.Op.gte]: startOfDay, [sequelize_1.Op.lt]: endOfDay } },
            include: [{ model: customer_model_1.default, as: 'customer', attributes: ['name', 'phoneNumber'] }],
            order: [['createdAt', 'DESC']]
        });
        const totalSales = invoices.reduce((sum, inv) => sum + inv.netAmount, 0);
        const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
        const totalUdhari = totalSales - totalCollected;
        const invoiceCount = invoices.length;
        // Payment mode breakdown
        const rokhSales = invoices.filter(i => i.paymentMode === 'rokh').reduce((s, i) => s + i.netAmount, 0);
        const upiSales = invoices.filter(i => i.paymentMode === 'upi').reduce((s, i) => s + i.netAmount, 0);
        const udhariSales = invoices.filter(i => i.paymentMode === 'udhari').reduce((s, i) => s + i.netAmount, 0);
        const partialSales = invoices.filter(i => i.paymentMode === 'partial').reduce((s, i) => s + i.netAmount, 0);
        // Collections today
        const collections = yield erpPayment_model_1.default.findAll({
            where: { createdAt: { [sequelize_1.Op.gte]: startOfDay, [sequelize_1.Op.lt]: endOfDay } }
        });
        const totalCollections = collections.reduce((sum, p) => sum + p.amount, 0);
        res.status(200).json({
            date: startOfDay.toISOString().split('T')[0],
            invoiceCount,
            totalSales,
            totalCollected,
            totalUdhari,
            totalCollections,
            breakdown: { rokh: rokhSales, upi: upiSales, udhari: udhariSales, partial: partialSales },
            invoices
        });
    }
    catch (error) {
        console.error('Daily Sales Error:', error);
        res.status(500).json({ message: 'Error fetching daily sales', error: error.message });
    }
});
exports.getDailySales = getDailySales;
// ─── Weekly Sales Report ──────────────────────────────────────────────────────
const getWeeklySales = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date } = req.query;
        const d = date ? new Date(date) : new Date();
        // Find start of week (Monday)
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(d.getFullYear(), d.getMonth(), diff);
        const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
        const invoices = yield invoice_model_1.default.findAll({
            where: { createdAt: { [sequelize_1.Op.gte]: startOfWeek, [sequelize_1.Op.lt]: endOfWeek } },
            order: [['createdAt', 'DESC']]
        });
        const totalSales = invoices.reduce((sum, inv) => sum + inv.netAmount, 0);
        const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
        const totalUdhari = totalSales - totalCollected;
        const dayWise = {};
        invoices.forEach(inv => {
            const dt = new Date(inv.createdAt);
            const yyyy = dt.getFullYear();
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const dd = String(dt.getDate()).padStart(2, '0');
            const dayStr = `${yyyy}-${mm}-${dd}`;
            if (!dayWise[dayStr])
                dayWise[dayStr] = { sales: 0, count: 0 };
            dayWise[dayStr].sales += inv.netAmount;
            dayWise[dayStr].count += 1;
        });
        const collections = yield erpPayment_model_1.default.findAll({
            where: { createdAt: { [sequelize_1.Op.gte]: startOfWeek, [sequelize_1.Op.lt]: endOfWeek } }
        });
        const totalCollections = collections.reduce((sum, p) => sum + p.amount, 0);
        res.status(200).json({
            startDate: startOfWeek.toISOString().split('T')[0],
            endDate: new Date(endOfWeek.getTime() - 1).toISOString().split('T')[0],
            invoiceCount: invoices.length,
            totalSales,
            totalCollected,
            totalUdhari,
            totalCollections,
            dayWise
        });
    }
    catch (error) {
        console.error('Weekly Sales Error:', error);
        res.status(500).json({ message: 'Error fetching weekly sales', error: error.message });
    }
});
exports.getWeeklySales = getWeeklySales;
// ─── Monthly Sales Report ─────────────────────────────────────────────────────
const getMonthlySales = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { month, year } = req.query;
        const m = month ? Number(month) - 1 : new Date().getMonth();
        const y = year ? Number(year) : new Date().getFullYear();
        const startOfMonth = new Date(y, m, 1);
        const endOfMonth = new Date(y, m + 1, 1);
        const invoices = yield invoice_model_1.default.findAll({
            where: { createdAt: { [sequelize_1.Op.gte]: startOfMonth, [sequelize_1.Op.lt]: endOfMonth } },
            order: [['createdAt', 'DESC']]
        });
        const totalSales = invoices.reduce((sum, inv) => sum + inv.netAmount, 0);
        const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
        const totalUdhari = totalSales - totalCollected;
        // Day-wise breakdown
        const dayWise = {};
        invoices.forEach(inv => {
            const dt = new Date(inv.createdAt);
            const yyyy = dt.getFullYear();
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const dd = String(dt.getDate()).padStart(2, '0');
            const dayStr = `${yyyy}-${mm}-${dd}`;
            if (!dayWise[dayStr])
                dayWise[dayStr] = { sales: 0, count: 0 };
            dayWise[dayStr].sales += inv.netAmount;
            dayWise[dayStr].count += 1;
        });
        // Collections this month
        const collections = yield erpPayment_model_1.default.findAll({
            where: { createdAt: { [sequelize_1.Op.gte]: startOfMonth, [sequelize_1.Op.lt]: endOfMonth } }
        });
        const totalCollections = collections.reduce((sum, p) => sum + p.amount, 0);
        res.status(200).json({
            month: m + 1,
            year: y,
            invoiceCount: invoices.length,
            totalSales,
            totalCollected,
            totalUdhari,
            totalCollections,
            dayWise
        });
    }
    catch (error) {
        console.error('Monthly Sales Error:', error);
        res.status(500).json({ message: 'Error fetching monthly sales', error: error.message });
    }
});
exports.getMonthlySales = getMonthlySales;
// ─── Product-wise Sales ───────────────────────────────────────────────────────
const getProductWiseSales = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const results = yield invoiceItem_model_1.default.findAll({
            attributes: [
                'productId',
                'productName',
                [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('quantity')), 'totalQty'],
                [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('amount')), 'totalRevenue'],
                [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('invoiceId')), 'invoiceCount']
            ],
            group: ['productId', 'productName'],
            order: [[(0, sequelize_1.literal)('"totalRevenue"'), 'DESC']],
            limit: 50
        });
        res.status(200).json(results);
    }
    catch (error) {
        console.error('Product Sales Error:', error);
        res.status(500).json({ message: 'Error fetching product sales', error: error.message });
    }
});
exports.getProductWiseSales = getProductWiseSales;
// ─── Customer-wise Sales ──────────────────────────────────────────────────────
const getCustomerWiseSales = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const results = yield invoice_model_1.default.findAll({
            attributes: [
                'customerId',
                [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('Invoice.id')), 'invoiceCount'],
                [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('netAmount')), 'totalPurchases'],
                [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('paidAmount')), 'totalPaid']
            ],
            include: [{ model: customer_model_1.default, as: 'customer', attributes: ['name', 'phoneNumber', 'outstandingAmount'] }],
            group: ['customerId', 'customer.id', 'customer.name', 'customer.phoneNumber', 'customer.outstandingAmount'],
            order: [[(0, sequelize_1.literal)('"totalPurchases"'), 'DESC']],
            limit: 50
        });
        res.status(200).json(results);
    }
    catch (error) {
        console.error('Customer Sales Error:', error);
        res.status(500).json({ message: 'Error fetching customer sales', error: error.message });
    }
});
exports.getCustomerWiseSales = getCustomerWiseSales;
// ─── Pending Udhari Report ────────────────────────────────────────────────────
const getPendingUdhari = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customers = yield customer_model_1.default.findAll({
            where: { outstandingAmount: { [sequelize_1.Op.gt]: 0 } },
            order: [['outstandingAmount', 'DESC']],
            attributes: ['id', 'name', 'phoneNumber', 'outstandingAmount']
        });
        const totalPending = customers.reduce((sum, c) => sum + c.outstandingAmount, 0);
        res.status(200).json({ totalPending, customerCount: customers.length, customers });
    }
    catch (error) {
        console.error('Pending Udhari Error:', error);
        res.status(500).json({ message: 'Error fetching pending udhari', error: error.message });
    }
});
exports.getPendingUdhari = getPendingUdhari;
// ─── Stock Valuation Report ───────────────────────────────────────────────────
const getStockValuation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield product_model_1.default.findAll({
            where: { stock: { [sequelize_1.Op.gt]: 0 } },
            attributes: ['id', 'name', 'category', 'stock', 'price', 'purchasePrice', 'unit'],
            order: [['category', 'ASC'], ['name', 'ASC']]
        });
        let totalRetailValue = 0;
        let totalCostValue = 0;
        const items = products.map(p => {
            const retailVal = p.stock * p.price;
            const costVal = p.stock * (p.purchasePrice || p.price);
            totalRetailValue += retailVal;
            totalCostValue += costVal;
            return Object.assign(Object.assign({}, p.toJSON()), { retailValue: retailVal, costValue: costVal });
        });
        res.status(200).json({ totalRetailValue, totalCostValue, items });
    }
    catch (error) {
        console.error('Stock Valuation Error:', error);
        res.status(500).json({ message: 'Error fetching stock valuation', error: error.message });
    }
});
exports.getStockValuation = getStockValuation;
// ─── ERP Dashboard Stats ─────────────────────────────────────────────────────
const getErpDashboardStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        // Today's sales
        const todayInvoices = yield invoice_model_1.default.findAll({
            where: { createdAt: { [sequelize_1.Op.gte]: startOfDay, [sequelize_1.Op.lt]: endOfDay } }
        });
        const todaySales = todayInvoices.reduce((s, i) => s + i.netAmount, 0);
        const todayCollection = todayInvoices.reduce((s, i) => s + i.paidAmount, 0);
        // Monthly sales
        const monthInvoices = yield invoice_model_1.default.findAll({
            where: { createdAt: { [sequelize_1.Op.gte]: startOfMonth, [sequelize_1.Op.lt]: endOfDay } }
        });
        const monthlySales = monthInvoices.reduce((s, i) => s + i.netAmount, 0);
        // Total outstanding
        const totalOutstanding = (yield customer_model_1.default.sum('outstandingAmount')) || 0;
        // Low stock count
        const lowStockCount = yield product_model_1.default.count({
            where: database_1.default.literal('"stock" <= "lowStockThreshold"')
        });
        // Today's collections (separate payments)
        const todayPayments = yield erpPayment_model_1.default.findAll({
            where: { createdAt: { [sequelize_1.Op.gte]: startOfDay, [sequelize_1.Op.lt]: endOfDay } }
        });
        const todayCollections = todayPayments.reduce((s, p) => s + p.amount, 0);
        // Top selling products (this month)
        const topProducts = yield invoiceItem_model_1.default.findAll({
            attributes: [
                'productName',
                [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('quantity')), 'totalQty'],
                [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('amount')), 'totalRevenue']
            ],
            include: [{
                    model: invoice_model_1.default,
                    attributes: [],
                    where: { createdAt: { [sequelize_1.Op.gte]: startOfMonth } }
                }],
            group: ['productName'],
            order: [[(0, sequelize_1.literal)('"totalRevenue"'), 'DESC']],
            limit: 5
        });
        res.status(200).json({
            todaySales,
            todayCollection,
            todayCollections,
            todayInvoiceCount: todayInvoices.length,
            monthlySales,
            monthlyInvoiceCount: monthInvoices.length,
            totalOutstanding,
            lowStockCount,
            topProducts
        });
    }
    catch (error) {
        console.error('ERP Dashboard Error:', error);
        res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
    }
});
exports.getErpDashboardStats = getErpDashboardStats;
