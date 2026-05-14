import express from 'express';
import { sendOtp, verifyOtpAndLogin, register, checkUser, adminLogin, updateFcmToken, updateAdminPushToken } from '../controllers/auth.controller';

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtpAndLogin);
router.post('/register', register);
router.post('/check-user', checkUser);
router.post('/admin-login', adminLogin);


// Protected Routes
import { protect as authenticate } from '../middleware/auth.middleware';

router.post('/update-fcm-token', authenticate, updateFcmToken);
router.post('/admin-push-token', authenticate, updateAdminPushToken);

export default router;
