import { useMemo, useState } from 'react';
import { TrendingUp, Timer, AlertTriangle, DollarSign, Boxes, Zap } from 'lucide-react';
import { engine } from '@/lib/engine';
import { useEngine } from '@/lib/useEngine';
import { Panel, Chip } from '@/components/ui';
import { MultiAreaChart, BarChart, AreaChart } from '@/components/charts';
import { fmtNum, fmtMs, fmtPct, fmtCost, fmtInt } from '@/lib/format';

type ChartTab = 'throughput' | 'latency' | 'errors' | 'cost' | 'queue' | 'events';

export function AnalyticsPage() {
  useEngine();
  const e = engine;
  const [tab, setTab] = useState<ChartTab>('throughput');

  const charts: Record<ChartTab, { name: string; data: number[]; color: string; unit: string }> = {
    throughput: { name: 'Throughput (ev/s)', data: e.history.map((h) => h.throughput), color: '#22d3ee', unit: ' ev/s' },
    latency: { name: 'p95 Latency (ms)', data: e.history.map((h) => h.latency), color: '#34d399', unit: 'ms' },
    errors: { name: 'Error Rate (%)', data: e.history.map((h) => h.errors), color: '#f87171', unit: '%' },
    cost: { name: 'Cost per 10K events', data: e.history.map((h) => h.cost * 10000), color: '#fbbf24', unit: '$' },
    queue: { name: 'Queue Depth', data: e.history.map((h) => h.queueDepth), color: '#a78bfa', unit: '' },
    events: { name: 'Cumulative Events', data: e.history.map((h) => h.events), color: '#22d3ee', unit: '' },
  };

  // Event type distribution
  const typeDist = useMemo(() => {
    const types = ['order.created', 'payment.processed', 'user.signup', 'inventory.updated', 'sensor.telemetry', 'webhook.received', 'audit.logged'];
    return types.map((t) => e.events.filter((ev) => ev.type === t).length);
  }, [e.events]);

  // Region distribution
  const regionDist = useMemo(() => {
    const regions = ['us-east-1', 'eu-west-1', 'ap-southeast-2'];
    return regions.map((r) => e.events.filter((ev) => ev.region === r).length);
  }, [e.events]);

  const tabs: { id: ChartTab; label: string; icon: React.ReactNode }[] = [
    { id: 'throughput', label: 'Throughput', icon: <TrendingUp size={14} /> },
    { id: 'latency', label: 'Latency', icon: <Timer size={14} /> },
    { id: 'errors', label: 'Errors', icon: <AlertTriangle size={14} /> },
    { id: 'cost', label: 'Cost', icon: <DollarSign size={14} /> },
    { id: 'queue', label: 'Queue Depth', icon: <Boxes size={14} /> },
    { id: 'events', label: 'Events', icon: <Zap size={14} /> },
  ];

  return (
    <div className="space-y-4">
      {/* Main chart with tabs */}
      <Panel
        title="Analytics Charts"
        icon={<TrendingUp size={16} className="text-accent-400" />}
        action={
          <div className="flex flex-wrap gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  tab === t.id ? 'bg-accent-500/15 text-accent-300' : 'text-slate-400 hover:bg-base-700/60 hover:text-slate-200'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="p-4">
          <AreaChart
            data={charts[tab].data}
            color={charts[tab].color}
            height={260}
            unit={charts[tab].unit}
            label={charts[tab].name}
          />
        </div>
      </Panel>

      {/* Multi-series overview */}
      <Panel title="Multi-Metric Overview" icon={<TrendingUp size={16} className="text-accent-400" />}>
        <div className="p-4">
          <MultiAreaChart
            height={200}
            series={[
              { name: 'Throughput', data: e.history.map((h) => h.throughput), color: '#22d3ee' },
              { name: 'Latency', data: e.history.map((h) => h.latency), color: '#34d399' },
              { name: 'Errors', data: e.history.map((h) => h.errors * 10), color: '#f87171' },
            ]}
          />
        </div>
      </Panel>

      {/* Distribution charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Event Type Distribution" icon={<Zap size={16} className="text-accent-400" />}>
          <div className="p-4">
            <BarChart
              data={typeDist}
              labels={['order', 'payment', 'signup', 'invent', 'sensor', 'webhook', 'audit']}
              color="#22d3ee"
              height={180}
            />
          </div>
        </Panel>

        <Panel title="Regional Distribution" icon={<Boxes size={16} className="text-accent-400" />}>
          <div className="p-4">
            <BarChart
              data={regionDist}
              labels={['us-east-1', 'eu-west-1', 'ap-southeast-2']}
              color="#34d399"
              height={180}
            />
          </div>
        </Panel>
      </div>

      {/* Summary stats */}
      <Panel title="Analytics Summary" icon={<TrendingUp size={16} className="text-accent-400" />}>
        <div className="grid grid-cols-2 gap-px bg-base-700/40 md:grid-cols-3 lg:grid-cols-6">
          <SummaryCell label="Total Events" value={fmtInt(e.totalEvents)} />
          <SummaryCell label="Avg Throughput" value={fmtNum(e.currentThroughput(), 1) + ' ev/s'} />
          <SummaryCell label="Avg p95" value={fmtMs(e.currentP95())} />
          <SummaryCell label="Error Rate" value={fmtPct(e.currentErrorRate())} status={e.currentErrorRate() > 5 ? 'bad' : 'good'} />
          <SummaryCell label="Cost/Event" value={fmtCost(e.costPerEvent())} />
          <SummaryCell label="Retries" value={fmtInt(e.totalRetries)} />
        </div>
      </Panel>
    </div>
  );
}

function SummaryCell({ label, value, status = 'neutral' }: { label: string; value: string; status?: 'good' | 'bad' | 'neutral' }) {
  const colors = { good: 'text-ok-400', bad: 'text-err-400', neutral: 'text-slate-200' };
  return (
    <div className="bg-base-850/80 p-4">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 tabular text-lg font-semibold ${colors[status]}`}>{value}</div>
    </div>
  );
}
