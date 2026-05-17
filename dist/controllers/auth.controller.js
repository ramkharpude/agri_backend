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
exports.updateAdminPushToken = exports.updateFcmToken = exports.adminLogin = exports.checkUser = exports.register = exports.verifyOtpAndLogin = exports.sendOtp = exports.getAdminPushToken = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const customer_model_1 = __importDefault(require("../models/customer.model"));
const otp_service_1 = require("../services/otp.service");
const communication_service_1 = require("../services/communication.service");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';
// In-memory store for admin push token (admin is not a DB user)
let adminPushToken = null;
const getAdminPushToken = () => adminPushToken;
exports.getAdminPushToken = getAdminPushToken;
// Step 1: Request OTP
const sendOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required' });
    }
    // Mock OTP Generation
    const otpResult = (0, otp_service_1.generateOtp)(phoneNumber);
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
        deliveryResult = yield (0, communication_service_1.sendOtpMessage)(phoneNumber, otp);
    }
    catch (e) {
        console.error('OTP Send Error Exception:', e);
    }
    if (deliveryResult.success) {
        res.status(200).json({
            message: `OTP sent successfully via ${deliveryResult.method}`,
            success: true,
            method: deliveryResult.method
        });
    }
    else if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to send OTP via all methods. FALLBACK MODE ACTIVE (DEV ONLY).');
        res.status(200).json({
            message: 'OTP sent (Dev Bypass). Check server logs for code.',
            success: true,
            devOtp: otp // Optional: send back in response for easier testing if desired, but console is safer
        });
    }
    else {
        res.status(500).json({
            message: 'Failed to send OTP via any method. Please try again later.',
            success: false
        });
    }
});
exports.sendOtp = sendOtp;
// Step 2: Verify OTP and Login/Register
const verifyOtpAndLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp) {
        return res.status(400).json({ message: 'Phone number and OTP are required' });
    }
    if (!(0, otp_service_1.verifyOtp)(phoneNumber, otp)) {
        return res.status(401).json({ message: 'Invalid or expired OTP' });
    }
    try {
        // Find or Create User
        // Note: For a strictly separate Register flow, you'd check existence first.
        // For simplicity, we'll treat this as "Login if exists, else wait for details".
        const user = yield user_model_1.default.findOne({ where: { phoneNumber } });
        if (user) {
            // User exists - Login
            const token = jsonwebtoken_1.default.sign({ id: user.id, phoneNumber: user.phoneNumber }, JWT_SECRET, { expiresIn: '7d' });
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
        }
        else {
            // User does not exist
            return res.status(200).json({
                message: 'OTP verified. User not found, please register.',
                isNewUser: true
            });
        }
    }
    catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.verifyOtpAndLogin = verifyOtpAndLogin;
// Step 3: Complete Registration (if new user)
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phoneNumber, fullName, address, role, specialtyCrops, profilePhoto } = req.body;
    if (!phoneNumber || !fullName || !address) {
        return res.status(400).json({ message: 'Phone, Name, and Address are required' });
    }
    try {
        const userRole = role || 'farmer';
        const existingUser = yield user_model_1.default.findOne({ where: { phoneNumber } });
        if (existingUser) {
            const rolesArray = existingUser.role ? existingUser.role.split(',') : [];
            if (rolesArray.includes(userRole)) {
                // User already has this role, treat as successful login
                const token = jsonwebtoken_1.default.sign({ id: existingUser.id, phoneNumber: existingUser.phoneNumber }, JWT_SECRET, { expiresIn: '7d' });
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
            }
            else {
                // Append the new role
                existingUser.role = existingUser.role ? `${existingUser.role},${userRole}` : userRole;
                // Require admin approval if they are adding the consultant role
                if (userRole === 'consultant') {
                    existingUser.isApproved = false;
                }
                // If they are adding a consultant role, we update their specialty crops if provided
                if (specialtyCrops && Array.isArray(specialtyCrops)) {
                    const existingCrops = existingUser.specialtyCrops || [];
                    const newCrops = specialtyCrops.filter((c) => !existingCrops.includes(c));
                    if (newCrops.length > 0) {
                        existingUser.specialtyCrops = [...existingCrops, ...newCrops];
                    }
                }
                yield existingUser.save();
                const token = jsonwebtoken_1.default.sign({ id: existingUser.id, phoneNumber: existingUser.phoneNumber }, JWT_SECRET, { expiresIn: '7d' });
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
        const newUser = yield user_model_1.default.create({
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
            yield customer_model_1.default.update({ userId: newUser.id }, { where: { phoneNumber } });
        }
        const token = jsonwebtoken_1.default.sign({ id: newUser.id, phoneNumber: newUser.phoneNumber }, JWT_SECRET, { expiresIn: '7d' });
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
    }
    catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
exports.register = register;
// Legacy compatible endpoint for "checking" user
const checkUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phoneNumber } = req.body;
    try {
        const user = yield user_model_1.default.findOne({ where: { phoneNumber } });
        res.status(200).json({ exists: !!user, role: user ? user.role : null });
    }
    catch (error) {
        console.error('Check User Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.checkUser = checkUser;
// Admin Login
const adminLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        return res.status(500).json({ message: 'Admin credentials not configured on server' });
    }
    // Direct check for admin credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const token = jsonwebtoken_1.default.sign({ id: 0, role: 'admin', email }, JWT_SECRET, { expiresIn: '30d' });
        return res.status(200).json({
            message: 'Admin login successful',
            token,
            user: { email, role: 'admin', fullName: 'Rambhau Kharpude' }
        });
    }
    res.status(401).json({ message: 'Invalid admin credentials' });
});
exports.adminLogin = adminLogin;
const updateFcmToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fcmToken } = req.body;
        const userId = req.user.id;
        yield user_model_1.default.update({ pushToken: fcmToken }, { where: { id: userId } });
        res.status(200).json({ message: 'Push token updated successfully' });
    }
    catch (error) {
        console.error('Update Token Error:', error);
        res.status(500).json({ message: 'Error updating token' });
    }
});
exports.updateFcmToken = updateFcmToken;
const updateAdminPushToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pushToken } = req.body;
        if (pushToken) {
            adminPushToken = pushToken;
            console.log('[Admin Push Token] Updated:', pushToken);
        }
        res.status(200).json({ message: 'Admin push token updated successfully' });
    }
    catch (error) {
        console.error('Update Admin Push Token Error:', error);
        res.status(500).json({ message: 'Error updating admin push token' });
    }
});
exports.updateAdminPushToken = updateAdminPushToken;
