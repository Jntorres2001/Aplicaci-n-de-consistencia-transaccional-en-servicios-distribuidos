// src/components/HumidityGauge.jsx
import styles from './HumidityGauge.module.css';

const getColor = (humidity, status) => {
  if (status === 'alert' || humidity < 30)      return '#ef4444';
  if (status === 'needs_water' || humidity < 60) return '#f59e0b';
  return '#22c55e';
};

const HumidityGauge = ({ humidity, status }) => {
  const value = humidity ?? 0;
  const color = getColor(value, status);

  // SVG arc gauge
  const radius = 80;
  const cx = 110, cy = 110;
  const startAngle = -210;
  const endAngle   = 30;
  const totalAngle = endAngle - startAngle; // 240°
  const fillAngle  = startAngle + (value / 100) * totalAngle;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const arcX  = (deg) => cx + radius * Math.cos(toRad(deg));
  const arcY  = (deg) => cy + radius * Math.sin(toRad(deg));

  const bgPath = `M ${arcX(startAngle)} ${arcY(startAngle)}
    A ${radius} ${radius} 0 1 1 ${arcX(endAngle)} ${arcY(endAngle)}`;

  const filledArc = value > 0
    ? `M ${arcX(startAngle)} ${arcY(startAngle)}
       A ${radius} ${radius} 0
       ${fillAngle - startAngle > 180 ? 1 : 0} 1
       ${arcX(fillAngle)} ${arcY(fillAngle)}`
    : '';

  const statusLabel = {
    healthy:    '✅ Saludable',
    needs_water:'⚠️ Necesita Agua',
    alert:      '🚨 Crítica',
  }[status] || '—';

  return (
    <div className={styles.wrapper}>
      <svg viewBox="0 0 220 180" className={styles.svg}>
        {/* Track */}
        <path d={bgPath} fill="none" stroke="#1e2d45" strokeWidth="14" strokeLinecap="round" />
        {/* Fill */}
        {filledArc && (
          <path
            d={filledArc}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color}80)`, transition: 'all 0.6s ease' }}
          />
        )}
        {/* Valor */}
        <text x={cx} y={cy + 10} textAnchor="middle"
          style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '2rem', fontWeight: 700, fill: color, transition: 'fill 0.4s' }}>
          {humidity !== null ? `${value.toFixed(1)}` : '--'}
        </text>
        <text x={cx} y={cy + 30} textAnchor="middle"
          style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.75rem', fill: '#64748b' }}>
          %
        </text>
        {/* Ticks mínimo/máximo */}
        <text x={arcX(startAngle) - 6} y={arcY(startAngle) + 4} textAnchor="middle"
          style={{ fontFamily: 'monospace', fontSize: '0.55rem', fill: '#64748b' }}>0</text>
        <text x={arcX(endAngle) + 6} y={arcY(endAngle) + 4} textAnchor="middle"
          style={{ fontFamily: 'monospace', fontSize: '0.55rem', fill: '#64748b' }}>100</text>
      </svg>

      <div className={styles.statusLabel} style={{ color }}>
        {statusLabel}
      </div>
    </div>
  );
};

export default HumidityGauge;
