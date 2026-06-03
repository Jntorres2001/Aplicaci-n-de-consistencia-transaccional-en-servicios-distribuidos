// src/socket/socketHandler.js
// Maneja todos los eventos de WebSocket con Socket.IO
//
// CONCURRENCIA Y CONSISTENCIA:
// Socket.IO mantiene una sala (room) global. Cuando el simulador emite
// un evento con io.emit(), TODOS los clientes conectados reciben
// EXACTAMENTE el mismo payload en ese instante. Esto garantiza
// consistencia de vista (todos ven lo mismo) sin importar cuántos
// clientes estén conectados.

const ReadingService = require('../services/ReadingService');
const SensorSimulator = require('../services/SensorSimulator');

/**
 * Configura todos los listeners del servidor WebSocket.
 * @param {import('socket.io').Server} io
 */
const setupSocketHandlers = (io) => {
  io.on('connection', async (socket) => {
    const clientIp = socket.handshake.address;
    const clientId = socket.id.substring(0, 8);
    console.log(`🔌 Cliente conectado: ${clientId} (${clientIp})`);

    // ── 1. Emitir estado inicial al nuevo cliente ──────────────────────────
    // Cuando un cliente se conecta, inmediatamente recibe el estado actual
    // del sensor y las últimas lecturas. Esto evita la "pantalla en blanco"
    // y mantiene coherencia con los demás clientes.
    try {
      const currentState = SensorSimulator.getCurrentState();
      const recentReadings = await ReadingService.getHistory(20);

      // Estado actual del sensor
      socket.emit('sensor:init', {
        currentState,
        recentReadings,
        connectedClients: io.engine.clientsCount,
        serverTime: new Date().toISOString(),
      });

      // Notificar a TODOS que hay un nuevo cliente conectado
      io.emit('system:clients', {
        count: io.engine.clientsCount,
        message: `Cliente #${clientId} conectado`,
      });
    } catch (error) {
      console.error('Error al enviar estado inicial:', error.message);
      socket.emit('system:error', {
        message: 'Error al cargar estado inicial. Reintentando...',
      });
    }

    // ── 2. El cliente solicita el historial manualmente ────────────────────
    socket.on('client:requestHistory', async (data) => {
      try {
        const limit = data?.limit || 30;
        const readings = await ReadingService.getHistory(limit);
        socket.emit('sensor:history', { readings });
      } catch (error) {
        socket.emit('system:error', { message: 'Error al obtener historial.' });
      }
    });

    // ── 3. El cliente solicita control del simulador ───────────────────────
    socket.on('client:startSimulator', () => {
      if (!SensorSimulator.isRunning) {
        SensorSimulator.start();
        io.emit('system:info', { message: '▶️ Simulador iniciado por un cliente.' });
      }
    });

    socket.on('client:stopSimulator', () => {
      if (SensorSimulator.isRunning) {
        SensorSimulator.stop();
        io.emit('system:info', { message: '⏸️ Simulador detenido por un cliente.' });
      }
    });

    // ── 4. Ping/Pong para medir latencia ──────────────────────────────────
    socket.on('client:ping', () => {
      socket.emit('server:pong', { timestamp: Date.now() });
    });

    // ── 5. Desconexión ────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Cliente desconectado: ${clientId} | Razón: ${reason}`);
      // Notificar a los clientes restantes
      io.emit('system:clients', {
        count: io.engine.clientsCount,
        message: `Cliente #${clientId} desconectado`,
      });
    });

    // ── 6. Manejo de errores del socket ───────────────────────────────────
    socket.on('error', (err) => {
      console.error(`❌ Error en socket ${clientId}:`, err.message);
    });
  });

  console.log('🔗 Handlers de Socket.IO configurados.');
};

module.exports = { setupSocketHandlers };
