import express from 'express';
import { reportDisease, getUserDiseases, getDiseaseDetails, diagnoseDisease } from '../controllers/disease.controller';
import { protect } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = express.Router();

router.post('/', protect, upload.array('images', 5), reportDisease);
router.get('/', protect, getUserDiseases);
router.get('/:id', protect, getDiseaseDetails);
router.put('/:id/diagnose', protect, diagnoseDisease);

export default router;
