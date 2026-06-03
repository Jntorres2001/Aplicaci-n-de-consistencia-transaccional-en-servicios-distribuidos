// src/server.js
// Punto de entrada del servidor — integra Express + Socket.IO + Simulador

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { testConnection } = require('./config/database');
const { setupSocketHandlers } = require('./socket/socketHandler');
const SensorSimulator = require('./services/SensorSimulator');
const ReadingService = require('./services/ReadingService');
require('dotenv').config();

const PORT = parseInt(process.env.PORT) || 3001;

// ── 1. Crear servidor HTTP a partir de Express ─────────────────────────────────
// Socket.IO necesita el servidor HTTP subyacente (no el objeto Express)
const httpServer = http.createServer(app);

// ── 2. Configurar Socket.IO ───────────────────────────────────────────────────
/**
 * WEBSOCKET / Socket.IO
 * =====================
 * Socket.IO envuelve WebSocket con fallbacks (long-polling) y gestión automática
 * de reconexión. Todos los clientes se conectan a este servidor WS.
 *
 * Diseño para múltiples usuarios:
 * - io.emit() → broadcast a TODOS los clientes simultáneamente
 * - socket.emit() → solo al cliente específico
 * - Garantiza que todos ven los mismos datos (consistencia de vista)
 */
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Configuración de reconexión del servidor
  pingTimeout: 10000,
  pingInterval: 5000,
  transports: ['websocket', 'polling'], // WebSocket preferido, polling como fallback
});

// ── 3. Registrar handlers de Socket.IO ───────────────────────────────────────
setupSocketHandlers(io);

// ── 4. Inyectar dependencias al simulador ─────────────────────────────────────
// Principio DI: el simulador no crea io ni ReadingService, los recibe
SensorSimulator.init(io, ReadingService);

// ── 5. Arranque del servidor ──────────────────────────────────────────────────
const startServer = async () => {
  console.log('\n🌱 ============================================');
  console.log('   MACETA INTELIGENTE — Sistema IoT Simulado');
  console.log('   Práctica Sistemas Distribuidos');
  console.log('==============================================\n');

  // Verificar conexión a la base de datos antes de arrancar
  const dbConnected = await testConnection();

  if (!dbConnected) {
    console.error('⛔ No se puede iniciar: falla de conexión a MySQL.');
    console.error('   Verifica tu .env y que MySQL esté corriendo.');
    process.exit(1); // Fail fast: no tiene sentido correr sin BD
  }

  // Iniciar el servidor HTTP (Express + Socket.IO en el mismo puerto)
  httpServer.listen(PORT, () => {
    console.log(`\n🚀 Servidor HTTP  → http://localhost:${PORT}`);
    console.log(`🔗 API REST       → http://localhost:${PORT}/api`);
    console.log(`📡 WebSocket      → ws://localhost:${PORT}`);
    console.log(`🌿 Entorno        → ${process.env.NODE_ENV || 'development'}\n`);

    // Iniciar simulación del sensor después de que el servidor esté listo
    SensorSimulator.start();
  });

  // ── Manejo de cierre graceful ──────────────────────────────────────────────
  // Asegura que las conexiones activas se cierren ordenadamente
  const gracefulShutdown = (signal) => {
    console.log(`\n⚠️  Señal ${signal} recibida. Cerrando servidor...`);
    SensorSimulator.stop();

    httpServer.close(() => {
      console.log('✅ Servidor HTTP cerrado.');
      process.exit(0);
    });

    // Forzar cierre si tarda demasiado
    setTimeout(() => {
      console.error('❌ Timeout de cierre. Forzando salida.');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Errores no capturados — log y continuar (no caer en producción)
  process.on('unhandledRejection', (reason) => {
    console.error('❌ Promise no manejada:', reason);
  });
  process.on('uncaughtException', (error) => {
    console.error('❌ Excepción no capturada:', error.message);
  });
};

startServer();
