const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const QueueSession = require('../models/QueueSession');
const Clinic = require('../models/Clinic');
const { buildLivePayload } = require('../services/queueService');
const { getTodayMidnight } = require('../utils/calcWaitTime');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.WEB_URL || 'http://localhost:5173',
        process.env.APP_URL || 'exp://192.168.1.1:8081',
        'http://localhost:5173',
        'http://localhost:3000',
      ],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // ── Auth middleware ────────────────────────────────────────────
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      // Allow unauthenticated connections (for public queue view)
      socket.userId = null;
      socket.userRole = 'guest';
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      // Don't disconnect — allow as guest
      socket.userId = null;
      socket.userRole = 'guest';
      next();
    }
  });

  // ── Connection handler ─────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} [${socket.userRole || 'guest'}]`);

    // ── JOIN_CLINIC ────────────────────────────────────────────
    socket.on('JOIN_CLINIC', async ({ clinicId }, ack) => {
      if (!clinicId) {
        socket.emit('ERROR', { code: 'INVALID_CLINIC', message: 'clinicId is required.' });
        return;
      }

      socket.join(`clinic:${clinicId}`);

      if (socket.userId) {
        if (socket.userRole === 'patient') {
          socket.join(`patient:${socket.userId}`);
        } else if (socket.userRole === 'doctor') {
          socket.join(`doctor:${clinicId}`);
        }
      }

      if (typeof ack === 'function') {
        ack({ joined: true, room: `clinic:${clinicId}` });
      }

      console.log(`📍 Socket ${socket.id} joined clinic:${clinicId}`);
    });

    // ── LEAVE_CLINIC ───────────────────────────────────────────
    socket.on('LEAVE_CLINIC', ({ clinicId }) => {
      socket.leave(`clinic:${clinicId}`);
      socket.leave(`doctor:${clinicId}`);
      if (socket.userId) {
        socket.leave(`patient:${socket.userId}`);
      }
    });

    // ── REQUEST_REFRESH ────────────────────────────────────────
    socket.on('REQUEST_REFRESH', async ({ clinicId }) => {
      try {
        const today = getTodayMidnight();
        const session = await QueueSession.findOne({ clinic: clinicId, date: today }).populate({
          path: 'queue',
          populate: { path: 'patient', select: 'name' },
        });

        if (!session) return;

        const clinic = await Clinic.findById(clinicId);
        const isDoctor = socket.userRole === 'doctor';
        const payload = buildLivePayload(session, clinic, isDoctor);

        socket.emit('QUEUE_UPDATED', payload);
      } catch (err) {
        socket.emit('ERROR', { code: 'REFRESH_ERROR', message: err.message });
      }
    });

    // ── Disconnect ─────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });

    // ── Error ──────────────────────────────────────────────────
    socket.on('error', (err) => {
      console.error(`Socket error [${socket.id}]:`, err.message);
    });
  });

  console.log('🔴 Socket.IO initialized');
  return io;
};

const getIo = () => io;

module.exports = { initSocket, getIo };
