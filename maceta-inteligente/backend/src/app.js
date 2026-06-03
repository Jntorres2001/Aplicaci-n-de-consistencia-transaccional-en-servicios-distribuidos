// src/app.js
// Configuración de la aplicación Express (sin escuchar puerto aquí)

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
require('dotenv').config();

const app = express();

// ── Middlewares globales ───────────────────────────────────────────────────────

/**
 * CORS: permite peticiones desde el frontend React.
 * En producción restringir a dominios específicos.
 */
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Parsear JSON en el body de las peticiones
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger HTTP en desarrollo
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// ── Rutas API ─────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── Ruta raíz informativa ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    service: '🌱 Maceta Inteligente API',
    version: '1.0.0',
    status: 'online',
    docs: '/api/health',
    websocket: 'Socket.IO en el mismo puerto',
  });
});

// ── Manejo de errores (deben ir al final) ─────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
