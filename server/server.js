import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import hodRoutes from './routes/hodRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import circularRoutes from './routes/circularRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import academicRoutes from './routes/academicRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import mentoringRoutes from './routes/mentoringRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import timelineRoutes from './routes/timelineRoutes.js';
import { setupSocketHandlers } from './sockets/socketHandler.js';

import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import xssClean from './middlewares/xssClean.js';
import compression from 'compression';
import fs from 'fs';

dotenv.config();

// Ensure uploads folder exists
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Connect to database
connectDB();

const app = express();

// Configure dynamic CORS origins to support custom domains, local testing, and Vercel preview deploys
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(allowed => origin === allowed) || 
                      origin.endsWith('.vercel.app') || 
                      origin.startsWith('http://localhost:');
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

// Enable CORS early so error responses get correct headers
app.use(cors(corsOptions));
app.use(express.json());

// Security Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(mongoSanitize());
app.use(xssClean);
app.use(compression());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api/', apiLimiter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOptions.origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Make io accessible from routes/controllers
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/portal', complaintRoutes);
app.use('/api/circulars', circularRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/mentoring', mentoringRoutes);
app.use('/api/chat', messageRoutes);
app.use('/api/timeline', timelineRoutes);

// Static folders
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.send('KVCET CSE ERP API with Socket.IO is running...');
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected error occurred',
    errors: process.env.NODE_ENV === 'production' ? [] : [err.stack]
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
