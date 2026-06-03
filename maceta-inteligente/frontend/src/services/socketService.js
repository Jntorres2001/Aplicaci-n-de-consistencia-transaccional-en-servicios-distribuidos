// src/services/socketService.js
// Singleton de Socket.IO — toda la app usa la misma conexión

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

/**
 * Instancia única del socket.
 * autoConnect: false → conectamos manualmente desde el contexto.
 */
const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
});

export default socket;
