// src/components/StatsPanel.jsx
import styles from './StatsPanel.module.css';

const Stat = ({ label, value, color }) => (
  <div className={styles.stat}>
    <span className={styles.statVal} style={color ? { color } : {}}>
      {value ?? '—'}
    </span>
    <span className={styles.statLbl}>{label}</span>
  </div>
);

const StatsPanel = ({ stats }) => {
  if (!stats) {
    return <p className={styles.loading}>Cargando estadísticas...</p>;
  }

  return (
    <div className={styles.grid}>
      <Stat label="Total lecturas"  value={stats.total_readings} />
      <Stat label="Promedio hum."   value={`${stats.avg_humidity}%`} color="#3b82f6" />
      <Stat label="Máxima"          value={`${stats.max_humidity}%`} color="#22c55e" />
      <Stat label="Mínima"          value={`${stats.min_humidity}%`} color="#f59e0b" />
      <Stat label="Total alertas"   value={stats.total_alerts}       color="#ef4444" />
    </div>
  );
};

export default StatsPanel;
