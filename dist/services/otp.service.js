"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtp = exports.generateOtp = void 0;
// In-memory OTP store for simplicity (Note: Use Redis for production)
const otpStore = {};
const generateOtp = (phoneNumber) => {
    // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore[phoneNumber] = otp;
    return otp;
};
exports.generateOtp = generateOtp;
const verifyOtp = (phoneNumber, otp) => {
    if (otpStore[phoneNumber] === otp) {
        delete otpStore[phoneNumber]; // Invalidate after use
        return true;
    }
    return false;
};
exports.verifyOtp = verifyOtp;
