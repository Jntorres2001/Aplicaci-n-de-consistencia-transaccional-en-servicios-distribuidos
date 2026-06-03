// src/routes/index.js
// Centraliza todas las rutas de la API REST

const express = require('express');
const router = express.Router();
const ReadingController = require('../controllers/ReadingController');

// ─── Health check ─────────────────────────────────────────────────────────────
/**
 * GET /api/health
 * Permite verificar que el servidor está activo (útil para frontends y proxies).
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Maceta Inteligente API v1.0',
  });
});

// ─── Lecturas del sensor ──────────────────────────────────────────────────────
/**
 * GET  /api/readings         → historial reciente (query param: ?limit=50)
 * GET  /api/readings/latest  → última lectura
 * GET  /api/readings/stats   → estadísticas agregadas
 */
router.get('/readings', ReadingController.getHistory.bind(ReadingController));
router.get('/readings/latest', ReadingController.getLatest.bind(ReadingController));
router.get('/readings/stats', ReadingController.getStats.bind(ReadingController));

// ─── Control del simulador ESP32 ─────────────────────────────────────────────
/**
 * GET  /api/sensor/status → estado actual del simulador
 * POST /api/sensor/start  → iniciar simulación
 * POST /api/sensor/stop   → detener simulación
 */
router.get('/sensor/status', ReadingController.getSensorStatus.bind(ReadingController));
router.post('/sensor/start', ReadingController.startSensor.bind(ReadingController));
router.post('/sensor/stop', ReadingController.stopSensor.bind(ReadingController));

module.exports = router;
