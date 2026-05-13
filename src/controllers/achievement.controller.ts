import { Request, Response } from 'express';
import Achievement from '../models/achievement.model';
import AchievementComment from '../models/achievementComment.model';
import User from '../models/user.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendBatchPushNotifications } from '../services/notification.service';
import Notification from '../models/notification.model';

// ─── Admin: Create Achievement ───────────────────────────────────────────────
export const createAchievement = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description } = req.body;

        let photoUrls: string[] = [];
        if (req.files && Array.isArray(req.files)) {
            photoUrls = (req.files as Express.Multer.File[]).map(f => f.path);
        }

        const achievement = await Achievement.create({ title, description, photos: photoUrls, likedBy: [] });

        // Broadcast push notification + in-app notification to all users
        const users = await User.findAll({ attributes: ['id', 'pushToken'] });
        const tokens = users.map(u => u.pushToken).filter(t => !!t) as string[];

        if (tokens.length > 0) {
            await sendBatchPushNotifications(tokens, '🏆 New Achievement Posted!', title);
        }

        const notifData = users.map(u => ({
            userId: u.id,
            title: '🏆 New Achievement Posted!',
            message: title,
            type: 'achievement',
            relatedId: achievement.id.toString(),
            isRead: false
        }));
        await Notification.bulkCreate(notifData);

        res.status(201).json(achievement);
    } catch (error) {
        console.error('Create Achievement Error:', error);
        res.status(500).json({ message: 'Error creating achievement', error: (error as any).message });
    }
};

// ─── Get All Achievements ────────────────────────────────────────────────────
export const getAllAchievements = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const achievements = await Achievement.findAll({
            include: [{ model: AchievementComment, as: 'comments', attributes: ['id'] }],
            order: [['createdAt', 'DESC']]
        });

        const result = achievements.map((a: any) => ({
            ...a.toJSON(),
            likeCount: (a.likedBy || []).length,
            commentCount: (a.comments || []).length,
            isLiked: userId ? (a.likedBy || []).includes(userId) : false
        }));

        res.status(200).json(result);
    } catch (error) {
        console.error('Get Achievements Error:', error);
        res.status(500).json({ message: 'Error fetching achievements', error: (error as any).message });
    }
};

// ─── Get Single Achievement with Comments ────────────────────────────────────
export const getAchievementById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const achievement = await Achievement.findByPk(id, {
            include: [{ model: AchievementComment, as: 'comments', order: [['createdAt', 'DESC']] }]
        });

        if (!achievement) return res.status(404).json({ message: 'Achievement not found' });

        const data = (achievement as any).toJSON();

        // Resolve likedBy user IDs to user objects for the admin detail view
        let likedByUsers: any[] = [];
        if (data.likedBy && data.likedBy.length > 0) {
            const users = await User.findAll({
                where: { id: data.likedBy },
                attributes: ['id', 'fullName', 'phoneNumber']
            });
            likedByUsers = users.map((u: any) => u.toJSON());
        }

        res.status(200).json({
            ...data,
            likeCount: (data.likedBy || []).length,
            likedByUsers,
            isLiked: userId ? (data.likedBy || []).includes(userId) : false
        });
    } catch (error) {
        console.error('Get Achievement Error:', error);
        res.status(500).json({ message: 'Error fetching achievement', error: (error as any).message });
    }
};

// ─── Admin: Update Achievement ────────────────────────────────────────────────
export const updateAchievement = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, keepExistingPhotos } = req.body;

        const achievement = await Achievement.findByPk(id);
        if (!achievement) return res.status(404).json({ message: 'Achievement not found' });

        if (title) achievement.title = title;
        if (description) achievement.description = description;

        // If new photos uploaded, replace. If keepExistingPhotos flag, keep old.
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const newUrls = (req.files as Express.Multer.File[]).map(f => f.path);
            achievement.photos = newUrls;
        }

        await achievement.save();
        res.status(200).json(achievement);
    } catch (error) {
        console.error('Update Achievement Error:', error);
        res.status(500).json({ message: 'Error updating achievement', error: (error as any).message });
    }
};

// ─── Admin: Delete Achievement ────────────────────────────────────────────────
export const deleteAchievement = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const achievement = await Achievement.findByPk(id);
        if (!achievement) return res.status(404).json({ message: 'Achievement not found' });

        await AchievementComment.destroy({ where: { achievementId: id } });
        await achievement.destroy();

        res.status(200).json({ message: 'Achievement deleted successfully' });
    } catch (error) {
        console.error('Delete Achievement Error:', error);
        res.status(500).json({ message: 'Error deleting achievement', error: (error as any).message });
    }
};

// ─── User: Toggle Like ────────────────────────────────────────────────────────
export const toggleLike = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const achievement = await Achievement.findByPk(id);
        if (!achievement) return res.status(404).json({ message: 'Achievement not found' });

        const likedBy = [...(achievement.likedBy || [])];
        const alreadyLiked = likedBy.includes(userId);

        if (alreadyLiked) {
            achievement.likedBy = likedBy.filter(uid => uid !== userId);
        } else {
            achievement.likedBy = [...likedBy, userId];
        }

        await achievement.save();
        res.status(200).json({ likeCount: achievement.likedBy.length, isLiked: !alreadyLiked });
    } catch (error) {
        console.error('Toggle Like Error:', error);
        res.status(500).json({ message: 'Error updating like', error: (error as any).message });
    }
};

// ─── User: Add Comment ────────────────────────────────────────────────────────
export const addComment = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        const userId = req.user.id;

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const comment = await AchievementComment.create({
            achievementId: parseInt(id),
            userId,
            userName: user.fullName,
            text
        });

        res.status(201).json(comment);
    } catch (error) {
        console.error('Add Comment Error:', error);
        res.status(500).json({ message: 'Error adding comment', error: (error as any).message });
    }
};

// ─── Admin: Delete Comment ────────────────────────────────────────────────────
export const deleteComment = async (req: Request, res: Response) => {
    try {
        const { commentId } = req.params;
        await AchievementComment.destroy({ where: { id: commentId } });
        res.status(200).json({ message: 'Comment deleted' });
    } catch (error) {
        console.error('Delete Comment Error:', error);
        res.status(500).json({ message: 'Error deleting comment', error: (error as any).message });
    }
};
