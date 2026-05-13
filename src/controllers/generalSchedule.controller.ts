import { Request, Response } from 'express';
import GeneralSchedule from '../models/generalSchedule.model';
import GeneralScheduleItem from '../models/generalScheduleItem.model';
import sequelize from '../config/database';

// 1. Create a General Schedule with items
export const createGeneralSchedule = async (req: Request, res: Response): Promise<void> => {
    const t = await sequelize.transaction();
    try {
        const { cropName, variety, items } = req.body;

        if (!cropName || !variety || !items || !Array.isArray(items)) {
            res.status(400).json({ success: false, message: 'cropName, variety, and an array of items are required.' });
            return;
        }

        const newGeneralSchedule = await GeneralSchedule.create({
            cropName,
            variety
        }, { transaction: t });

        const itemsWithScheduleId = items.map((item: any) => ({
            ...item,
            generalScheduleId: newGeneralSchedule.id,
            stageImages: item.stageImages || [],
            productImages: item.productImages || []
        }));

        await GeneralScheduleItem.bulkCreate(itemsWithScheduleId, { transaction: t });

        await t.commit();

        const createdSchedule = await GeneralSchedule.findByPk(newGeneralSchedule.id, {
            include: [{ model: GeneralScheduleItem, as: 'items' }]
        });

        res.status(201).json({ success: true, generalSchedule: createdSchedule, message: 'General Schedule created successfully.' });
    } catch (error) {
        await t.rollback();
        console.error('Error creating general schedule:', error);
        res.status(500).json({ success: false, message: 'Error creating general schedule', error });
    }
};

// 2. Get all General Schedules
export const getAllGeneralSchedules = async (req: Request, res: Response): Promise<void> => {
    try {
        const schedules = await GeneralSchedule.findAll({
            include: [{ model: GeneralScheduleItem, as: 'items' }],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, generalSchedules: schedules });
    } catch (error) {
        console.error('Error fetching general schedules:', error);
        res.status(500).json({ success: false, message: 'Error fetching general schedules', error });
    }
};

// 3. Get General Schedule by ID
export const getGeneralScheduleById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const schedule = await GeneralSchedule.findByPk(id, {
            include: [{ model: GeneralScheduleItem, as: 'items' }]
        });

        if (!schedule) {
            res.status(404).json({ success: false, message: 'General Schedule not found' });
            return;
        }
        res.json({ success: true, generalSchedule: schedule });
    } catch (error) {
        console.error('Error fetching general schedule:', error);
        res.status(500).json({ success: false, message: 'Error fetching general schedule', error });
    }
};

// 4. Update General Schedule
export const updateGeneralSchedule = async (req: Request, res: Response): Promise<void> => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { cropName, variety, items } = req.body;

        const schedule = await GeneralSchedule.findByPk(id, { transaction: t });
        if (!schedule) {
            await t.rollback();
            res.status(404).json({ success: false, message: 'General Schedule not found' });
            return;
        }

        if (cropName) schedule.cropName = cropName;
        if (variety) schedule.variety = variety;
        await schedule.save({ transaction: t });

        if (items && Array.isArray(items)) {
            // Option: delete all old items and insert all new items.
            await GeneralScheduleItem.destroy({ where: { generalScheduleId: id }, transaction: t });

            const itemsWithScheduleId = items.map((item: any) => ({
                ...item,
                generalScheduleId: id,
                stageImages: item.stageImages || [],
                productImages: item.productImages || []
            }));

            await GeneralScheduleItem.bulkCreate(itemsWithScheduleId, { transaction: t });
        }

        await t.commit();

        const updatedSchedule = await GeneralSchedule.findByPk(id, {
            include: [{ model: GeneralScheduleItem, as: 'items' }]
        });

        res.json({ success: true, generalSchedule: updatedSchedule, message: 'General Schedule updated successfully.' });
    } catch (error) {
        await t.rollback();
        console.error('Error updating general schedule:', error);
        res.status(500).json({ success: false, message: 'Error updating general schedule', error });
    }
};

// 5. Delete General Schedule
export const deleteGeneralSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const schedule = await GeneralSchedule.findByPk(id);

        if (!schedule) {
            res.status(404).json({ success: false, message: 'General Schedule not found' });
            return;
        }

        // Deleting the schedule will also cascade-delete the items
        await schedule.destroy();
        res.json({ success: true, message: 'General Schedule deleted successfully.' });
    } catch (error) {
        console.error('Error deleting general schedule:', error);
        res.status(500).json({ success: false, message: 'Error deleting general schedule', error });
    }
};
