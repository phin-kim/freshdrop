import { Server, Socket } from 'socket.io';

import createLogger from '../Utils/logger';

const log = createLogger('Socket.ts');
export const setupSocketHandlers = (io: Server): void => {
    io.on('connection', (socket: Socket) => {
        const userId = socket.handshake.query.userId as string | undefined;
        if (userId) {
            socket.join(`user_${userId}`);
            log.highlight(`📡 Socket connected: User ${userId}`);
        }
        socket.on('disconnect', () => {
            log.error('📡 Socket disconnected');
        });
    });
};
