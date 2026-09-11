import { Server as SocketIOServer, Socket } from 'socket.io';

export const registerSocketHandlers = (io: SocketIOServer) => {
  io.on('connection', (socket: Socket) => {
    // console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('join_session', (sessionId: string) => {
      socket.join(`session:${sessionId}`);
      // console.log(`[Socket] ${socket.id} joined session:${sessionId}`);
    });

    socket.on('leave_session', (sessionId: string) => {
      socket.leave(`session:${sessionId}`);
      // console.log(`[Socket] ${socket.id} left session:${sessionId}`);
    });

    socket.on('cell_updated', (data: { sessionId: string; colIndex: number; rowIndex: number; value: number | null; stats: any }) => {
      socket.to(`session:${data.sessionId}`).emit('session:cellUpdated', data);
    });

    socket.on('session_closed', (data: { sessionId: string; code: string }) => {
      io.to(`session:${data.sessionId}`).emit('session:closed', data);
    });

    socket.on('disconnect', () => {
      // console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
};
