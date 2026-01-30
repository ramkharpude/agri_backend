import { Request, Response } from 'express';
import Schedule from '../models/schedule.model';

// Get schedules for a specific plot
export const getPlotSchedules = async (req: Request, res: Response) => {
    try {
        const { plotId } = req.params;
        // console.log(`[SCHEDULE] Fetching schedules for plotId: ${plotId}`);
        const schedules = await Schedule.findAll({
            where: { plotId },
            order: [['dayNumber', 'ASC']]
        });
        res.status(200).json(schedules);
    } catch (error) {
        console.error('Get Schedules Error:', error);
        res.status(500).json({ message: 'Error fetching schedules', error: (error as any).message });
    }
};

// Create a schedule (Internal/Admin use)
export const createSchedule = async (req: Request, res: Response) => {
    try {
        const { plotId, title, description, dayNumber } = req.body;
        const newSchedule = await Schedule.create({
            plotId,
            title,
            description,
            dayNumber
        });
        res.status(201).json(newSchedule);
    } catch (error) {
        res.status(500).json({ message: 'Error creating schedule', error: (error as any).message });
    }
};

// Update a schedule (Admin use)
export const updateSchedule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, dayNumber } = req.body;
        const schedule = await Schedule.findByPk(id);
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        await schedule.update({ title, description, dayNumber });
        res.status(200).json(schedule);
    } catch (error) {
        res.status(500).json({ message: 'Error updating schedule', error: (error as any).message });
    }
};

// Delete a schedule (Admin use)
export const deleteSchedule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const schedule = await Schedule.findByPk(id);
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        await schedule.destroy();
        res.status(200).json({ message: 'Schedule deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting schedule', error: (error as any).message });
    }
};
// Update schedule status (User use)
export const updateScheduleStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['upcoming', 'completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const schedule = await Schedule.findByPk(id);
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        // Removed validation to allow status toggle
        // if (schedule.status === 'completed') {
        //    return res.status(400).json({ message: 'Cannot change status of a completed schedule' });
        // }

        schedule.status = status;
        await schedule.save();

        res.status(200).json(schedule);
    } catch (error) {
        res.status(500).json({ message: 'Error updating status', error: (error as any).message });
    }
};
