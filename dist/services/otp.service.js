"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtp = exports.generateOtp = void 0;
const otpStore = {};
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MS = 60 * 1000; // 1 minute
const generateOtp = (phoneNumber) => {
    const now = Date.now();
    const existingRecord = otpStore[phoneNumber];
    // Rate Limiting Check
    if (existingRecord) {
        const timeSinceLastRequest = now - existingRecord.lastRequestTime;
        if (timeSinceLastRequest < RATE_LIMIT_MS) {
            const waitTime = Math.ceil((RATE_LIMIT_MS - timeSinceLastRequest) / 1000);
            return { success: false, message: `Please wait ${waitTime} seconds before requesting a new OTP.` };
        }
    }
    // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore[phoneNumber] = {
        otp,
        expiresAt: now + OTP_EXPIRY_MS,
        lastRequestTime: now
    };
    return { success: true, otp };
};
exports.generateOtp = generateOtp;
const verifyOtp = (phoneNumber, otp) => {
    const record = otpStore[phoneNumber];
    if (!record)
        return false;
    if (Date.now() > record.expiresAt) {
        delete otpStore[phoneNumber]; // Clean up expired
        return false;
    }
    if (record.otp === otp) {
        delete otpStore[phoneNumber]; // Invalidate after use
        return true;
    }
    return false;
};
exports.verifyOtp = verifyOtp;
