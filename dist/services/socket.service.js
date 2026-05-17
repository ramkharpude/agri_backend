"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketHandler = void 0;
const socketHandler = (io) => {
    io.on('connection', (socket) => {
        socket.on('disconnect', () => {
            // Client disconnected
        });
    });
};
exports.socketHandler = socketHandler;
