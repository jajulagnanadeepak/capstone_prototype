export function Sparkline({
  data,
  color = '#22d3ee',
  height = 40,
  width = 120,
  fill = true,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  fill?: boolean;
}) {
  if (data.length < 2) return <svg width={width} height={height} />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((d, i) => `${i * step},${height - ((d - min) / range) * (height - 4) - 2}`);
  const path = 'M' + points.join(' L');
  const areaPath = path + ` L${width},${height} L0,${height} Z`;
  const id = 'sl-' + Math.random().toString(36).slice(2, 8);
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={areaPath} fill={`url(#${id})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function AreaChart({
  data,
  color = '#22d3ee',
  height = 200,
  label,
  unit = '',
}: {
  data: number[];
  color?: string;
  height?: number;
  label?: string;
  unit?: string;
}) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center text-sm text-slate-600" style={{ height }}>
        Collecting data…
      </div>
    );
  }
  const width = 800;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((d, i) => `${i * step},${height - ((d - min) / range) * (height - 20) - 10}`);
  const path = 'M' + points.join(' L');
  const areaPath = path + ` L${width},${height} L0,${height} Z`;
  const id = 'ac-' + Math.random().toString(36).slice(2, 8);

  return (
    <div className="w-full">
      {label && (
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>{label}</span>
          <span className="tabular text-slate-400">
            {data[data.length - 1].toFixed(2)}
            {unit}
          </span>
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((p) => (
          <line key={p} x1="0" y1={height * p} x2={width} y2={height * p} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}
        <path d={areaPath} fill={`url(#${id})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function MultiAreaChart({
  series,
  height = 220,
}: {
  series: { name: string; data: number[]; color: string }[];
  height?: number;
}) {
  const width = 800;
  const allData = series.flatMap((s) => s.data);
  if (allData.length < 2) {
    return (
      <div className="flex items-center justify-center text-sm text-slate-600" style={{ height }}>
        Collecting data…
      </div>
    );
  }
  const max = Math.max(...allData, 1);
  const min = 0;
  const range = max - min || 1;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        {[0.2, 0.4, 0.6, 0.8].map((p) => (
          <line key={p} x1="0" y1={height * p} x2={width} y2={height * p} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}
        {series.map((s) => {
          if (s.data.length < 2) return null;
          const step = width / (s.data.length - 1);
          const points = s.data.map((d, i) => `${i * step},${height - ((d - min) / range) * (height - 20) - 10}`);
          const path = 'M' + points.join(' L');
          const id = 'mc-' + s.name.replace(/\s/g, '');
          return (
            <g key={s.name}>
              <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={path + ` L${width},${height} L0,${height} Z`} fill={`url(#${id})`} />
              <path d={path} fill="none" stroke={s.color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-3">
        {series.map((s) => (
          <div key={s.name} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BarChart({
  data,
  labels,
  color = '#22d3ee',
  height = 180,
}: {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data, 1);
  return (
    <div className="w-full">
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
            <div
              className="w-full rounded-t transition-all duration-500"
              style={{
                height: `${(d / max) * (height - 24)}px`,
                background: `linear-gradient(to top, ${color}40, ${color})`,
                minHeight: '2px',
              }}
            />
            <span className="truncate text-[10px] text-slate-500">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Gauge({ value, max, label, unit, color = '#22d3ee' }: { value: number; max: number; label: string; unit?: string; color?: string }) {
  const pct = Math.min(1, value / max);
  const radius = 52;
  const circ = Math.PI * radius;
  const arc = circ * pct;
  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="80" viewBox="0 0 140 80">
        <path d="M 18 70 A 52 52 0 0 1 122 70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
        <path
          d="M 18 70 A 52 52 0 0 1 122 70"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circ}`}
          className="transition-all duration-700"
        />
        <text x="70" y="60" textAnchor="middle" className="tabular fill-slate-100 text-xl font-semibold">
          {value.toFixed(1)}
          {unit}
        </text>
      </svg>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}
