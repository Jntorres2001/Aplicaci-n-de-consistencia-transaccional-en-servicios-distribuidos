// src/components/HumidityChart.jsx
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const h = payload[0]?.value;
  const color = h < 30 ? '#ef4444' : h < 60 ? '#f59e0b' : '#22c55e';
  return (
    <div style={{
      background: '#111827', border: '1px solid #1e2d45',
      borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem'
    }}>
      <p style={{ color: '#64748b', marginBottom: 4 }}>{label}</p>
      <p style={{ color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
        {h?.toFixed(1)}%
      </p>
    </div>
  );
};

const HumidityChart = ({ data = [], alertThreshold = 30 }) => {
  // Preparar datos para el gráfico (invertir para orden cronológico)
  const chartData = [...data]
    .reverse()
    .map((r) => ({
      time: r.timestamp
        ? new Date(r.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '--',
      humidity: typeof r.humidity === 'number' ? r.humidity : parseFloat(r.humidity),
    }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" />
        <XAxis
          dataKey="time"
          tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#64748b', fontSize: 10 }}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={alertThreshold}
          stroke="#ef4444"
          strokeDasharray="4 3"
          label={{ value: `Alerta ${alertThreshold}%`, position: 'insideTopLeft', fill: '#ef4444', fontSize: 10 }}
        />
        <ReferenceLine
          y={60}
          stroke="#22c55e"
          strokeDasharray="4 3"
          label={{ value: 'Saludable 60%', position: 'insideTopLeft', fill: '#22c55e', fontSize: 10 }}
        />
        <Area
          type="monotone"
          dataKey="humidity"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#humGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#3b82f6' }}
          name="Humedad"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default HumidityChart;
