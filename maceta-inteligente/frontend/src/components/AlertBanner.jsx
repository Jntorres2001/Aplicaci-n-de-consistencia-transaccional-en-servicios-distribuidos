// src/components/AlertBanner.jsx
import styles from './AlertBanner.module.css';

const COLORS = {
  danger:  { bg: 'rgba(239,68,68,0.12)',  border: '#ef4444', text: '#fca5a5' },
  success: { bg: 'rgba(34,197,94,0.1)',   border: '#22c55e', text: '#86efac' },
  info:    { bg: 'rgba(59,130,246,0.1)',  border: '#3b82f6', text: '#93c5fd' },
  error:   { bg: 'rgba(249,115,22,0.1)',  border: '#f97316', text: '#fdba74' },
};

const AlertBanner = ({ alert, onDismiss }) => {
  const c = COLORS[alert?.type] || COLORS.info;

  return (
    <div
      className={styles.banner}
      style={{ background: c.bg, borderColor: c.border, color: c.text }}
    >
      <span className={styles.msg}>{alert?.message}</span>
      <button
        className={styles.close}
        style={{ color: c.text }}
        onClick={onDismiss}
        aria-label="Cerrar alerta"
      >
        ✕
      </button>
    </div>
  );
};

export default AlertBanner;
