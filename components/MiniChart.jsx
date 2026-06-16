// components/MiniChart.jsx
// Lightweight SVG line/area chart — no external dependencies

const MiniChart = ({ data, dataKey, color = '#00e5c3', height = 180, label = '', unit = '' }) => {
  if (!data || data.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Not enough data yet</p>
      </div>
    );
  }

  const W = 600;
  const H = height;
  const PAD = { top: 12, right: 8, bottom: 28, left: 40 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top  - PAD.bottom;

  const values = data.map(d => d[dataKey]).filter(v => v != null && !isNaN(v));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const toX = (i) => PAD.left + (i / (data.length - 1)) * innerW;
  const toY = (v) => PAD.top  + innerH - ((v - min) / range) * innerH;

  // Build path
  const points = data
    .map((d, i) => d[dataKey] != null ? `${toX(i)},${toY(d[dataKey])}` : null)
    .filter(Boolean);

  const linePath  = 'M ' + points.join(' L ');
  const areaPath  = linePath
    + ` L ${toX(data.length - 1)},${PAD.top + innerH}`
    + ` L ${toX(0)},${PAD.top + innerH} Z`;

  // Y axis ticks (3 ticks)
  const yTicks = [min, min + range / 2, max].map(v => ({
    v: Math.round(v * 10) / 10,
    y: toY(v),
  }));

  // X axis labels (show ~4 evenly)
  const xStep = Math.max(1, Math.floor(data.length / 4));
  const xLabels = data
    .map((d, i) => ({ label: d.date, x: toX(i), i }))
    .filter((_, i) => i % xStep === 0 || i === data.length - 1);

  const gradId = `g_${dataKey}_${color.replace('#', '')}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height, display: 'block' }}
      aria-label={label}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yTicks.map(({ y }, i) => (
        <line key={i} x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y}
              stroke="#2e3248" strokeWidth="1" strokeDasharray="3 4" />
      ))}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradId})`} />

      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {/* Dots at each data point */}
      {data.map((d, i) => d[dataKey] != null && (
        <circle key={i} cx={toX(i)} cy={toY(d[dataKey])} r="3"
                fill={color} stroke="var(--surface)" strokeWidth="1.5" />
      ))}

      {/* Y axis labels */}
      {yTicks.map(({ v, y }, i) => (
        <text key={i} x={PAD.left - 6} y={y + 4}
              textAnchor="end" fill="#7a80a0" fontSize="10">
          {v}{unit}
        </text>
      ))}

      {/* X axis labels */}
      {xLabels.map(({ label, x }, i) => (
        <text key={i} x={x} y={H - 6}
              textAnchor="middle" fill="#7a80a0" fontSize="10">
          {label}
        </text>
      ))}
    </svg>
  );
};

window.MiniChart = MiniChart;
