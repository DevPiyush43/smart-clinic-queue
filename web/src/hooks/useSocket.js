import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import useQueueStore from '../store/queueStore';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socketInstance = null;

const useSocket = (clinicId) => {
  const socketRef = useRef(null);
  const { token } = useAuthStore();
  const { updateFromSocket } = useQueueStore();

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      auth: { token: token || undefined },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;
    socketInstance = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      if (clinicId) {
        socket.emit('JOIN_CLINIC', { clinicId }, (ack) => {
          console.log('📍 Joined clinic room:', ack);
        });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    socket.on('QUEUE_UPDATED', (payload) => {
      updateFromSocket(payload);
    });

    socket.on('PATIENT_CALLED', (payload) => {
      toast.success(`🎉 It's your turn! Token ${payload.displayToken}`, {
        duration: 8000,
        id: 'your_turn',
      });
      // Play chime
      try {
        const audio = new Audio('/sounds/chime.mp3');
        audio.play().catch(() => {});
      } catch (e) {}
    });

    socket.on('HEADS_UP', (payload) => {
      toast(`📡 ${payload.message}`, {
        duration: 6000,
        icon: '📡',
        id: 'heads_up',
      });
    });

    socket.on('SESSION_CLOSED', () => {
      toast("ℹ️ Today's queue is now closed.", { duration: 5000 });
    });

    socket.on('ERROR', (err) => {
      console.error('Socket error:', err);
    });

    return socket;
  }, [clinicId, token, updateFromSocket]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  const requestRefresh = useCallback(() => {
    if (clinicId) {
      socketRef.current?.emit('REQUEST_REFRESH', { clinicId });
    }
  }, [clinicId]);

  return {
    socket: socketRef.current,
    emit,
    requestRefresh,
    isConnected: socketRef.current?.connected || false,
  };
};

export { socketInstance };
export default useSocket;
