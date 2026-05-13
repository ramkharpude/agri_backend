const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
let expo = new Expo();

const token = 'ExponentPushToken[P5SS49EeNSLmmf6iuAydyP]';
const message = {
    to: token,
    sound: 'default',
    title: 'Test Notification',
    body: 'This is a test notification from the debug script!',
    data: { someData: 'goes here' },
};

async function send() {
    if (!Expo.isExpoPushToken(token)) {
        console.error(`Push token ${token} is not a valid Expo push token`);
        return;
    }

    console.log('Sending test notification to:', token);

    try {
        let chunks = expo.chunkPushNotifications([message]);
        for (let chunk of chunks) {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log('Result:', ticketChunk);
        }
    } catch (error) {
        console.error('Error sending:', error);
    }
}

send();
