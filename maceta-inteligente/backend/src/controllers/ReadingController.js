// src/controllers/ReadingController.js
// Principio SOLID: Single Responsibility — sólo maneja HTTP Request/Response

const ReadingService = require('../services/ReadingService');
const SensorSimulator = require('../services/SensorSimulator');

/**
 * ReadingController
 * =================
 * Recibe peticiones HTTP, delega la lógica al servicio y devuelve la respuesta.
 * No contiene lógica de negocio ni acceso directo a BD.
 */
class ReadingController {
  /**
   * GET /api/readings
   * Historial de lecturas recientes.
   */
  async getHistory(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      // Límite máximo para evitar consultas abusivas
      const safeLimit = Math.min(limit, 200);
      const readings = await ReadingService.getHistory(safeLimit);

      res.json({
        success: true,
        count: readings.length,
        data: readings,
      });
    } catch (error) {
      console.error('ReadingController.getHistory:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el historial de lecturas.',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/readings/latest
   * Última lectura del sensor.
   */
  async getLatest(req, res) {
    try {
      const reading = await ReadingService.getLatest();

      if (!reading) {
        return res.status(404).json({
          success: false,
          message: 'No hay lecturas registradas aún.',
        });
      }

      res.json({ success: true, data: reading });
    } catch (error) {
      console.error('ReadingController.getLatest:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la última lectura.',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/readings/stats
   * Estadísticas agregadas.
   */
  async getStats(req, res) {
    try {
      const stats = await ReadingService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('ReadingController.getStats:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas.',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/sensor/status
   * Estado actual del simulador ESP32.
   */
  getSensorStatus(req, res) {
    try {
      const state = SensorSimulator.getCurrentState();
      res.json({
        success: true,
        data: {
          ...state,
          connectedClients: SensorSimulator.io
            ? SensorSimulator.io.engine.clientsCount
            : 0,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener estado del sensor.',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/sensor/start
   * Inicia la simulación del sensor.
   */
  startSensor(req, res) {
    try {
      SensorSimulator.start();
      res.json({ success: true, message: 'Simulador iniciado.' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/sensor/stop
   * Detiene la simulación del sensor.
   */
  stopSensor(req, res) {
    try {
      SensorSimulator.stop();
      res.json({ success: true, message: 'Simulador detenido.' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ReadingController();
