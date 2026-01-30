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
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load env vars from the root backend directory
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const communication_service_1 = require("../services/communication.service");
const testSms = () => __awaiter(void 0, void 0, void 0, function* () {
    const phoneNumber = process.argv[2];
    if (!phoneNumber) {
        console.error('Please provide a phone number as an argument.');
        // console.log('Usage: npx ts-node src/scripts/test-sms.ts <phone_number>');
        process.exit(1);
    }
    // console.log(`Sending Test OTP to ${phoneNumber}...`);
    // Using a random 4-digit OTP
    const testOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const result = yield (0, communication_service_1.sendOtpMessage)(phoneNumber, testOtp);
    // console.log('Result:', result);
});
testSms();
