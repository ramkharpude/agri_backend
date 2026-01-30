import express from 'express';
import { getUserNotifications, getNotificationsForUser, markAsRead, sendNotification, broadcastNotification, getBroadcastHistory } from '../controllers/notification.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', protect, getUserNotifications);
router.get('/user/:userId', getNotificationsForUser); // Admin route
router.put('/:id/read', protect, markAsRead);
router.post('/send', sendNotification); // Single user
router.post('/broadcast', broadcastNotification); // To ALL
router.get('/broadcast-history', getBroadcastHistory); // History

export default router;
