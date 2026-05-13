import { Server, Socket } from 'socket.io';

export const socketHandler = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        socket.on('disconnect', () => {
            // Client disconnected
        });
    });
};
