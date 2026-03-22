require('dotenv').config();
require('express-async-errors');

const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/db');
const { initFirebase } = require('./config/firebase');
const { initSocket, getIo } = require('./socket/socketManager');
const { startResetCron } = require('./cron/resetQueue');
const { errorMiddleware, notFoundMiddleware } = require('./middleware/errorMiddleware');

// ── Routes ────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const queueRoutes = require('./routes/queueRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const clinicRoutes = require('./routes/clinicRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// ── Initialize ────────────────────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

// Connect to MongoDB
connectDB();

// Initialize Firebase (FCM)
initFirebase();

// Initialize Socket.IO
const io = initSocket(httpServer);

// Make io accessible in controllers via req.app.get('io')
app.set('io', io);

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.WEB_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5173',
    /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,  // LAN for mobile dev
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Clinic Queue API is running 🏥',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/token', tokenRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/clinic', clinicRoutes);
app.use('/api/notifications', notificationRoutes);

// ── Serve React Frontend in Production ────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const webPath = path.join(__dirname, '../web/dist');
  app.use(express.static(webPath));
  
  // Catch-all route to serve React's index.html for unknown routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(webPath, 'index.html'));
  });
} else {
  // ── 404 handler for API routes only in Development ──────────────────────
  app.use(notFoundMiddleware);
}

// ── Error handler ─────────────────────────────────────────────────────────
app.use(errorMiddleware);

// ── Start server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`\n🏥 Smart Clinic Queue Server v2.0`);
  console.log(`🚀 Running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO active`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);

  // Start midnight queue reset cron
  startResetCron(io);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⛔ SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

module.exports = { app, httpServer };
