import dotenv from 'dotenv';
import path from 'path';

// Load env vars from the root backend directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { sendOtpMessage } from '../services/communication.service';

const testSms = async () => {
    const phoneNumber = process.argv[2];

    if (!phoneNumber) {
        console.error('Please provide a phone number as an argument.');
        // console.log('Usage: npx ts-node src/scripts/test-sms.ts <phone_number>');
        process.exit(1);
    }

    // console.log(`Sending Test OTP to ${phoneNumber}...`);

    // Using a random 4-digit OTP
    const testOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const result = await sendOtpMessage(phoneNumber, testOtp);

    // console.log('Result:', result);
};

testSms();
