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
exports.socketHandler = void 0;
const message_model_1 = __importDefault(require("../models/message.model"));
const socketHandler = (io) => {
    io.on('connection', (socket) => {
        // console.log('User connected:', socket.id);
        socket.on('join_consultation', (consultationId) => {
            socket.join(consultationId);
            // console.log(`User ${socket.id} joined consultation ${consultationId}`);
        });
        socket.on('send_message', (data) => __awaiter(void 0, void 0, void 0, function* () {
            const { consultationId, senderId, content, type } = data;
            try {
                // Save to DB
                // Assuming senderId is the User ID
                const message = yield message_model_1.default.create({
                    consultationId,
                    senderId,
                    content,
                    type
                });
                // Broadcast to room
                io.to(consultationId).emit('receive_message', message);
            }
            catch (error) {
                console.error('Error saving message:', error);
            }
        }));
        socket.on('disconnect', () => {
            // console.log('User disconnected');
        });
    });
};
exports.socketHandler = socketHandler;
