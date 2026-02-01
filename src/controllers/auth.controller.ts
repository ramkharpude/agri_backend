import { Request, Response } from 'express';
import User from '../models/user.model';
import { generateOtp, verifyOtp } from '../services/otp.service';
import { sendOtpMessage } from '../services/communication.service';
import { AuthRequest } from '../middleware/auth.middleware';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

// Step 1: Request OTP
export const sendOtp = async (req: Request, res: Response) => {
    // console.time('OTP-Total-Request-Time');
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required' });
    }

    // Mock OTP Generation
    const otp = generateOtp(phoneNumber);

    // Real OTP Sending
    let deliveryResult = { success: false, method: 'none' };

    try {
        // console.time('OTP-Service-Call');
        deliveryResult = await sendOtpMessage(phoneNumber, otp);
        // console.timeEnd('OTP-Service-Call');
    } catch (e) {
        console.error('OTP Send Error Exception:', e);
    }

    if (deliveryResult.success) {
        // console.log(`OTP sent via ${deliveryResult.method}`);
        // console.timeEnd('OTP-Total-Request-Time');
        res.status(200).json({
            message: `OTP sent successfully via ${deliveryResult.method}`,
            success: true,
            method: deliveryResult.method // Sending method to frontend
        });
    } else if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to send OTP via all methods. FALLBACK MODE ACTIVE (DEV ONLY).');
        // FALLBACK FOR DEV/NO-CREDITS: Return 200 anyway and log the OTP
        // console.log(`[DEV BYPASS] OTP for ${phoneNumber} is: ${otp}`);
        // console.timeEnd('OTP-Total-Request-Time');
        res.status(200).json({
            message: 'OTP sent (Dev Bypass). Check server logs for code.',
            success: true,
            devOtp: otp // Optional: send back in response for easier testing if desired, but console is safer
        });
    } else {
        res.status(500).json({
            message: 'Failed to send OTP via any method. Please try again later.',
            success: false
        });
    }
};

// Step 2: Verify OTP and Login/Register
export const verifyOtpAndLogin = async (req: Request, res: Response) => {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
        return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    if (!verifyOtp(phoneNumber, otp)) {
        return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    try {
        // Find or Create User
        // Note: For a strictly separate Register flow, you'd check existence first.
        // For simplicity, we'll treat this as "Login if exists, else wait for details".

        const user = await User.findOne({ where: { phoneNumber } });

        if (user) {
            // User exists - Login
            const token = jwt.sign({ id: user.id, phoneNumber: user.phoneNumber }, JWT_SECRET, { expiresIn: '7d' });
            return res.status(200).json({
                message: 'Login successful',
                token,
                user,
                isNewUser: false
            });
        } else {
            // User does not exist
            return res.status(200).json({
                message: 'OTP verified. User not found, please register.',
                isNewUser: true
            });
        }

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error', error: (error as any).message });
    }
};

// Step 3: Complete Registration (if new user)
export const register = async (req: Request, res: Response) => {
    const { phoneNumber, fullName, address, role } = req.body;

    if (!phoneNumber || !fullName || !address) {
        return res.status(400).json({ message: 'Phone, Name, and Address are required' });
    }

    try {
        const existingUser = await User.findOne({ where: { phoneNumber } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = await User.create({
            phoneNumber,
            fullName,
            address,
            role: role || 'farmer',
            isVerified: true
        });

        const token = jwt.sign({ id: newUser.id, phoneNumber: newUser.phoneNumber }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: newUser
        });

    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ message: 'Server error', error: (error as any).message });
    }
};

// Legacy compatible endpoint for "checking" user
export const checkUser = async (req: Request, res: Response) => {
    const { phoneNumber } = req.body;
    try {
        const user = await User.findOne({ where: { phoneNumber } });
        res.status(200).json({ exists: !!user });
    } catch (error) {
        console.error('Check User Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Admin Login
export const adminLogin = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        return res.status(500).json({ message: 'Admin credentials not configured on server' });
    }

    // Direct check for admin credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const token = jwt.sign(
            { id: 0, role: 'admin', email },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        return res.status(200).json({
            message: 'Admin login successful',
            token,
            user: { email, role: 'admin', fullName: 'Rambhau Kharpude' }
        });
    }

    res.status(401).json({ message: 'Invalid admin credentials' });
};


export const updateFcmToken = async (req: AuthRequest, res: Response) => {
    try {
        const { fcmToken } = req.body;
        const userId = req.user.id;

        await User.update({ pushToken: fcmToken }, { where: { id: userId } });

        res.status(200).json({ message: 'Push token updated successfully' });
    } catch (error) {
        console.error('Update Token Error:', error);
        res.status(500).json({ message: 'Error updating token' });
    }
};
