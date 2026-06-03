// src/components/HistoryTable.jsx
import styles from './HistoryTable.module.css';

const STATUS_MAP = {
  healthy:    { label: 'Saludable',     color: '#22c55e' },
  needs_water:{ label: 'Necesita Agua', color: '#f59e0b' },
  alert:      { label: '🚨 Alerta',     color: '#ef4444' },
};

const HistoryTable = ({ readings = [] }) => {
  if (!readings.length) {
    return <p className={styles.empty}>Esperando lecturas del sensor...</p>;
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Timestamp</th>
            <th>Humedad</th>
            <th>Estado</th>
            <th>Dispositivo</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((r, i) => {
            const s = STATUS_MAP[r.status] || STATUS_MAP.healthy;
            return (
              <tr key={r.id || i} className={r.status === 'alert' ? styles.alertRow : ''}>
                <td className={styles.idx}>{i + 1}</td>
                <td className={styles.mono}>
                  {r.timestamp
                    ? new Date(r.timestamp).toLocaleString('es-MX', {
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                        day: '2-digit', month: '2-digit',
                      })
                    : '--'}
                </td>
                <td className={styles.mono} style={{ color: s.color }}>
                  {typeof r.humidity === 'number'
                    ? `${r.humidity.toFixed(1)}%`
                    : '--'}
                </td>
                <td>
                  <span className={styles.badge} style={{ color: s.color, borderColor: s.color + '40', background: s.color + '15' }}>
                    {s.label}
                  </span>
                </td>
                <td className={`${styles.mono} ${styles.device}`}>
                  {r.deviceId || 'ESP32-SIM-001'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default HistoryTable;
