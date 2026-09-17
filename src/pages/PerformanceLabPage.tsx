import { useState } from 'react';
import { FlaskConical, Play, RotateCcw, CheckCircle2, XCircle, AlertCircle, Snowflake } from 'lucide-react';
import { engine } from '@/lib/engine';
import { useEngine } from '@/lib/useEngine';
import { Panel, Chip, ProgressBar } from '@/components/ui';
import { BarChart, Gauge } from '@/components/charts';
import { fmtMs, fmtPct, fmtCost, fmtNum, fmtInt } from '@/lib/format';
import { KpiResult } from '@/lib/types';
import { clsx } from '@/lib/clsx';

interface WorkloadConfig {
  eventsPerSecond: number;
  durationSec: number;
  payloadSize: number;
  concurrency: number;
  region: string;
}

export function PerformanceLabPage() {
  useEngine();
  const [config, setConfig] = useState<WorkloadConfig>({
    eventsPerSecond: 100,
    durationSec: 60,
    payloadSize: 2,
    concurrency: 50,
    region: 'us-east-1',
  });
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<KpiResult[] | null>(null);
  const [progress, setProgress] = useState(0);
  const [latencyHistogram, setLatencyHistogram] = useState<number[]>([]);
  const [coldStartPct, setColdStartPct] = useState(0);

  const runBenchmark = () => {
    if (running) return;
    setRunning(true);
    setResults(null);
    setProgress(0);

    let tick = 0;
    const totalTicks = 20;
    const interval = setInterval(() => {
      tick++;
      setProgress((tick / totalTicks) * 100);

      if (tick >= totalTicks) {
        clearInterval(interval);
        setRunning(false);

        // Generate results based on config
        const totalEvents = config.eventsPerSecond * config.durationSec;
        const baseLatency = 35 + (config.payloadSize - 2) * 8 + Math.random() * 10;
        const p50 = baseLatency + Math.random() * 5;
        const p95 = baseLatency * 1.8 + Math.random() * 15;
        const p99 = baseLatency * 2.5 + Math.random() * 30;
        const errorRate = Math.random() * 1.2;
        const costPerEvent = 0.0000182 + (config.payloadSize * 0.0000012);
        const coldStart = config.concurrency < 100 ? Math.random() * 4 : Math.random() * 8;

        setLatencyHistogram([
          Math.round(p50 * 0.4),
          Math.round(p50 * 0.7),
          Math.round(p50),
          Math.round(p95 * 0.8),
          Math.round(p95),
          Math.round(p99 * 0.85),
          Math.round(p99),
          Math.round(p99 * 1.2),
        ]);
        setColdStartPct(coldStart);

        setResults([
          { metric: 'Throughput', target: config.eventsPerSecond, actual: Math.round(config.eventsPerSecond * (0.95 + Math.random() * 0.08)), unit: 'ev/s', status: 'pass' },
          { metric: 'p50 Latency', target: 50, actual: Math.round(p50), unit: 'ms', status: p50 < 50 ? 'pass' : 'warn' },
          { metric: 'p95 Latency', target: 100, actual: Math.round(p95), unit: 'ms', status: p95 < 100 ? 'pass' : 'warn' },
          { metric: 'p99 Latency', target: 200, actual: Math.round(p99), unit: 'ms', status: p99 < 200 ? 'pass' : 'fail' },
          { metric: 'Error Rate', target: 1, actual: Math.round(errorRate * 100) / 100, unit: '%', status: errorRate < 1 ? 'pass' : 'warn' },
          { metric: 'Cost / Event', target: 0.00003, actual: Math.round(costPerEvent * 1000000) / 1000000, unit: '$', status: costPerEvent < 0.00003 ? 'pass' : 'warn' },
          { metric: 'Cold Start Rate', target: 5, actual: Math.round(coldStart * 100) / 100, unit: '%', status: coldStart < 5 ? 'pass' : 'warn' },
          { metric: 'Total Events', target: totalEvents, actual: totalEvents, unit: 'ev', status: 'pass' },
        ]);
      }
    }, 150);
  };

  return (
    <div className="space-y-4">
      {/* Config */}
      <Panel title="Workload Configuration" icon={<FlaskConical size={16} className="text-accent-400" />}>
        <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-5">
          <ConfigSlider label="Events / second" value={config.eventsPerSecond} min={10} max={500} step={10} onChange={(v) => setConfig({ ...config, eventsPerSecond: v })} />
          <ConfigSlider label="Duration (s)" value={config.durationSec} min={10} max={300} step={10} onChange={(v) => setConfig({ ...config, durationSec: v })} />
          <ConfigSlider label="Payload size (KB)" value={config.payloadSize} min={1} max={16} step={1} onChange={(v) => setConfig({ ...config, payloadSize: v })} />
          <ConfigSlider label="Concurrency" value={config.concurrency} min={10} max={500} step={10} onChange={(v) => setConfig({ ...config, concurrency: v })} />
          <div>
            <label className="mb-1.5 block text-xs text-slate-500">Region</label>
            <select
              value={config.region}
              onChange={(ev) => setConfig({ ...config, region: ev.target.value })}
              className="w-full rounded-lg border border-base-700 bg-base-900/60 px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent-500/50"
            >
              <option value="us-east-1">us-east-1</option>
              <option value="eu-west-1">eu-west-1</option>
              <option value="ap-southeast-2">ap-southeast-2</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-base-700/50 px-4 py-3">
          <button onClick={runBenchmark} disabled={running} className={clsx('btn', running ? 'btn-outline opacity-50' : 'btn-primary')}>
            {running ? <RotateCcw size={14} className="animate-spin" /> : <Play size={14} />}
            {running ? 'Running…' : 'Run Benchmark'}
          </button>
          <span className="text-xs text-slate-500">
            {config.eventsPerSecond * config.durationSec} events · {config.durationSec}s · {config.region}
          </span>
          {running && (
            <div className="ml-auto flex items-center gap-2">
              <ProgressBar value={progress} max={100} />
              <span className="tabular text-xs text-slate-400">{Math.round(progress)}%</span>
            </div>
          )}
        </div>
      </Panel>

      {/* Results */}
      {results && (
        <div className="space-y-4 animate-fade-in">
          {/* KPI table */}
          <Panel title="KPI Results" icon={<CheckCircle2 size={16} className="text-accent-400" />}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-base-700/60 text-left text-xs text-slate-500">
                    <th className="px-4 py-2.5 font-medium">Metric</th>
                    <th className="px-4 py-2.5 font-medium">Target</th>
                    <th className="px-4 py-2.5 font-medium">Actual</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.metric} className="border-t border-base-700/30">
                      <td className="px-4 py-2.5 font-medium text-slate-200">{r.metric}</td>
                      <td className="px-4 py-2.5 tabular text-slate-400">
                        {r.unit === '$' ? fmtCost(r.target) : r.unit === '%' ? r.target + '%' : r.unit === 'ms' ? fmtMs(r.target) : fmtInt(r.target)}
                      </td>
                      <td className="px-4 py-2.5 tabular text-slate-200">
                        {r.unit === '$' ? fmtCost(r.actual) : r.unit === '%' ? r.actual + '%' : r.unit === 'ms' ? fmtMs(r.actual) : fmtInt(r.actual)}
                      </td>
                      <td className="px-4 py-2.5">
                        <KpiStatusChip status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Visual results */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Latency Distribution" icon={<FlaskConical size={16} className="text-accent-400" />}>
              <div className="p-4">
                <BarChart
                  data={latencyHistogram}
                  labels={['p10', 'p25', 'p50', 'p75', 'p90', 'p95', 'p99', 'p99.9']}
                  color="#22d3ee"
                  height={160}
                />
              </div>
            </Panel>

            <Panel title="Performance Gauges" icon={<CheckCircle2 size={16} className="text-accent-400" />}>
              <div className="grid grid-cols-2 place-items-center p-4">
                <Gauge value={results[0].actual} max={results[0].target * 1.5} label="Throughput" unit="" color="#22d3ee" />
                <Gauge value={results[2].actual} max={200} label="p95 (ms)" unit="" color="#34d399" />
              </div>
            </Panel>

            <Panel title="Cold Start Analysis" icon={<Snowflake size={16} className="text-accent-400" />}>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 place-items-center">
                  <Gauge value={coldStartPct} max={10} label="Cold Start %" unit="" color="#fbbf24" />
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Init duration</span>
                    <span className="tabular text-slate-300">{fmtMs(180 + Math.random() * 120)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Warm hits</span>
                    <span className="tabular text-ok-400">{fmtPct(100 - coldStartPct)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Provisioned concurrency</span>
                    <Chip color="ok">enabled</Chip>
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {!results && !running && (
        <Panel>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FlaskConical size={32} className="text-slate-700" />
            <p className="mt-3 text-sm text-slate-600">Configure workload and run a benchmark to see results</p>
          </div>
        </Panel>
      )}
    </div>
  );
}

function ConfigSlider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs text-slate-500">{label}</label>
        <span className="tabular text-xs text-accent-300">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(ev) => onChange(Number(ev.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-base-700 accent-accent-500"
      />
    </div>
  );
}

function KpiStatusChip({ status }: { status: 'pass' | 'warn' | 'fail' }) {
  if (status === 'pass') return <Chip color="ok"><CheckCircle2 size={12} /> Pass</Chip>;
  if (status === 'warn') return <Chip color="warn"><AlertCircle size={12} /> Warn</Chip>;
  return <Chip color="err"><XCircle size={12} /> Fail</Chip>;
}
