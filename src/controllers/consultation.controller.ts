import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Consultation from '../models/consultation.model';

// @desc    Book a consultation
// @route   POST /api/consultations
// @access  Private (Farmer)
export const bookConsultation = async (req: AuthRequest, res: Response) => {
    try {
        const { consultantId, scheduledAt, type, notes } = req.body;

        const consultation = await Consultation.create({
            farmerId: req.user.id,
            consultantId: consultantId || 0, // 0 or null if unassigned
            scheduledAt,
            type,
            notes
        });

        res.status(201).json(consultation);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// @desc    Get user consultations
// @route   GET /api/consultations
// @access  Private
export const getConsultations = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let whereClause = {};
        if (role === 'consultant') {
            whereClause = { consultantId: userId };
        } else {
            whereClause = { farmerId: userId };
        }

        const consultations = await Consultation.findAll({ where: whereClause });

        res.json(consultations);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};
