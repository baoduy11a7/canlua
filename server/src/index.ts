import http from 'http';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';

import { connectDB } from './config/db';
import { errorHandler } from './middlewares/errorHandler';
import { registerSocketHandlers } from './sockets';

import authRoutes from './routes/auth.routes';
import householdRoutes from './routes/household.routes';
import riceTypeRoutes from './routes/riceType.routes';
import sessionRoutes from './routes/session.routes';
import warehouseRoutes from './routes/warehouse.routes';
import financeRoutes from './routes/finance.routes';
import dashboardRoutes from './routes/dashboard.routes';
import userRoutes from './routes/user.routes';

dotenv.config();

const app: Express = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

registerSocketHandlers(io);

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: 'Cân Lúa Thông Minh API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/households', householdRoutes);
app.use('/api/rice-types', riceTypeRoutes);
app.use('/api/weighing-sessions', sessionRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);

import path from 'path';

// Serve frontend static build if available
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Fallback all other routes to React SPA
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Global Error Handler
app.use(errorHandler);

// Bootstrap
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🌾 [Cân Lúa Server] Running on http://localhost:${PORT}`);
    console.log(`🔌 [Socket.IO] Ready for realtime session sync`);
  });
};

startServer();

export { app, server, io };
