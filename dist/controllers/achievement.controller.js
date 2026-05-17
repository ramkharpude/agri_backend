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
exports.deleteComment = exports.addComment = exports.toggleLike = exports.deleteAchievement = exports.updateAchievement = exports.getAchievementById = exports.getAllAchievements = exports.createAchievement = void 0;
const achievement_model_1 = __importDefault(require("../models/achievement.model"));
const achievementComment_model_1 = __importDefault(require("../models/achievementComment.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const notification_service_1 = require("../services/notification.service");
const notification_model_1 = __importDefault(require("../models/notification.model"));
// ─── Admin: Create Achievement ───────────────────────────────────────────────
const createAchievement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description } = req.body;
        let photoUrls = [];
        if (req.files && Array.isArray(req.files)) {
            photoUrls = req.files.map(f => f.path);
        }
        const achievement = yield achievement_model_1.default.create({ title, description, photos: photoUrls, likedBy: [] });
        // Broadcast push notification + in-app notification to all users
        const users = yield user_model_1.default.findAll({ attributes: ['id', 'pushToken'] });
        const tokens = users.map(u => u.pushToken).filter(t => !!t);
        if (tokens.length > 0) {
            yield (0, notification_service_1.sendBatchPushNotifications)(tokens, '🏆 New Achievement Posted!', title);
        }
        const notifData = users.map(u => ({
            userId: u.id,
            title: '🏆 New Achievement Posted!',
            message: title,
            type: 'achievement',
            relatedId: achievement.id.toString(),
            isRead: false
        }));
        yield notification_model_1.default.bulkCreate(notifData);
        res.status(201).json(achievement);
    }
    catch (error) {
        console.error('Create Achievement Error:', error);
        res.status(500).json({ message: 'Error creating achievement', error: error.message });
    }
});
exports.createAchievement = createAchievement;
// ─── Get All Achievements ────────────────────────────────────────────────────
const getAllAchievements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const achievements = yield achievement_model_1.default.findAll({
            include: [{ model: achievementComment_model_1.default, as: 'comments', attributes: ['id'] }],
            order: [['createdAt', 'DESC']]
        });
        const result = achievements.map((a) => (Object.assign(Object.assign({}, a.toJSON()), { likeCount: (a.likedBy || []).length, commentCount: (a.comments || []).length, isLiked: userId ? (a.likedBy || []).includes(userId) : false })));
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Get Achievements Error:', error);
        res.status(500).json({ message: 'Error fetching achievements', error: error.message });
    }
});
exports.getAllAchievements = getAllAchievements;
// ─── Get Single Achievement with Comments ────────────────────────────────────
const getAchievementById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const achievement = yield achievement_model_1.default.findByPk(id, {
            include: [{ model: achievementComment_model_1.default, as: 'comments', order: [['createdAt', 'DESC']] }]
        });
        if (!achievement)
            return res.status(404).json({ message: 'Achievement not found' });
        const data = achievement.toJSON();
        // Resolve likedBy user IDs to user objects for the admin detail view
        let likedByUsers = [];
        if (data.likedBy && data.likedBy.length > 0) {
            const users = yield user_model_1.default.findAll({
                where: { id: data.likedBy },
                attributes: ['id', 'fullName', 'phoneNumber']
            });
            likedByUsers = users.map((u) => u.toJSON());
        }
        res.status(200).json(Object.assign(Object.assign({}, data), { likeCount: (data.likedBy || []).length, likedByUsers, isLiked: userId ? (data.likedBy || []).includes(userId) : false }));
    }
    catch (error) {
        console.error('Get Achievement Error:', error);
        res.status(500).json({ message: 'Error fetching achievement', error: error.message });
    }
});
exports.getAchievementById = getAchievementById;
// ─── Admin: Update Achievement ────────────────────────────────────────────────
const updateAchievement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, description, keepExistingPhotos } = req.body;
        const achievement = yield achievement_model_1.default.findByPk(id);
        if (!achievement)
            return res.status(404).json({ message: 'Achievement not found' });
        if (title)
            achievement.title = title;
        if (description)
            achievement.description = description;
        // If new photos uploaded, replace. If keepExistingPhotos flag, keep old.
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const newUrls = req.files.map(f => f.path);
            achievement.photos = newUrls;
        }
        yield achievement.save();
        res.status(200).json(achievement);
    }
    catch (error) {
        console.error('Update Achievement Error:', error);
        res.status(500).json({ message: 'Error updating achievement', error: error.message });
    }
});
exports.updateAchievement = updateAchievement;
// ─── Admin: Delete Achievement ────────────────────────────────────────────────
const deleteAchievement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const achievement = yield achievement_model_1.default.findByPk(id);
        if (!achievement)
            return res.status(404).json({ message: 'Achievement not found' });
        yield achievementComment_model_1.default.destroy({ where: { achievementId: id } });
        yield achievement.destroy();
        res.status(200).json({ message: 'Achievement deleted successfully' });
    }
    catch (error) {
        console.error('Delete Achievement Error:', error);
        res.status(500).json({ message: 'Error deleting achievement', error: error.message });
    }
});
exports.deleteAchievement = deleteAchievement;
// ─── User: Toggle Like ────────────────────────────────────────────────────────
const toggleLike = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const achievement = yield achievement_model_1.default.findByPk(id);
        if (!achievement)
            return res.status(404).json({ message: 'Achievement not found' });
        const likedBy = [...(achievement.likedBy || [])];
        const alreadyLiked = likedBy.includes(userId);
        if (alreadyLiked) {
            achievement.likedBy = likedBy.filter(uid => uid !== userId);
        }
        else {
            achievement.likedBy = [...likedBy, userId];
        }
        yield achievement.save();
        res.status(200).json({ likeCount: achievement.likedBy.length, isLiked: !alreadyLiked });
    }
    catch (error) {
        console.error('Toggle Like Error:', error);
        res.status(500).json({ message: 'Error updating like', error: error.message });
    }
});
exports.toggleLike = toggleLike;
// ─── User: Add Comment ────────────────────────────────────────────────────────
const addComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { text } = req.body;
        const userId = req.user.id;
        const user = yield user_model_1.default.findByPk(userId);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const comment = yield achievementComment_model_1.default.create({
            achievementId: parseInt(id),
            userId,
            userName: user.fullName,
            text
        });
        res.status(201).json(comment);
    }
    catch (error) {
        console.error('Add Comment Error:', error);
        res.status(500).json({ message: 'Error adding comment', error: error.message });
    }
});
exports.addComment = addComment;
// ─── Admin: Delete Comment ────────────────────────────────────────────────────
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { commentId } = req.params;
        yield achievementComment_model_1.default.destroy({ where: { id: commentId } });
        res.status(200).json({ message: 'Comment deleted' });
    }
    catch (error) {
        console.error('Delete Comment Error:', error);
        res.status(500).json({ message: 'Error deleting comment', error: error.message });
    }
});
exports.deleteComment = deleteComment;
