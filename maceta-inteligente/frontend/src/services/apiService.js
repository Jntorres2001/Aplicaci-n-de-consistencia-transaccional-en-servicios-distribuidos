// src/services/apiService.js
// Capa de acceso a la REST API del backend

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor de errores
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Error de red';
    return Promise.reject(new Error(message));
  }
);

export const apiService = {
  getHealth: () => api.get('/health'),
  getHistory: (limit = 50) => api.get(`/readings?limit=${limit}`),
  getLatest: () => api.get('/readings/latest'),
  getStats: () => api.get('/readings/stats'),
  getSensorStatus: () => api.get('/sensor/status'),
  startSensor: () => api.post('/sensor/start'),
  stopSensor: () => api.post('/sensor/stop'),
};

export default apiService;
