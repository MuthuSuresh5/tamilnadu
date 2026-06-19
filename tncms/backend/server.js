require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Handle uncaught exceptions before anything else
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

const app = express();
const server = http.createServer(app);

// Allowed origins for CORS
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URL?.replace(/\/$/, ''), // without trailing slash
  'https://tn-complaint.vercel.app',
  'https://tamilnadu-ten.vercel.app',
  'http://localhost:5173',
].filter(Boolean);

const io = new Server(server, {
  cors: { 
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
});

// Connect DB
connectDB();

// Trust proxy (required for Vercel / reverse proxies)
app.set('trust proxy', 1);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS - handle multiple origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Remove trailing slash for comparison
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
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Rate limiting - Vercel compatible
const rateLimitConfig = (max) => ({
  windowMs: 15 * 60 * 1000,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
})
app.use('/api/', rateLimit(rateLimitConfig(200)))
app.use('/api/auth/login', rateLimit({ ...rateLimitConfig(10), message: { success: false, message: 'Too many login attempts, please try again later' } }))

// Share io with controllers
app.set('io', io);

// Serve uploaded files
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// Routes
app.get('/', (req, res) => res.json({ service: 'TN CMS API', status: 'running', version: '1.0.0' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/wards', require('./routes/wards'));
app.use('/api/officers', require('./routes/officers'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date(), env: process.env.NODE_ENV }));

// 404 handler for unknown API routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Socket.io
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  socket.on('join_room', (room) => socket.join(room));
  socket.on('join_ward', (wardNumber) => socket.join(`ward_${wardNumber}`));
  socket.on('join_admin', () => socket.join('admin'));
  socket.on('disconnect', () => logger.info(`Socket disconnected: ${socket.id}`));
});

// Global error handler (must be last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Only listen if not in serverless environment
if (process.env.VERCEL !== '1') {
  server.listen(PORT, () => logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV}]`));
}

// Handle unhandled promise rejections (log only — don't exit on Vercel)
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
});

// Export for Vercel serverless
module.exports = app;
