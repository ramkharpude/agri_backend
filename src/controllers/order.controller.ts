import { Request, Response } from 'express';
import Order from '../models/order.model';

// Create New Order
export const createOrder = async (req: Request, res: Response) => {
    try {
        const { userId, items, shippingAddress, totalAmount, paymentMethod } = req.body;

        const order = await Order.create({
            userId,
            items,
            shippingAddress,
            totalAmount,
            paymentMethod: paymentMethod || 'UPI',
            paymentStatus: 'paid', // Simulating successful payment
            status: 'pending'
        });

        res.status(201).json(order);
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ message: 'Error creating order', error });
    }
};

// Get User Orders
export const getUserOrders = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const orders = await Order.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: 'Error fetching orders', error });
    }
};

// Get Order By ID
export const getOrderById = async (req: Request, res: Response) => {
    try {
        const order = await Order.findByPk(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order', error });
    }
};
// [ADMIN] Get All Orders
export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const orders = await Order.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching all orders:", error);
        res.status(500).json({ message: 'Error fetching orders', error });
    }
};

// [ADMIN] Update Order Status
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Lock if already delivered
        if (order.status === 'delivered') {
            return res.status(400).json({ message: 'Order is already delivered and cannot be changed.' });
        }

        order.status = status;
        await order.save();

        res.status(200).json(order);
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ message: 'Error updating status', error });
    }
};

// [ADMIN] Get Shop Analytics
export const getShopAnalytics = async (req: Request, res: Response) => {
    try {
        // 1. Total Revenue (Sum of delivered orders)
        // Note: In SQLite sum returns result directly
        const revenueResult = await Order.sum('totalAmount', {
            where: { status: 'delivered' }
        });
        const totalRevenue = revenueResult || 0;

        // 2. Orders Counts
        const totalOrders = await Order.count();
        const pendingOrders = await Order.count({ where: { status: 'pending' } });
        const deliveredOrders = await Order.count({ where: { status: 'delivered' } });

        // 3. Low Stock Products
        // We need to import Product model dynamically or at top if not circular
        const Product = require('../models/product.model').default;
        const lowStockCount = await Product.count({
            where: { stock: { [require('sequelize').Op.lt]: 10 } }
        });

        // 4. Recent Transactions (Last 5)
        const recentOrders = await Order.findAll({
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

    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ message: 'Error fetching analytics', error: (error as any).message });
    }
};
