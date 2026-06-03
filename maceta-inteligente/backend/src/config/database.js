// src/config/database.js
// Principio SOLID: Single Responsibility - este módulo sólo gestiona la conexión a BD
const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Configuración del pool de conexiones MySQL.
 * Usar pool (en lugar de una sola conexión) permite manejar
 * múltiples peticiones concurrentes sin bloqueos — principio
 * clave en sistemas distribuidos con varios clientes simultáneos.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'maceta_inteligente',
  waitForConnections: true,
  // connectionLimit: máximo de conexiones simultáneas al pool
  connectionLimit: 10,
  // queueLimit: máximo de peticiones en cola (0 = ilimitado)
  queueLimit: 0,
  // Reconexión automática si se pierde la conexión
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

/**
 * Verifica que la conexión a la base de datos esté activa.
 * Se llama al iniciar el servidor para "fail fast" si hay problemas.
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente.');
    console.log(`   Host: ${process.env.DB_HOST} | DB: ${process.env.DB_NAME}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error.message);
    return false;
  }
};

module.exports = { pool, testConnection };
