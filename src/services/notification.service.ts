import { Expo } from 'expo-server-sdk';

const expo = new Expo();

export const sendPushNotification = async (pushToken: string, title: string, body: string, data?: any) => {
    if (!Expo.isExpoPushToken(pushToken)) {
        console.warn(`Push token ${pushToken} is not a valid Expo push token`);
        return;
    }

    const messages = [{
        to: pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data || {},
    }];

    try {
        const chunks = expo.chunkPushNotifications(messages as any);
        for (let chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                // console.log('Push notification sent:', ticketChunk);
            } catch (error) {
                console.error('Error sending chunk:', error);
            }
        }
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};

export const sendBatchPushNotifications = async (tokens: string[], title: string, body: string, data?: any) => {
    let messages: any[] = [];
    for (let pushToken of tokens) {
        if (!Expo.isExpoPushToken(pushToken)) {
            console.warn(`Push token ${pushToken} is not a valid Expo push token`);
            continue;
        }
        messages.push({
            to: pushToken,
            sound: 'default',
            title: title,
            body: body,
            data: data || {},
        });
    }

    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];
    for (let chunk of chunks) {
        try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            // console.log('Chunk sent', ticketChunk);
            tickets.push(...ticketChunk);
        } catch (error) {
            console.error('Error sending chunk', error);
        }
    }
};
