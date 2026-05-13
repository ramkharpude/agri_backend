// In-memory OTP store for simplicity (Note: Use Redis for production)
interface OtpRecord {
    otp: string;
    expiresAt: number;
    lastRequestTime: number;
}

const otpStore: { [phoneNumber: string]: OtpRecord } = {};

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MS = 60 * 1000; // 1 minute

export const generateOtp = (phoneNumber: string): { success: boolean; otp?: string; message?: string } => {
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

export const verifyOtp = (phoneNumber: string, otp: string): boolean => {
    const record = otpStore[phoneNumber];

    if (!record) return false;

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
