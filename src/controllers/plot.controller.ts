import { Request, Response } from 'express';
import Plot from '../models/plot.model';
import User from '../models/user.model';
import { AuthRequest } from '../middleware/auth.middleware';

// Create a new plot
export const createPlot = async (req: AuthRequest, res: Response) => { // Use AuthRequest type
    try {
        const {
            name, season, crop, variety, sowingDate, soilType,
            area, length, width, numberOfPlants,
            village, taluka, district
        } = req.body;

        const userId = req.user.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const newPlot = await Plot.create({
            userId,
            name,
            season,
            crop,
            variety,
            sowingDate,
            soilType,
            area,
            length,
            width,
            numberOfPlants,
            village,
            taluka,
            district
        });

        res.status(201).json(newPlot);
    } catch (error) {
        console.error('Create Plot Error:', error);
        res.status(500).json({ message: 'Error creating plot', error: (error as any).message });
    }
};

// Get all plots for the logged-in user (Active only)
export const getUserPlots = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        // console.log(`Fetching active plots for user: ${userId}`);
        const plots = await Plot.findAll({
            where: {
                userId,
                status: 'active'
            },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(plots);
    } catch (error) {
        console.error('Get Plots Error:', error);
        res.status(500).json({ message: 'Error fetching plots', error: (error as any).message });
    }
}

// Get completed plot history
export const getPlotHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const plots = await Plot.findAll({
            where: {
                userId,
                status: 'completed'
            },
            order: [['updatedAt', 'DESC']]
        });
        res.status(200).json(plots);
    } catch (error) {
        console.error('Get History Error:', error);
        res.status(500).json({ message: 'Error fetching history', error: (error as any).message });
    }
}

// Mark plot as completed
export const completePlot = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const plot = await Plot.findOne({ where: { id, userId } });

        if (!plot) {
            return res.status(404).json({ message: 'Plot not found' });
        }

        plot.status = 'completed';
        await plot.save();

        res.status(200).json({ message: 'Plot marked as completed', plot });
    } catch (error) {
        console.error('Complete Plot Error:', error);
        res.status(500).json({ message: 'Error updating plot status', error: (error as any).message });
    }
}

// Get single plot by ID (for Admin/User)
export const getPlotById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const plot = await Plot.findByPk(id, {
            include: [{ model: User, as: 'user', attributes: ['fullName', 'phoneNumber', 'id'] }]
        });
        if (!plot) {
            return res.status(404).json({ message: 'Plot not found' });
        }
        res.status(200).json(plot);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching plot', error: (error as any).message });
    }
};
