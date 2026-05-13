import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE_NAME;
const SMS_API_KEY = process.env.SMS_API_KEY;

/**
 * Send WhatsApp message using Evolution API
 */
const sendWhatsApp = async (phoneNumber: string, message: string): Promise<boolean> => {
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
        console.warn('Evolution API not configured. Skipping WhatsApp.');
        return false;
    }

    try {
        let formattedNumber = phoneNumber.replace(/\D/g, '');
        if (formattedNumber.length === 10) {
            formattedNumber = '91' + formattedNumber;
        } else if (!formattedNumber.startsWith('91')) {
            formattedNumber = '91' + formattedNumber;
        }

        const url = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`;
        await axios.post(url, { number: formattedNumber, text: message }, {
            headers: { apikey: EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
        });

        return true;
    } catch (error: any) {
        console.error('WhatsApp Send Error:', JSON.stringify(error.response?.data || error.message, null, 2));
        return false;
    }
};

/**
 * Send SMS using Fast2SMS (Fallback)
 */
const sendSms = async (phoneNumber: string, message: string): Promise<boolean> => {
    if (!SMS_API_KEY) {
        console.warn('SMS API Key not configured. Skipping SMS.');
        return false;
    }

    try {
        const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
            headers: { authorization: SMS_API_KEY },
            params: {
                authorization: SMS_API_KEY,
                route: 'q',
                message: message,
                language: 'english',
                flash: '0',
                numbers: phoneNumber.replace(/\D/g, '')
            }
        });

        if (response.data && response.data.return === true) {
            return true;
        } else {
            console.error('Fast2SMS API returned error:', response.data);
            return false;
        }
    } catch (error: any) {
        console.error('SMS Send Error:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
        return false;
    }
};

/**
 * Main OTP Sending Function with Fallback Logic
 */
export const sendOtpMessage = async (phoneNumber: string, otp: string) => {
    const message = `Your AgriConsult Pro OTP is: ${otp}. Do not share this with anyone.`;

    // 1. Try WhatsApp
    const whatsappSuccess = await sendWhatsApp(phoneNumber, message);
    if (whatsappSuccess) {
        return { success: true, method: 'whatsapp' };
    }

    // 2. Fallback to SMS
    const smsSuccess = await sendSms(phoneNumber, message);
    if (smsSuccess) {
        return { success: true, method: 'sms' };
    }

    console.error('All OTP delivery methods failed.');
    return { success: false, method: 'failed' };
};
