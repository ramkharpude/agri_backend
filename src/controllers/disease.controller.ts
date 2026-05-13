import { Request, Response } from 'express';
import Disease from '../models/disease.model';
import User from '../models/user.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendPushNotification } from '../services/notification.service';
import { createNotification } from './notification.controller';

// Report a new disease
export const reportDisease = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, plotId } = req.body;
        const userId = req.user.id;

        let imageUrls: string[] = [];

        if (req.files && Array.isArray(req.files)) {
            // Multer-storage-cloudinary puts the URL in file.path
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
        const report = await Disease.findByPk(id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        res.status(200).json(report);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching details', error: (error as any).message });
    }
};

// Diagnose a disease (Admin only)
export const diagnoseDisease = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { solution, suggestedProducts } = req.body;
        const consultantName = req.user.fullName; // Assuming admin's name is used

        const report = await Disease.findByPk(id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
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
