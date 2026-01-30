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
exports.updateFcmToken = exports.adminLogin = exports.checkUser = exports.register = exports.verifyOtpAndLogin = exports.sendOtp = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const otp_service_1 = require("../services/otp.service");
const communication_service_1 = require("../services/communication.service");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';
// Step 1: Request OTP
const sendOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // console.time('OTP-Total-Request-Time');
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required' });
    }
    // Mock OTP Generation
    const otp = (0, otp_service_1.generateOtp)(phoneNumber);
    // Real OTP Sending
    let deliveryResult = { success: false, method: 'none' };
    try {
        // console.time('OTP-Service-Call');
        deliveryResult = yield (0, communication_service_1.sendOtpMessage)(phoneNumber, otp);
        // console.timeEnd('OTP-Service-Call');
    }
    catch (e) {
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
    }
    else {
        console.error('Failed to send OTP via all methods. FALLBACK MODE ACTIVE.');
        // FALLBACK FOR DEV/NO-CREDITS: Return 200 anyway and log the OTP
        // console.log(`[DEV BYPASS] OTP for ${phoneNumber} is: ${otp}`);
        // console.timeEnd('OTP-Total-Request-Time');
        res.status(200).json({
            message: 'OTP sent (Dev Bypass). Check server logs for code.',
            success: true,
            devOtp: otp // Optional: send back in response for easier testing if desired, but console is safer
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
                user,
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
    const { phoneNumber, fullName, address, role } = req.body;
    if (!phoneNumber || !fullName || !address) {
        return res.status(400).json({ message: 'Phone, Name, and Address are required' });
    }
    try {
        const existingUser = yield user_model_1.default.findOne({ where: { phoneNumber } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const newUser = yield user_model_1.default.create({
            phoneNumber,
            fullName,
            address,
            role: role || 'farmer',
            isVerified: true
        });
        const token = jsonwebtoken_1.default.sign({ id: newUser.id, phoneNumber: newUser.phoneNumber }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            message: 'Registration successful',
            token,
            user: newUser
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
        res.status(200).json({ exists: !!user });
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
