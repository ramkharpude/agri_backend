// In-memory OTP store for simplicity (Note: Use Redis for production)
const otpStore: { [phoneNumber: string]: string } = {};

export const generateOtp = (phoneNumber: string): string => {
    // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore[phoneNumber] = otp;
    return otp;
};

export const verifyOtp = (phoneNumber: string, otp: string): boolean => {
    if (otpStore[phoneNumber] === otp) {
        delete otpStore[phoneNumber]; // Invalidate after use
        return true;
    }
    return false;
};
