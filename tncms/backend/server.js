require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const isVercel = process.env.VERCEL === '1';

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  if (!isVercel) process.exit(1);
});

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URL?.replace(/\/$/, ''),
  'https://tn-complaint.vercel.app',
  'https://tamilnadu-ten.vercel.app',
  'http://localhost:5173',
].filter(Boolean);

// Connect DB on every request (required for Vercel serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    logger.error(`DB connection failed: ${err.message}`);
    res.status(500).json({ success: false, message: 'Database connection failed. Please try again.' });
  }
});

// Trust proxy (required for Vercel / reverse proxies)
app.set('trust proxy', 1);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.replace(/\/$/, '');
    const isAllowed = allowedOrigins.some(allowed => 
      allowed?.replace(/\/$/, '') === normalizedOrigin
    );
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
if (!isVercel) app.use(morgan('dev'));

// Rate limiting
const rateLimitConfig = (max) => ({
  windowMs: 15 * 60 * 1000,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});

app.use('/api/', rateLimit(rateLimitConfig(200)));
app.use('/api/auth/login', rateLimit({ 
  ...rateLimitConfig(10), 
  message: { success: false, message: 'Too many login attempts, please try again later' } 
}));

// Serve uploaded files (only for local - not used in Vercel)
if (!isVercel) {
  app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));
}

// Routes
app.get('/', (req, res) => res.json({ 
  service: 'TVK CMS API', 
  status: 'running', 
  version: '1.0.0',
  timestamp: new Date().toISOString()
}));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/wards', require('./routes/wards'));
app.use('/api/officers', require('./routes/officers'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));

app.get('/api/health', (req, res) => {
  const isCloudinaryConfigured = 
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    !process.env.CLOUDINARY_CLOUD_NAME.includes('<');
    
  res.json({ 
    status: 'OK', 
    timestamp: new Date(), 
    env: process.env.NODE_ENV,
    features: {
      cloudinary: isCloudinaryConfigured,
      database: require('mongoose').connection.readyState === 1
    }
  });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.originalUrl} not found` 
  });
});

// Global error handler (must be last)
app.use(errorHandler);

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message || JSON.stringify(err)}`);
  logger.error(err.stack || err);
});

if (!isVercel) {
  const http = require('http');
  const { Server } = require('socket.io');
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
  });
  app.set('io', io);
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    socket.on('join_room', (room) => socket.join(room));
    socket.on('join_ward', (wardNumber) => socket.join(`ward_${wardNumber}`));
    socket.on('join_admin', () => socket.join('admin'));
    socket.on('disconnect', () => logger.info(`Socket disconnected: ${socket.id}`));
  });
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV}]`));
}

module.exports = app;
