import { Router } from 'express';
import {
    createAchievement, getAllAchievements, getAchievementById,
    updateAchievement, deleteAchievement, toggleLike, addComment, deleteComment
} from '../controllers/achievement.controller';
import { protect } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.get('/', protect, getAllAchievements);
router.get('/:id', protect, getAchievementById);

// Admin actions
router.post('/', protect, upload.array('photos', 10), createAchievement);
router.put('/:id', protect, upload.array('photos', 10), updateAchievement);
router.delete('/:id', protect, deleteAchievement);
router.delete('/:id/comment/:commentId', protect, deleteComment);

// User actions
router.post('/:id/like', protect, toggleLike);
router.post('/:id/comment', protect, addComment);

export default router;
