// src/services/ReadingService.js
// Principio SOLID:
//   - Single Responsibility: lógica de negocio de lecturas
//   - Open/Closed: puede extenderse (validaciones, notificaciones) sin tocar el modelo
//   - Dependency Inversion: depende de la abstracción ReadingModel, no de MySQL directamente

const ReadingModel = require('../models/ReadingModel');

/**
 * ReadingService
 * ==============
 * Capa de servicio que implementa la lógica de negocio relacionada
 * con las lecturas del sensor. El controller sólo llama a este servicio;
 * el servicio llama al modelo. Esto respeta la separación de capas.
 */
class ReadingService {
  /**
   * Guarda una nueva lectura del sensor.
   * Aquí podría validarse, enriquecerse o notificarse antes de persistir.
   * @param {Object} data - { humidity, status, deviceId }
   */
  async saveReading(data) {
    // Validación básica de datos
    if (typeof data.humidity !== 'number' || isNaN(data.humidity)) {
      throw new Error('Valor de humedad inválido.');
    }
    if (data.humidity < 0 || data.humidity > 100) {
      throw new Error('La humedad debe estar entre 0 y 100.');
    }

    return await ReadingModel.create(data);
  }

  /**
   * Obtiene el historial reciente de lecturas.
   * @param {number} limit - Máximo de registros
   */
  async getHistory(limit = 50) {
    const readings = await ReadingModel.findRecent(limit);
    // Transformar para el frontend (camelCase)
    return readings.map(this._formatReading);
  }

  /**
   * Obtiene estadísticas agregadas del sistema.
   */
  async getStats() {
    return await ReadingModel.getStats();
  }

  /**
   * Obtiene la última lectura disponible.
   */
  async getLatest() {
    const reading = await ReadingModel.findLatest();
    return reading ? this._formatReading(reading) : null;
  }

  /**
   * Limpia registros antiguos de la BD.
   */
  async cleanup() {
    await ReadingModel.cleanup();
  }

  /**
   * Transforma snake_case de BD a camelCase para el frontend.
   * @private
   */
  _formatReading(row) {
    return {
      id: row.id,
      humidity: parseFloat(row.humidity),
      status: row.status,
      deviceId: row.device_id,
      timestamp: row.recorded_at,
    };
  }
}

module.exports = new ReadingService();
