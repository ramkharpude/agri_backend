import { Request, Response } from 'express';
import User from '../models/user.model';
import Customer from '../models/customer.model';
import { generateOtp, verifyOtp } from '../services/otp.service';
import { sendOtpMessage } from '../services/communication.service';
import { AuthRequest } from '../middleware/auth.middleware';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

// In-memory store for admin push token (admin is not a DB user)
let adminPushToken: string | null = null;
export const getAdminPushToken = () => adminPushToken;

// Step 1: Request OTP
export const sendOtp = async (req: Request, res: Response) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required' });
    }

    // Mock OTP Generation
    const otpResult = generateOtp(phoneNumber);

    if (!otpResult.success || !otpResult.otp) {
        return res.status(429).json({
            message: otpResult.message || 'Too many requests. Please try again later.',
            success: false
        });
    }

    const otp = otpResult.otp;
    console.log(`[OTP] Generated successfully for ${phoneNumber}: ${otp}`);

    // Real OTP Sending
    let deliveryResult = { success: false, method: 'none' };

    try {
        deliveryResult = await sendOtpMessage(phoneNumber, otp);
    } catch (e) {
        console.error('OTP Send Error Exception:', e);
    }

    if (deliveryResult.success) {
        res.status(200).json({
            message: `OTP sent successfully via ${deliveryResult.method}`,
            success: true,
            method: deliveryResult.method
        });
    } else if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to send OTP via all methods. FALLBACK MODE ACTIVE (DEV ONLY).');
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
                user: {
                    id: user.id,
                    phoneNumber: user.phoneNumber,
                    fullName: user.fullName,
                    address: user.address,
                    role: user.role,
                    isVerified: user.isVerified,
                    isApproved: user.isApproved,
                    specialtyCrops: user.specialtyCrops,
                    profilePhoto: user.profilePhoto
                },
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
    const { phoneNumber, fullName, address, role, specialtyCrops, profilePhoto } = req.body;

    if (!phoneNumber || !fullName || !address) {
        return res.status(400).json({ message: 'Phone, Name, and Address are required' });
    }

    try {
        const userRole = role || 'farmer';
        const existingUser = await User.findOne({ where: { phoneNumber } });
        
        if (existingUser) {
            const rolesArray = existingUser.role ? existingUser.role.split(',') : [];
            
            if (rolesArray.includes(userRole)) {
                // User already has this role, treat as successful login
                const token = jwt.sign({ id: existingUser.id, phoneNumber: existingUser.phoneNumber }, JWT_SECRET, { expiresIn: '7d' });
                return res.status(200).json({
                    message: 'User already has this role. Login successful.',
                    token,
                    user: {
                        id: existingUser.id,
                        phoneNumber: existingUser.phoneNumber,
                        fullName: existingUser.fullName,
                        address: existingUser.address,
                        role: existingUser.role,
                        isVerified: existingUser.isVerified,
                        isApproved: existingUser.isApproved,
                        specialtyCrops: existingUser.specialtyCrops,
                        profilePhoto: existingUser.profilePhoto
                    }
                });
            } else {
                // Append the new role
                existingUser.role = existingUser.role ? `${existingUser.role},${userRole}` : userRole;
                
                // If they are adding a consultant role, we update their specialty crops if provided
                if (specialtyCrops && Array.isArray(specialtyCrops)) {
                    const existingCrops = existingUser.specialtyCrops || [];
                    const newCrops = specialtyCrops.filter((c: string) => !existingCrops.includes(c));
                    if (newCrops.length > 0) {
                        existingUser.specialtyCrops = [...existingCrops, ...newCrops];
                    }
                }
                
                // Note: We leave isApproved as is. If they were already an approved farmer, they stay approved.
                // A more complex system might require separate approval status per role.
                await existingUser.save();

                const token = jwt.sign({ id: existingUser.id, phoneNumber: existingUser.phoneNumber }, JWT_SECRET, { expiresIn: '7d' });
                return res.status(200).json({
                    message: `Role ${userRole} added successfully.`,
                    token,
                    user: {
                        id: existingUser.id,
                        phoneNumber: existingUser.phoneNumber,
                        fullName: existingUser.fullName,
                        address: existingUser.address,
                        role: existingUser.role,
                        isVerified: existingUser.isVerified,
                        isApproved: existingUser.isApproved,
                        specialtyCrops: existingUser.specialtyCrops,
                        profilePhoto: existingUser.profilePhoto
                    }
                });
            }
        }

        const newUser = await User.create({
            phoneNumber,
            fullName,
            address,
            role: userRole,
            isVerified: true,
            specialtyCrops: specialtyCrops || null,
            profilePhoto: profilePhoto || null,
            isApproved: userRole === 'consultant' ? false : true
        });

        // Retroactively link to existing customer profile if admin made a bill for them previously
        if (userRole === 'farmer') {
            await Customer.update(
                { userId: newUser.id },
                { where: { phoneNumber } }
            );
        }

        const token = jwt.sign({ id: newUser.id, phoneNumber: newUser.phoneNumber }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: userRole === 'consultant' 
                ? 'Registration successful. Awaiting admin approval.' 
                : 'Registration successful',
            token,
            user: {
                id: newUser.id,
                phoneNumber: newUser.phoneNumber,
                fullName: newUser.fullName,
                address: newUser.address,
                role: newUser.role,
                isVerified: newUser.isVerified,
                isApproved: newUser.isApproved,
                specialtyCrops: newUser.specialtyCrops,
                profilePhoto: newUser.profilePhoto
            }
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

export const updateAdminPushToken = async (req: AuthRequest, res: Response) => {
    try {
        const { pushToken } = req.body;
        if (pushToken) {
            adminPushToken = pushToken;
            console.log('[Admin Push Token] Updated:', pushToken);
        }
        res.status(200).json({ message: 'Admin push token updated successfully' });
    } catch (error) {
        console.error('Update Admin Push Token Error:', error);
        res.status(500).json({ message: 'Error updating admin push token' });
    }
};
