// src/models/ReadingModel.js
// Principio SOLID: Single Responsibility — sólo acceso a datos de lecturas
const { pool } = require('../config/database');

/**
 * Modelo de datos para las lecturas del sensor de humedad.
 *
 * CONSISTENCIA TRANSACCIONAL:
 * Todas las escrituras usan transacciones MySQL explícitas (BEGIN / COMMIT / ROLLBACK)
 * para garantizar que una lectura se guarda completa o no se guarda.
 * Esto evita registros a medias en escenarios de alta concurrencia.
 */
class ReadingModel {
  /**
   * Inserta una nueva lectura del sensor en la base de datos.
   * Usa transacción explícita para garantizar atomicidad.
   * @param {Object} data - { humidity, status, deviceId }
   * @returns {Promise<Object>} - Lectura insertada con su id generado
   */
  static async create(data) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        `INSERT INTO readings (humidity, status, device_id, recorded_at)
         VALUES (?, ?, ?, NOW())`,
        [data.humidity, data.status, data.deviceId || 'ESP32-SIM-001']
      );

      // Recuperamos el registro recién insertado para devolverlo completo
      const [rows] = await connection.execute(
        'SELECT * FROM readings WHERE id = ?',
        [result.insertId]
      );

      await connection.commit();
      return rows[0];
    } catch (error) {
      await connection.rollback();
      throw new Error(`ReadingModel.create: ${error.message}`);
    } finally {
      // SIEMPRE liberar la conexión al pool — evita agotamiento de conexiones
      connection.release();
    }
  }

  /**
   * Obtiene las últimas N lecturas, ordenadas de más reciente a más antigua.
   * @param {number} limit - Cantidad de registros a retornar (default 50)
   */
static async findRecent(limit = 50) {
  try {
    const safeLimit = Number(limit) || 50;

    const [rows] = await pool.execute(
      `SELECT * FROM readings
       ORDER BY recorded_at DESC
       LIMIT ${safeLimit}`
    );

    return rows;
  } catch (error) {
    throw new Error(`ReadingModel.findRecent: ${error.message}`);
  }
}

  /**
   * Obtiene el total de lecturas y estadísticas resumidas.
   */
  static async getStats() {
    try {
      const [rows] = await pool.execute(
        `SELECT
           COUNT(*)            AS total_readings,
           ROUND(AVG(humidity), 2) AS avg_humidity,
           MAX(humidity)       AS max_humidity,
           MIN(humidity)       AS min_humidity,
           SUM(CASE WHEN status = 'alert' THEN 1 ELSE 0 END) AS total_alerts
         FROM readings`
      );
      return rows[0];
    } catch (error) {
      throw new Error(`ReadingModel.getStats: ${error.message}`);
    }
  }

  /**
   * Obtiene la lectura más reciente.
   */
  static async findLatest() {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM readings ORDER BY recorded_at DESC LIMIT 1'
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`ReadingModel.findLatest: ${error.message}`);
    }
  }

  /**
   * Elimina lecturas antiguas para no saturar la BD (paginación/limpieza).
   * Conserva solo los últimos 1000 registros.
   */
  static async cleanup() {
    try {
      await pool.execute(
        `DELETE FROM readings
         WHERE id NOT IN (
           SELECT id FROM (
             SELECT id FROM readings ORDER BY recorded_at DESC LIMIT 1000
           ) AS keep
         )`
      );
    } catch (error) {
      throw new Error(`ReadingModel.cleanup: ${error.message}`);
    }
  }
}

module.exports = ReadingModel;
