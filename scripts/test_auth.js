const axios = require('axios');

const API_URL = 'http://localhost:5002/api/auth';
const TEST_PHONE = '9876543210';

async function testAuth() {
    console.log('--- Starting Auth API Test ---');

    // 1. Send OTP (Should Success)
    try {
        console.log(`\n1. Requesting OTP for ${TEST_PHONE}...`);
        const res1 = await axios.post(`${API_URL}/send-otp`, { phoneNumber: TEST_PHONE });
        console.log('✅ Success:', res1.data);
    } catch (error) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
    }

    // 2. Send OTP Again (Should Fail - Rate Limit)
    try {
        console.log(`\n2. Requesting OTP again immediately (Expected Rate Limit Error)...`);
        const res2 = await axios.post(`${API_URL}/send-otp`, { phoneNumber: TEST_PHONE });
        console.log('⚠️ Unexpected Success:', res2.data);
    } catch (error) {
        if (error.response && error.response.status === 429) {
            console.log('✅ Rate Limit Verified:', error.response.data);
        } else {
            console.error('❌ Error:', error.response ? error.response.data : error.message);
        }
    }

    console.log('\n--- Test Complete ---');
}

testAuth();
