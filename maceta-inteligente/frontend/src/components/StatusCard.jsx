// src/components/StatusCard.jsx
import styles from './StatusCard.module.css';

const STATUS_CONFIG = {
  healthy: {
    icon: '🌿',
    label: 'Saludable',
    desc: 'La planta tiene humedad óptima.',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.3)',
  },
  needs_water: {
    icon: '💧',
    label: 'Necesita Agua',
    desc: 'La humedad está bajando. Considera regar pronto.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.3)',
  },
  alert: {
    icon: '🚨',
    label: '¡Alerta Crítica!',
    desc: 'Humedad muy baja. ¡La planta necesita agua urgente!',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.3)',
  },
};

const StatusCard = ({ status, humidity, reading }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.healthy;

  return (
    <div
      className={styles.card}
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      <div className={styles.icon}>{cfg.icon}</div>
      <div className={styles.label} style={{ color: cfg.color }}>
        {cfg.label}
      </div>
      <p className={styles.desc}>{cfg.desc}</p>

      <div className={styles.details}>
        <div className={styles.detailRow}>
          <span className={styles.key}>Humedad</span>
          <span className={styles.val} style={{ color: cfg.color }}>
            {humidity !== null ? `${humidity}%` : '--'}
          </span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.key}>Umbral alerta</span>
          <span className={styles.val}>
            {reading?.alertThreshold ?? 30}%
          </span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.key}>Última lectura</span>
          <span className={styles.val}>
            {reading?.timestamp
              ? new Date(reading.timestamp).toLocaleTimeString('es-MX')
              : '--'}
          </span>
        </div>
      </div>

      {status === 'alert' && (
        <div className={styles.pulse}>
          <span />Alerta activa
        </div>
      )}
    </div>
  );
};

export default StatusCard;
