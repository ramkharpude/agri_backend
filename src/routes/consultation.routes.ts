import express from 'express';
import { bookConsultation, getConsultations } from '../controllers/consultation.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.route('/')
    .post(protect, bookConsultation)
    .get(protect, getConsultations);

export default router;
