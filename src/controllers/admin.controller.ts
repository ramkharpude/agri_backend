import { Request, Response } from 'express';
import User from '../models/user.model';
import Plot from '../models/plot.model';
import Disease from '../models/disease.model';
import Product from '../models/product.model';
import Order from '../models/order.model';
import { Op } from 'sequelize';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const usersCount = await User.count();
        const plotsCount = await Plot.count({ where: { status: 'active' } });
        const diseasesCount = await Disease.count();

        // Get recent 5 pending diseases
        const recentDiseases = await Disease.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            where: { status: 'pending' }
        });

        res.status(200).json({
            usersCount,
            plotsCount,
            diseasesCount,
            recentDiseases
        });
    } catch (error) {
        console.error('Admin Stats Error:', error);
        res.status(500).json({ message: 'Error fetching admin stats', error: (error as any).message });
    }
};

export const getShopStats = async (req: Request, res: Response) => {
    try {
        const productsCount = await Product.count();
        const ordersCount = await Order.count();

        // Count low stock (e.g., quantity < 50)
        // Adjust threshold as needed
        const lowStockCount = await Product.count({
            where: {
                stock: { [Op.lt]: 5 }
            }
        });

        // Calculate Revenue (Sum of totalAmount for non-cancelled orders)
        // Note: SQLite sum might return string
        const revenueResult = await Order.sum('totalAmount', {
            where: {
                status: { [Op.ne]: 'cancelled' }
            }
        });

        const totalRevenue = revenueResult || 0;

        res.status(200).json({
            productsCount,
            ordersCount,
            lowStockCount,
            revenue: totalRevenue
        });

    } catch (error) {
        console.error("Shop Stats Error:", error);
        res.status(500).json({ message: 'Error fetching shop stats', error: (error as any).message });
    }
};

export const getAllDiseases = async (req: Request, res: Response) => {
    try {
        const diseases = await Disease.findAll({
            order: [['createdAt', 'DESC']],
            include: [
                { model: User, as: 'user', attributes: ['fullName', 'phoneNumber'] },
                { model: Plot, as: 'plot', attributes: ['name', 'crop'] }
            ]
        });
        res.status(200).json(diseases);
    } catch (error) {
        console.error('Admin All Diseases Error:', error);
        res.status(500).json({ message: 'Error fetching diseases', error: (error as any).message });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(users);
    } catch (error) {
        console.error('Admin All Users Error:', error);
        res.status(500).json({ message: 'Error fetching users', error: (error as any).message });
    }
};

export const getAllPlots = async (req: Request, res: Response) => {
    try {
        const plots = await Plot.findAll({
            where: { status: 'active' },
            order: [['createdAt', 'DESC']],
            include: [
                { model: User, as: 'user', attributes: ['fullName', 'phoneNumber'] }
            ]
        });
        res.status(200).json(plots);
    } catch (error) {
        console.error('Admin All Plots Error:', error);
        res.status(500).json({ message: 'Error fetching plots', error: (error as any).message });
    }
};

export const getUserPlots = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const plots = await Plot.findAll({
            where: { userId, status: 'active' },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(plots);
    } catch (error) {
        console.error('Admin User Plots Error:', error);
        res.status(500).json({ message: 'Error fetching user plots', error: (error as any).message });
    }
};

export const getUserPlotHistory = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const plots = await Plot.findAll({
            where: { userId, status: 'completed' },
            order: [['updatedAt', 'DESC']]
        });
        res.status(200).json(plots);
    } catch (error) {
        console.error('Admin User History Error:', error);
        res.status(500).json({ message: 'Error fetching user history', error: (error as any).message });
    }
};
// Toggle Plot Status (Active/Completed)
export const togglePlotStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const plot = await Plot.findByPk(id);

        if (!plot) {
            return res.status(404).json({ message: 'Plot not found' });
        }

        const newStatus = plot.status === 'completed' ? 'active' : 'completed';
        plot.status = newStatus;
        await plot.save();

        res.status(200).json({ message: `Plot status updated to ${newStatus}`, plot });
    } catch (error) {
        console.error('Toggle Plot Status Error:', error);
        res.status(500).json({ message: 'Error updating plot status', error: (error as any).message });
    }
};
