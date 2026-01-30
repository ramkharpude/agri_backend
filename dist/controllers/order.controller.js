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
exports.getShopAnalytics = exports.updateOrderStatus = exports.getAllOrders = exports.getOrderById = exports.getUserOrders = exports.createOrder = void 0;
const order_model_1 = __importDefault(require("../models/order.model"));
// Create New Order
const createOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, items, shippingAddress, totalAmount, paymentMethod } = req.body;
        const order = yield order_model_1.default.create({
            userId,
            items,
            shippingAddress,
            totalAmount,
            paymentMethod: paymentMethod || 'UPI',
            paymentStatus: 'paid', // Simulating successful payment
            status: 'pending'
        });
        res.status(201).json(order);
    }
    catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ message: 'Error creating order', error });
    }
});
exports.createOrder = createOrder;
// Get User Orders
const getUserOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const orders = yield order_model_1.default.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(orders);
    }
    catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: 'Error fetching orders', error });
    }
});
exports.getUserOrders = getUserOrders;
// Get Order By ID
const getOrderById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const order = yield order_model_1.default.findByPk(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json(order);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching order', error });
    }
});
exports.getOrderById = getOrderById;
// [ADMIN] Get All Orders
const getAllOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orders = yield order_model_1.default.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(orders);
    }
    catch (error) {
        console.error("Error fetching all orders:", error);
        res.status(500).json({ message: 'Error fetching orders', error });
    }
});
exports.getAllOrders = getAllOrders;
// [ADMIN] Update Order Status
const updateOrderStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const order = yield order_model_1.default.findByPk(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        // Lock if already delivered
        if (order.status === 'delivered') {
            return res.status(400).json({ message: 'Order is already delivered and cannot be changed.' });
        }
        order.status = status;
        yield order.save();
        res.status(200).json(order);
    }
    catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ message: 'Error updating status', error });
    }
});
exports.updateOrderStatus = updateOrderStatus;
// [ADMIN] Get Shop Analytics
const getShopAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1. Total Revenue (Sum of delivered orders)
        // Note: In SQLite sum returns result directly
        const revenueResult = yield order_model_1.default.sum('totalAmount', {
            where: { status: 'delivered' }
        });
        const totalRevenue = revenueResult || 0;
        // 2. Orders Counts
        const totalOrders = yield order_model_1.default.count();
        const pendingOrders = yield order_model_1.default.count({ where: { status: 'pending' } });
        const deliveredOrders = yield order_model_1.default.count({ where: { status: 'delivered' } });
        // 3. Low Stock Products
        // We need to import Product model dynamically or at top if not circular
        const Product = require('../models/product.model').default;
        const lowStockCount = yield Product.count({
            where: { stock: { [require('sequelize').Op.lt]: 10 } }
        });
        // 4. Recent Transactions (Last 5)
        const recentOrders = yield order_model_1.default.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [{ model: require('../models/user.model').default, attributes: ['fullName'] }]
        });
        res.status(200).json({
            revenue: totalRevenue,
            totalOrders,
            pendingOrders,
            deliveredOrders,
            lowStockCount,
            recentOrders
        });
    }
    catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ message: 'Error fetching analytics', error: error.message });
    }
});
exports.getShopAnalytics = getShopAnalytics;
