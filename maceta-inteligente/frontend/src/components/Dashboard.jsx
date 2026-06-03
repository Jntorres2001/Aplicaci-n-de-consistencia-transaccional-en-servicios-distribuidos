// src/components/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import HumidityGauge from './HumidityGauge';
import HumidityChart from './HumidityChart';
import StatusCard from './StatusCard';
import AlertBanner from './AlertBanner';
import HistoryTable from './HistoryTable';
import StatsPanel from './StatsPanel';
import ConnectionStatus from './ConnectionStatus';
import { apiService } from '../services/apiService';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const {
    connected, connecting, connectedClients,
    currentReading, readingHistory,
    activeAlert, alerts, latency,
    dismissAlert
  } = useSocket();

  const [stats, setStats] = useState(null);
  const [sensorRunning, setSensorRunning] = useState(true);

  // Cargar stats desde REST API al montar
  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await apiService.getStats();
        setStats(res.data);
      } catch { /* silencioso */ }
    };
    loadStats();
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleSensor = async () => {
    try {
      if (sensorRunning) {
        await apiService.stopSensor();
      } else {
        await apiService.startSensor();
      }
      setSensorRunning(!sensorRunning);
    } catch (err) {
      console.error('Error al controlar sensor:', err.message);
    }
  };

  const humidity = currentReading?.humidity ?? null;
  const status = currentReading?.status ?? 'healthy';

  return (
    <div className={styles.layout}>
      {/* ─ Header ─ */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>🌱</span>
          <div>
            <h1 className={styles.title}>Maceta Inteligente</h1>
            <p className={styles.subtitle}>Sistema IoT Distribuido — Monitoreo en Tiempo Real</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <ConnectionStatus
            connected={connected}
            connecting={connecting}
            clients={connectedClients}
            latency={latency}
          />
          <button
            className={`${styles.sensorBtn} ${sensorRunning ? styles.btnStop : styles.btnStart}`}
            onClick={toggleSensor}
          >
            {sensorRunning ? '⏸ Pausar Sensor' : '▶ Iniciar Sensor'}
          </button>
        </div>
      </header>

      {/* ─ Alerta activa ─ */}
      {activeAlert && (
        <AlertBanner alert={activeAlert} onDismiss={dismissAlert} />
      )}

      {/* ─ Grid principal ─ */}
      <main className={styles.grid}>
        {/* Gauge grande */}
        <section className={`${styles.card} ${styles.gaugeCard}`}>
          <h2 className={styles.cardTitle}>Humedad Actual</h2>
          <HumidityGauge humidity={humidity} status={status} />
          <p className={styles.deviceTag}>
            📡 {currentReading?.deviceId || 'ESP32-SIM-001'}
          </p>
        </section>

        {/* Status card */}
        <section className={`${styles.card} ${styles.statusCard}`}>
          <h2 className={styles.cardTitle}>Estado de la Planta</h2>
          <StatusCard status={status} humidity={humidity} reading={currentReading} />
        </section>

        {/* Stats */}
        <section className={`${styles.card} ${styles.statsCard}`}>
          <h2 className={styles.cardTitle}>Estadísticas Globales</h2>
          <StatsPanel stats={stats} />
        </section>

        {/* Gráfico */}
        <section className={`${styles.card} ${styles.chartCard}`}>
          <h2 className={styles.cardTitle}>
            Historial de Humedad
            <span className={styles.liveTag}>● LIVE</span>
          </h2>
          <HumidityChart data={readingHistory} alertThreshold={currentReading?.alertThreshold} />
        </section>

        {/* Alertas recientes */}
        <section className={`${styles.card} ${styles.alertsCard}`}>
          <h2 className={styles.cardTitle}>Registro de Alertas</h2>
          <div className={styles.alertsList}>
            {alerts.length === 0 && (
              <p className={styles.empty}>Sin alertas registradas.</p>
            )}
            {alerts.map((a) => (
              <div key={a.id} className={`${styles.alertItem} ${styles[`alertItem_${a.type}`]}`}>
                <span className={styles.alertMsg}>{a.message}</span>
                {a.timestamp && (
                  <span className={styles.alertTime}>
                    {new Date(a.timestamp).toLocaleTimeString('es-MX')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Historial tabla */}
        <section className={`${styles.card} ${styles.historyCard}`}>
          <h2 className={styles.cardTitle}>Últimas Lecturas</h2>
          <HistoryTable readings={readingHistory} />
        </section>
      </main>

      <footer className={styles.footer}>
        Práctica Sistemas Distribuidos · WebSocket + REST API + MySQL · ESP32 Simulado
      </footer>
    </div>
  );
};

export default Dashboard;
