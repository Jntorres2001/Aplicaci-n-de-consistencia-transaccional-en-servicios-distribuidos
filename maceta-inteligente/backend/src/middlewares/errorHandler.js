// src/middlewares/errorHandler.js
// Principio SOLID: Single Responsibility — sólo manejo de errores HTTP

/**
 * Middleware global de manejo de errores para Express.
 * Captura cualquier error no manejado en los controladores/rutas
 * y devuelve una respuesta estructurada en lugar de crashear el servidor.
 *
 * TOLERANCIA A FALLOS (CAP):
 * Este middleware asegura que el servidor siga disponible (A - Availability)
 * incluso cuando ocurren errores individuales en peticiones.
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV === 'development';

  console.error(`❌ [${new Date().toISOString()}] ${req.method} ${req.path}:`, err.message);

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: err.message || 'Error interno del servidor.',
    // Solo incluir stack trace en desarrollo
    ...(isDev && { stack: err.stack }),
    path: req.path,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Middleware para rutas no encontradas (404).
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    status: 404,
    message: `Ruta no encontrada: ${req.method} ${req.path}`,
    timestamp: new Date().toISOString(),
  });
};

module.exports = { errorHandler, notFound };
