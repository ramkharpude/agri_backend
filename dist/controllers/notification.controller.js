"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBroadcastHistory = exports.broadcastNotification = exports.sendNotification = exports.createNotification = exports.markAsRead = exports.getNotificationsForUser = exports.getUserNotifications = void 0;
const notification_model_1 = __importDefault(require("../models/notification.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
// Get user notifications (for app user)
const getUserNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const notifications = yield notification_model_1.default.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
        res.status(200).json(notifications);
    }
    catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
});
exports.getUserNotifications = getUserNotifications;
// Get notifications for a specific user (Admin)
const getNotificationsForUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const notifications = yield notification_model_1.default.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(notifications);
    }
    catch (error) {
        console.error('Get User Notifications Error:', error);
        res.status(500).json({ message: 'Error fetching user notifications', error: error.message });
    }
});
exports.getNotificationsForUser = getNotificationsForUser;
// Mark as read
const markAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield notification_model_1.default.update({ isRead: true }, { where: { id } });
        res.status(200).json({ success: true });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating notification', error: error.message });
    }
});
exports.markAsRead = markAsRead;
// Internal helper to create notification
const createNotification = (userId, title, message, type, relatedId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield notification_model_1.default.create({
            userId,
            title,
            message,
            type,
            relatedId,
            isRead: false
        });
        // Also try to send push if this is called internally (except for admin send which handles it separately)
        // For now, keeping explicit calls in controllers to avoid circular dependencies or double sends
    }
    catch (error) {
        console.error('Create Notification Error:', error);
    }
});
exports.createNotification = createNotification;
// Send notification manually (Admin)
const sendNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, title, message } = req.body;
        // console.log(`Sending notification to user ${userId}: ${title}`);
        yield notification_model_1.default.create({
            userId,
            title,
            message,
            type: 'admin_message',
            isRead: false
        });
        res.status(200).json({ success: true, message: 'Notification sent successfully' });
    }
    catch (error) {
        console.error('Send Notification Error:', error);
        res.status(500).json({ message: 'Error sending notification', error: error.message });
    }
});
exports.sendNotification = sendNotification;
const broadcastLog_model_1 = __importDefault(require("../models/broadcastLog.model"));
// Broadcast to ALL users
const broadcastNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, message } = req.body;
        // 1. Fetch all users
        const users = yield user_model_1.default.findAll({ attributes: ['id'] });
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
        yield notification_model_1.default.bulkCreate(notifications);
        // 4. Log to History
        yield broadcastLog_model_1.default.create({
            title,
            message,
            sentCount: users.length
        });
        res.status(200).json({ success: true, message: `Broadcast sent to ${users.length} users.` });
    }
    catch (error) {
        console.error("Broadcast Error:", error);
        res.status(500).json({ message: 'Broadcast failed', error: error.message });
    }
});
exports.broadcastNotification = broadcastNotification;
// Get Broadcast History
const getBroadcastHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const history = yield broadcastLog_model_1.default.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(history);
    }
    catch (error) {
        console.error("Broadcast History Error:", error);
        res.status(500).json({ message: 'Failed to fetch history', error: error.message });
    }
});
exports.getBroadcastHistory = getBroadcastHistory;
