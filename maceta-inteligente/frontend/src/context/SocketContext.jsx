// src/context/SocketContext.jsx
// Context de React que gestiona el estado global del WebSocket y los datos del sensor
//
// CONSISTENCIA DISTRIBUIDA:
// Al usar un Context global, TODOS los componentes de la app React
// consumen exactamente los mismos datos al mismo tiempo.
// No hay inconsistencia entre componentes porque comparten una sola fuente de verdad.

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import socket from '../services/socketService';

const SocketContext = createContext(null);

const MAX_HISTORY = 30; // Lecturas mostradas en el gráfico

export const SocketProvider = ({ children }) => {
  // ── Estado del sistema ─────────────────────────────────────────────────────
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [connectedClients, setConnectedClients] = useState(0);

  // ── Datos del sensor ───────────────────────────────────────────────────────
  const [currentReading, setCurrentReading] = useState(null);
  const [readingHistory, setReadingHistory] = useState([]);
  const [stats, setStats] = useState(null);

  // ── Alertas ────────────────────────────────────────────────────────────────
  const [alerts, setAlerts] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const alertTimerRef = useRef(null);

  // ── Latencia ──────────────────────────────────────────────────────────────
  const [latency, setLatency] = useState(null);
  const pingRef = useRef(null);

  /**
   * Añade una alerta a la lista y la muestra brevemente en pantalla.
   */
  const pushAlert = useCallback((alert) => {
    const alertWithId = { ...alert, id: Date.now() };
    setAlerts((prev) => [alertWithId, ...prev].slice(0, 20));
    setActiveAlert(alertWithId);

    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    alertTimerRef.current = setTimeout(() => setActiveAlert(null), 5000);
  }, []);

  /**
   * Agrega una lectura al historial manteniendo el tamaño máximo.
   */
  const addToHistory = useCallback((reading) => {
    setReadingHistory((prev) => {
      const updated = [reading, ...prev];
      return updated.slice(0, MAX_HISTORY);
    });
  }, []);

  // ── Configuración de eventos Socket.IO ───────────────────────────────────
  useEffect(() => {
    // ─ Conexión ─
    socket.on('connect', () => {
      console.log('✅ WebSocket conectado:', socket.id);
      setConnected(true);
      setConnecting(false);
    });

    socket.on('disconnect', (reason) => {
      console.warn('❌ WebSocket desconectado:', reason);
      setConnected(false);
      if (reason !== 'io client disconnect') {
        setConnecting(true); // Intentará reconectar
      }
    });

    socket.on('connect_error', (err) => {
      console.error('🔴 Error de conexión WS:', err.message);
      setConnecting(true);
      setConnected(false);
    });

    socket.io.on('reconnect_attempt', () => setConnecting(true));
    socket.io.on('reconnect', () => {
      setConnected(true);
      setConnecting(false);
    });

    // ─ Estado inicial (al conectarse) ─
    socket.on('sensor:init', (data) => {
      if (data.currentState) {
        setCurrentReading(data.currentState);
      }
      if (data.recentReadings?.length) {
        setReadingHistory(data.recentReadings.slice(0, MAX_HISTORY));
      }
      setConnectedClients(data.connectedClients || 1);
    });

    // ─ Nueva lectura del sensor (broadcast) ─
    // Este evento es el corazón del sistema: llega simultáneamente a todos
    // los clientes conectados, garantizando consistencia de vista.
    socket.on('sensor:reading', (reading) => {
      setCurrentReading(reading);
      addToHistory({
        id: reading.id,
        humidity: reading.humidity,
        status: reading.status,
        timestamp: reading.timestamp,
      });
    });

    // ─ Alerta de humedad baja ─
    socket.on('sensor:alert', (data) => {
      pushAlert({ type: 'danger', ...data });
    });

    // ─ Recuperación de alerta ─
    socket.on('sensor:recovery', (data) => {
      pushAlert({ type: 'success', ...data });
    });

    // ─ Número de clientes conectados ─
    socket.on('system:clients', (data) => {
      setConnectedClients(data.count);
    });

    // ─ Mensajes del sistema ─
    socket.on('system:info', (data) => {
      pushAlert({ type: 'info', message: data.message });
    });

    socket.on('system:error', (data) => {
      pushAlert({ type: 'error', message: data.message });
    });

    // ─ Pong para medir latencia ─
    socket.on('server:pong', (data) => {
      setLatency(Date.now() - data.timestamp);
    });

    // ─ Historial bajo demanda ─
    socket.on('sensor:history', (data) => {
      if (data.readings?.length) {
        setReadingHistory(data.readings.slice(0, MAX_HISTORY));
      }
    });

    // Conectar el socket
    socket.connect();

    // Medir latencia cada 10 segundos
    pingRef.current = setInterval(() => {
      if (socket.connected) {
        socket.emit('client:ping');
      }
    }, 10000);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('sensor:init');
      socket.off('sensor:reading');
      socket.off('sensor:alert');
      socket.off('sensor:recovery');
      socket.off('system:clients');
      socket.off('system:info');
      socket.off('system:error');
      socket.off('server:pong');
      socket.off('sensor:history');
      socket.disconnect();
      clearInterval(pingRef.current);
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    };
  }, [addToHistory, pushAlert]);

  const value = {
    connected,
    connecting,
    connectedClients,
    currentReading,
    readingHistory,
    stats,
    alerts,
    activeAlert,
    latency,
    dismissAlert: () => setActiveAlert(null),
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket debe usarse dentro de SocketProvider');
  return ctx;
};
