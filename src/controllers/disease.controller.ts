import { Request, Response } from 'express';
import Disease from '../models/disease.model';
import User from '../models/user.model';
import Plot from '../models/plot.model';
import PlotAssignment from '../models/plotAssignment.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendPushNotification } from '../services/notification.service';
import { createNotification } from './notification.controller';
import { getAdminPushToken } from './auth.controller';

// Report a new disease
export const reportDisease = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, plotId } = req.body;
        const userId = req.user.id;

        let imageUrls: string[] = [];

        if (req.files && Array.isArray(req.files)) {
            imageUrls = (req.files as Express.Multer.File[]).map(file => file.path);
        }

        const newReport = await Disease.create({
            userId,
            plotId: plotId || null,
            title,
            description,
            images: imageUrls,
            status: 'pending'
        });

        // Notify admin via push notification
        try {
            const user = await User.findByPk(userId);
            const adminToken = getAdminPushToken();
            if (adminToken) {
                await sendPushNotification(
                    adminToken,
                    '🐛 New Disease Report',
                    `${user?.fullName || 'A farmer'} reported: "${title}"`
                );
            }
        } catch (notifError) {
            console.error('Admin notification for disease failed (non-critical):', notifError);
        }

        res.status(201).json(newReport);
    } catch (error) {
        console.error('Report Disease Error:', error);
        res.status(500).json({ message: 'Error reporting disease', error: (error as any).message });
    }
};

// Get user's disease history
export const getUserDiseases = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const reports = await Disease.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(reports);
    } catch (error) {
        console.error('Get Diseases Error:', error);
        res.status(500).json({ message: 'Error fetching history', error: (error as any).message });
    }
};

// Get specific disease details
export const getDiseaseDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const report = await Disease.findByPk(id, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'fullName', 'phoneNumber'] },
                { model: Plot, as: 'plot', attributes: ['id', 'name', 'crop', 'variety', 'village'] }
            ]
        });
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        res.status(200).json(report);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching details', error: (error as any).message });
    }
};

// Diagnose a disease (Admin or Consultant)
export const diagnoseDisease = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { solution, suggestedProducts } = req.body;
        
        // Build consultant name: "Name (RK Consaltancy)"
        const consultantName = req.user.role === 'consultant' 
            ? `${req.user.fullName} (RK Consaltancy)` 
            : req.user.fullName || 'RK Consaltancy';

        const report = await Disease.findByPk(id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // If consultant, verify they are assigned to this plot
        if (req.user.role === 'consultant' && report.plotId) {
            const assignment = await PlotAssignment.findOne({
                where: { consultantId: req.user.id, plotId: report.plotId }
            });
            if (!assignment) {
                return res.status(403).json({ message: 'You are not assigned to this plot' });
            }
        }

        report.solution = solution;
        report.consultantName = consultantName;
        report.status = 'resolved';
        report.suggestedProducts = suggestedProducts || null;
        await report.save();

        // Send Push Notification
        const user = await User.findByPk(report.userId);
        if (user && user.pushToken) {
            await sendPushNotification(
                user.pushToken,
                'Disease Diagnosis Update',
                `Your report "${report.title}" has been updated with a solution.`
            );
        }

        // Save to in-app notifications
        await createNotification(
            report.userId,
            'Disease Report Diagnosed',
            `Your report "${report.title}" has been resolved. Tap to view solution.`,
            'disease',
            report.id.toString()
        );

        res.status(200).json(report);
    } catch (error) {
        console.error('Diagnose Disease Error:', error);
        res.status(500).json({ message: 'Error updating diagnosis', error: (error as any).message });
    }
};

// Consultant: Get diseases for my assigned plots
export const getConsultantDiseases = async (req: AuthRequest, res: Response) => {
    try {
        const consultantId = req.user.id;

        // Get assigned plot IDs
        const assignments = await PlotAssignment.findAll({
            where: { consultantId },
            attributes: ['plotId']
        });
        const plotIds = assignments.map((a: any) => a.plotId);

        if (plotIds.length === 0) {
            return res.status(200).json([]);
        }

        const { Op } = require('sequelize');
        const diseases = await Disease.findAll({
            where: { plotId: { [Op.in]: plotIds } },
            include: [
                { model: User, as: 'user', attributes: ['id', 'fullName', 'phoneNumber'] },
                { model: Plot, as: 'plot', attributes: ['id', 'name', 'crop', 'variety', 'village'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(diseases);
    } catch (error) {
        console.error('Get Consultant Diseases Error:', error);
        res.status(500).json({ message: 'Error fetching diseases', error: (error as any).message });
    }
};

