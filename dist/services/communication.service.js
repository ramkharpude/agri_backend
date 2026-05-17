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
exports.sendOtpMessage = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE_NAME;
const SMS_API_KEY = process.env.SMS_API_KEY;
/**
 * Send WhatsApp message using Evolution API
 */
const sendWhatsApp = (phoneNumber, message) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
        console.warn('Evolution API not configured. Skipping WhatsApp.');
        return false;
    }
    try {
        let formattedNumber = phoneNumber.replace(/\D/g, '');
        if (formattedNumber.length === 10) {
            formattedNumber = '91' + formattedNumber;
        }
        else if (!formattedNumber.startsWith('91')) {
            formattedNumber = '91' + formattedNumber;
        }
        const url = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`;
        yield axios_1.default.post(url, { number: formattedNumber, text: message }, {
            headers: { apikey: EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
        });
        return true;
    }
    catch (error) {
        console.error('WhatsApp Send Error:', JSON.stringify(((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message, null, 2));
        return false;
    }
});
/**
 * Send SMS using Fast2SMS (Fallback)
 */
const sendSms = (phoneNumber, message) => __awaiter(void 0, void 0, void 0, function* () {
    if (!SMS_API_KEY) {
        console.warn('SMS API Key not configured. Skipping SMS.');
        return false;
    }
    try {
        const response = yield axios_1.default.get('https://www.fast2sms.com/dev/bulkV2', {
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
        }
        else {
            console.error('Fast2SMS API returned error:', response.data);
            return false;
        }
    }
    catch (error) {
        console.error('SMS Send Error:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
        return false;
    }
});
/**
 * Main OTP Sending Function with Fallback Logic
 */
const sendOtpMessage = (phoneNumber, otp) => __awaiter(void 0, void 0, void 0, function* () {
    const message = `Your RK Consultancy OTP is: ${otp}. Do not share this with anyone.`;
    // 1. Try WhatsApp
    const whatsappSuccess = yield sendWhatsApp(phoneNumber, message);
    if (whatsappSuccess) {
        return { success: true, method: 'whatsapp' };
    }
    // 2. Fallback to SMS
    const smsSuccess = yield sendSms(phoneNumber, message);
    if (smsSuccess) {
        return { success: true, method: 'sms' };
    }
    console.error('All OTP delivery methods failed.');
    return { success: false, method: 'failed' };
});
exports.sendOtpMessage = sendOtpMessage;
