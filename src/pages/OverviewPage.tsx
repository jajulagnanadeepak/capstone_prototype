import { useMemo } from 'react';
import { Zap, Gauge as GaugeIcon, DollarSign, Timer, AlertTriangle, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { engine } from '@/lib/engine';
import { useEngine } from '@/lib/useEngine';
import { Panel, StatCard, Chip, StatusDot, ProgressBar } from '@/components/ui';
import { Sparkline, AreaChart, Gauge } from '@/components/charts';
import { PipelineDiagram } from '@/components/PipelineDiagram';
import { fmtNum, fmtInt, fmtMs, fmtPct, fmtCost } from '@/lib/format';

export function OverviewPage() {
  useEngine();
  const e = engine;

  const throughputData = e.history.map((h) => h.throughput);
  const latencyData = e.history.map((h) => h.latency);
  const errorData = e.history.map((h) => h.errors);
  const costData = e.history.map((h) => h.cost * 10000);

  const kpis = useMemo(() => {
    return [
      { label: 'Events Processed', value: fmtInt(e.totalEvents), icon: <Zap size={16} />, status: 'neutral' as const, trend: `+${fmtInt(e.currentThroughput())}/s` },
      { label: 'Throughput', value: fmtNum(e.currentThroughput(), 1), unit: 'ev/s', icon: <TrendingUp size={16} />, status: 'good' as const, trend: 'last 60s avg' },
      { label: 'Cost / Event', value: fmtCost(e.costPerEvent()), icon: <DollarSign size={16} />, status: 'good' as const, trend: 'serverless billing' },
      { label: 'p95 Latency', value: fmtMs(e.currentP95()), icon: <Timer size={16} />, status: e.currentP95() > 150 ? 'warn' as const : 'good' as const, trend: 'end-to-end' },
      { label: 'Error Rate', value: fmtPct(e.currentErrorRate()), icon: <AlertTriangle size={16} />, status: e.currentErrorRate() > 5 ? 'bad' as const : 'good' as const, trend: `${fmtInt(e.totalErrors)} total errors` },
      { label: 'Recovery Time', value: fmtMs(e.recoveryTime()), icon: <RefreshCw size={16} />, status: e.failureMode !== 'none' ? 'warn' as const : 'good' as const, trend: e.failureMode === 'none' ? 'no active incidents' : `${e.failureMode} active` },
    ];
  }, [e.totalEvents, e.totalErrors, e.failureMode, e.history.length]);

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Pipeline Diagram */}
      <Panel
        title="Event-Driven Pipeline"
        icon={<Zap size={16} className="text-accent-400" />}
        action={
          <div className="flex items-center gap-2">
            <StatusDot status={e.running ? 'healthy' : 'degraded'} />
            <span className="text-xs text-slate-400">{e.running ? 'Live' : 'Paused'}</span>
          </div>
        }
      >
        <div className="px-4">
          <PipelineDiagram activeEvents={e.liveQueue} />
        </div>
      </Panel>

      {/* Charts + Comparison */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Throughput" icon={<TrendingUp size={16} className="text-accent-400" />} className="lg:col-span-1">
          <div className="p-4">
            <AreaChart data={throughputData} color="#22d3ee" height={160} unit=" ev/s" label="events/sec" />
          </div>
        </Panel>

        <Panel title="p95 Latency" icon={<Timer size={16} className="text-accent-400" />} className="lg:col-span-1">
          <div className="p-4">
            <AreaChart data={latencyData} color="#34d399" height={160} unit="ms" label="latency (ms)" />
          </div>
        </Panel>

        <Panel title="Error Rate" icon={<AlertTriangle size={16} className="text-warn-400" />} className="lg:col-span-1">
          <div className="p-4">
            <AreaChart data={errorData} color="#f87171" height={160} unit="%" label="errors (%)" />
          </div>
        </Panel>
      </div>

      {/* Always-On vs Serverless */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Always-On vs Serverless" icon={<GaugeIcon size={16} className="text-accent-400" />}>
          <div className="p-4 space-y-4">
            <ComparisonRow label="Monthly Cost (idle)" alwaysOn="$340.00" serverless="$12.40" winner="serverless" />
            <ComparisonRow label="Cost at 1000 ev/s" alwaysOn="$340.00" serverless="$48.20" winner="serverless" />
            <ComparisonRow label="Cold Start Risk" alwaysOn="None" serverless="Low (mitigated)" winner="always-on" />
            <ComparisonRow label="Scale Time" alwaysOn="~5 min (provision)" serverless="~250ms (concurrent)" winner="serverless" />
            <ComparisonRow label="p95 Latency" alwaysOn="38ms" serverless="42ms" winner="always-on" />
            <ComparisonRow label="Observability" alwaysOn="Manual" serverless="Built-in tracing" winner="serverless" />
          </div>
        </Panel>

        <Panel title="Cost Efficiency" icon={<DollarSign size={16} className="text-accent-400" />}>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Gauge value={e.costPerEvent() * 1000000} max={50} label="Cost per 1M events (µ$)" unit="" color="#22d3ee" />
              <Gauge value={e.uptimePct()} max={100} label="Uptime SLA" unit="%" color="#34d399" />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                <span>Cost trend (per 10K events ×100)</span>
                <span className="tabular">{fmtCost(e.costPerEvent() * 10000)}</span>
              </div>
              <Sparkline data={costData} color="#22d3ee" height={50} width={300} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-base-800/60 p-2">
                <div className="tabular text-lg font-semibold text-accent-300">{fmtInt(e.totalEvents)}</div>
                <div className="text-[10px] text-slate-500">Total Events</div>
              </div>
              <div className="rounded-lg bg-base-800/60 p-2">
                <div className="tabular text-lg font-semibold text-ok-400">{fmtInt(e.totalEvents - e.totalErrors)}</div>
                <div className="text-[10px] text-slate-500">Successful</div>
              </div>
              <div className="rounded-lg bg-base-800/60 p-2">
                <div className="tabular text-lg font-semibold text-warn-400">{fmtInt(e.totalRetries)}</div>
                <div className="text-[10px] text-slate-500">Retried</div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ComparisonRow({
  label,
  alwaysOn,
  serverless,
  winner,
}: {
  label: string;
  alwaysOn: string;
  serverless: string;
  winner: 'always-on' | 'serverless';
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-sm">
      <span className="text-slate-400">{label}</span>
      <div className="flex items-center gap-1.5">
        {winner === 'always-on' && <TrendingDown size={12} className="text-ok-400" />}
        <span className={clsxWinner(winner === 'always-on')}>{alwaysOn}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {winner === 'serverless' && <TrendingDown size={12} className="text-ok-400" />}
        <span className={clsxWinner(winner === 'serverless')}>{serverless}</span>
      </div>
    </div>
  );
}

function clsxWinner(isWinner: boolean): string {
  return isWinner ? 'tabular font-semibold text-accent-300' : 'tabular text-slate-400';
}
