import { Request, Response } from 'express';
import PlotAssignment from '../models/plotAssignment.model';
import Plot from '../models/plot.model';
import User from '../models/user.model';
import { AuthRequest } from '../middleware/auth.middleware';

// Admin: Assign a plot to a consultant
export const assignPlotToConsultant = async (req: Request, res: Response) => {
    try {
        const { plotId, consultantId } = req.body;

        // Verify consultant exists and has correct role
        const consultant = await User.findByPk(consultantId);
        if (!consultant || consultant.role !== 'consultant') {
            return res.status(400).json({ message: 'Invalid consultant' });
        }

        // Check if already assigned
        const existing = await PlotAssignment.findOne({ where: { plotId, consultantId } });
        if (existing) {
            return res.status(400).json({ message: 'Plot already assigned to this consultant' });
        }

        const assignment = await PlotAssignment.create({ plotId, consultantId });
        res.status(201).json(assignment);
    } catch (error) {
        console.error('Assign Plot Error:', error);
        res.status(500).json({ message: 'Error assigning plot', error: (error as any).message });
    }
};

// Admin: Remove assignment
export const unassignPlot = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const assignment = await PlotAssignment.findByPk(id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        await assignment.destroy();
        res.status(200).json({ message: 'Assignment removed' });
    } catch (error) {
        console.error('Unassign Plot Error:', error);
        res.status(500).json({ message: 'Error removing assignment', error: (error as any).message });
    }
};

// Consultant: Get my assigned plots
export const getMyAssignedPlots = async (req: AuthRequest, res: Response) => {
    try {
        const consultantId = req.user.id;
        const assignments = await PlotAssignment.findAll({
            where: { consultantId },
            include: [{
                model: Plot,
                as: 'plot',
                include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'phoneNumber', 'address'] }]
            }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(assignments);
    } catch (error) {
        console.error('Get My Assigned Plots Error:', error);
        res.status(500).json({ message: 'Error fetching assigned plots', error: (error as any).message });
    }
};

// Admin: Get consultants for a specific plot
export const getPlotConsultants = async (req: Request, res: Response) => {
    try {
        const { plotId } = req.params;
        const assignments = await PlotAssignment.findAll({
            where: { plotId },
            include: [{ model: User, as: 'consultant', attributes: ['id', 'fullName', 'phoneNumber', 'specialtyCrops', 'profilePhoto'] }]
        });
        res.status(200).json(assignments);
    } catch (error) {
        console.error('Get Plot Consultants Error:', error);
        res.status(500).json({ message: 'Error fetching consultants', error: (error as any).message });
    }
};

// Admin: Get all approved consultants (for assignment dropdown)
export const getApprovedConsultants = async (req: Request, res: Response) => {
    try {
        const consultants = await User.findAll({
            where: { role: 'consultant', isApproved: true },
            attributes: ['id', 'fullName', 'phoneNumber', 'specialtyCrops', 'profilePhoto']
        });
        res.status(200).json(consultants);
    } catch (error) {
        console.error('Get Approved Consultants Error:', error);
        res.status(500).json({ message: 'Error fetching consultants', error: (error as any).message });
    }
};
