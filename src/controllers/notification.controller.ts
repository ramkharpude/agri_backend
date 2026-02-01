import { Request, Response } from 'express';
import Notification from '../models/notification.model';
import User from '../models/user.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendPushNotification, sendBatchPushNotifications } from '../services/notification.service';

// Get user notifications (for app user)
export const getUserNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const notifications = await Notification.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({ message: 'Error fetching notifications', error: (error as any).message });
    }
};

// Get notifications for a specific user (Admin)
export const getNotificationsForUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const notifications = await Notification.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Get User Notifications Error:', error);
        res.status(500).json({ message: 'Error fetching user notifications', error: (error as any).message });
    }
};

// Mark as read
export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Notification.update({ isRead: true }, { where: { id } });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notification', error: (error as any).message });
    }
};

// Internal helper to create notification
export const createNotification = async (userId: number, title: string, message: string, type: string, relatedId?: string) => {
    try {
        await Notification.create({
            userId,
            title,
            message,
            type,
            relatedId,
            isRead: false
        });

        // Also try to send push if this is called internally (except for admin send which handles it separately)
        // For now, keeping explicit calls in controllers to avoid circular dependencies or double sends
    } catch (error) {
        console.error('Create Notification Error:', error);
    }
};
// Send notification manually (Admin)
export const sendNotification = async (req: Request, res: Response) => {
    try {
        const { userId, title, message } = req.body;
        // console.log(`Sending notification to user ${userId}: ${title}`);

        await Notification.create({
            userId,
            title,
            message,
            type: 'admin_message',
            isRead: false
        });

        // Send Push Notification
        const user = await User.findByPk(userId);
        if (user && user.pushToken) {
            await sendPushNotification(
                user.pushToken,
                title,
                message
            );
        }

        res.status(200).json({ success: true, message: 'Notification sent successfully' });
    } catch (error) {
        console.error('Send Notification Error:', error);
        res.status(500).json({ message: 'Error sending notification', error: (error as any).message });
    }
};

import BroadcastLog from '../models/broadcastLog.model';

// Broadcast to ALL users
export const broadcastNotification = async (req: Request, res: Response) => {
    try {
        const { title, message } = req.body;

        // 1. Fetch all users
        const users = await User.findAll({ attributes: ['id', 'pushToken'] });

        if (!users.length) {
            return res.status(400).json({ message: 'No users found to broadcast to.' });
        }

        // 2. Prepare notifications
        const notifications = users.map(user => ({
            userId: user.id,
            title,
            message,
            type: 'admin_broadcast',
            isRead: false
        }));

        // 3. Bulk Create (Efficient)
        await Notification.bulkCreate(notifications);

        // 4. Send Batch Push Notifications
        const userTokens = users
            .map(u => u.pushToken)
            .filter(token => token !== null && token !== undefined && token !== '');

        if (userTokens.length > 0) {
            await sendBatchPushNotifications(
                userTokens as string[],
                title,
                message
            );
        }

        // 5. Log to History
        await BroadcastLog.create({
            title,
            message,
            sentCount: users.length
        });

        res.status(200).json({ success: true, message: `Broadcast sent to ${users.length} users.` });

    } catch (error) {
        console.error("Broadcast Error:", error);
        res.status(500).json({ message: 'Broadcast failed', error: (error as any).message });
    }
};

// Get Broadcast History
export const getBroadcastHistory = async (req: Request, res: Response) => {
    try {
        const history = await BroadcastLog.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(history);
    } catch (error) {
        console.error("Broadcast History Error:", error);
        res.status(500).json({ message: 'Failed to fetch history', error: (error as any).message });
    }
};
