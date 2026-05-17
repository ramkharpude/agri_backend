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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBatchPushNotifications = exports.sendPushNotification = void 0;
const expo_server_sdk_1 = require("expo-server-sdk");
const expo = new expo_server_sdk_1.Expo();
const sendPushNotification = (pushToken, title, body, data) => __awaiter(void 0, void 0, void 0, function* () {
    if (!expo_server_sdk_1.Expo.isExpoPushToken(pushToken)) {
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
        const chunks = expo.chunkPushNotifications(messages);
        for (let chunk of chunks) {
            try {
                const ticketChunk = yield expo.sendPushNotificationsAsync(chunk);
            }
            catch (error) {
                console.error('Error sending chunk:', error);
            }
        }
    }
    catch (error) {
        console.error('Error sending push notification:', error);
    }
});
exports.sendPushNotification = sendPushNotification;
const sendBatchPushNotifications = (tokens, title, body, data) => __awaiter(void 0, void 0, void 0, function* () {
    let messages = [];
    for (let pushToken of tokens) {
        if (!expo_server_sdk_1.Expo.isExpoPushToken(pushToken)) {
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
            let ticketChunk = yield expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        }
        catch (error) {
            console.error('Error sending chunk', error);
        }
    }
});
exports.sendBatchPushNotifications = sendBatchPushNotifications;
