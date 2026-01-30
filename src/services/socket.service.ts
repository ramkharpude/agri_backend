import { Server, Socket } from 'socket.io';
import Message from '../models/message.model';

export const socketHandler = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        // console.log('User connected:', socket.id);

        socket.on('join_consultation', (consultationId) => {
            socket.join(consultationId);
            // console.log(`User ${socket.id} joined consultation ${consultationId}`);
        });

        socket.on('send_message', async (data) => {
            const { consultationId, senderId, content, type } = data;

            try {
                // Save to DB
                // Assuming senderId is the User ID
                const message = await Message.create({
                    consultationId,
                    senderId,
                    content,
                    type
                });

                // Broadcast to room
                io.to(consultationId).emit('receive_message', message);
            } catch (error) {
                console.error('Error saving message:', error);
            }
        });

        socket.on('disconnect', () => {
            // console.log('User disconnected');
        });
    });
};
