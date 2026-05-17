"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const achievement_controller_1 = require("../controllers/achievement.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.protect, achievement_controller_1.getAllAchievements);
router.get('/:id', auth_middleware_1.protect, achievement_controller_1.getAchievementById);
// Admin actions
router.post('/', auth_middleware_1.protect, upload_middleware_1.upload.array('photos', 10), achievement_controller_1.createAchievement);
router.put('/:id', auth_middleware_1.protect, upload_middleware_1.upload.array('photos', 10), achievement_controller_1.updateAchievement);
router.delete('/:id', auth_middleware_1.protect, achievement_controller_1.deleteAchievement);
router.delete('/:id/comment/:commentId', auth_middleware_1.protect, achievement_controller_1.deleteComment);
// User actions
router.post('/:id/like', auth_middleware_1.protect, achievement_controller_1.toggleLike);
router.post('/:id/comment', auth_middleware_1.protect, achievement_controller_1.addComment);
exports.default = router;
