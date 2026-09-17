import { useState, useMemo } from 'react';
import { Search, ChevronRight, X, Database, Shield, RefreshCw, FileCode, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { engine } from '@/lib/engine';
import { useEngine } from '@/lib/useEngine';
import { Panel, Chip } from '@/components/ui';
import { fmtBytes, fmtMs, fmtTime, fmtDateTime } from '@/lib/format';
import { PipelineEvent, EventType } from '@/lib/types';
import { clsx } from '@/lib/clsx';
import { STAGE_LABELS } from '@/lib/types';

const EVENT_TYPES: EventType[] = [
  'order.created',
  'payment.processed',
  'user.signup',
  'inventory.updated',
  'sensor.telemetry',
  'webhook.received',
  'audit.logged',
];

const STATUS_COLORS: Record<string, 'ok' | 'err' | 'warn' | 'neutral'> = {
  stored: 'ok',
  failed: 'err',
  retried: 'warn',
  processing: 'neutral',
  dead_letter: 'err',
};

export function EventsPage() {
  useEngine();
  const e = engine;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<PipelineEvent | null>(null);

  const filtered = useMemo(() => {
    return e.events.filter((evt) => {
      if (typeFilter !== 'all' && evt.type !== typeFilter) return false;
      if (statusFilter !== 'all' && evt.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          evt.type.includes(q) ||
          evt.source.includes(q) ||
          evt.id.includes(q) ||
          evt.region.includes(q) ||
          String(evt.seq).includes(q)
        );
      }
      return true;
    });
  }, [e.events, search, typeFilter, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Panel>
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(ev) => setSearch(ev.target.value)}
              placeholder="Search by type, source, ID, region…"
              className="w-full rounded-lg border border-base-700 bg-base-900/60 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-accent-500/50"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(ev) => setTypeFilter(ev.target.value)}
            className="rounded-lg border border-base-700 bg-base-900/60 px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent-500/50"
          >
            <option value="all">All Types</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(ev) => setStatusFilter(ev.target.value)}
            className="rounded-lg border border-base-700 bg-base-900/60 px-3 py-2 text-sm text-slate-200 outline-none focus:border-accent-500/50"
          >
            <option value="all">All Statuses</option>
            <option value="stored">Stored</option>
            <option value="failed">Failed</option>
            <option value="retried">Retried</option>
          </select>
          <span className="text-xs text-slate-500">{filtered.length} events</span>
        </div>
      </Panel>

      {/* Table */}
      <Panel>
        <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-base-850/95 backdrop-blur">
              <tr className="text-left text-slate-500">
                <th className="px-4 py-2.5 font-medium">Seq</th>
                <th className="px-4 py-2.5 font-medium">Time</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Source</th>
                <th className="px-4 py-2.5 font-medium">Region</th>
                <th className="px-4 py-2.5 font-medium">Size</th>
                <th className="px-4 py-2.5 font-medium">Latency</th>
                <th className="px-4 py-2.5 font-medium">Retries</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((evt) => (
                <tr
                  key={evt.id}
                  onClick={() => setSelected(evt)}
                  className="cursor-pointer border-t border-base-700/30 hover:bg-base-800/40 transition-colors"
                >
                  <td className="px-4 py-2 tabular text-slate-500">{evt.seq}</td>
                  <td className="px-4 py-2 tabular text-slate-400">{fmtTime(evt.receivedAt)}</td>
                  <td className="px-4 py-2 font-mono text-accent-300">{evt.type}</td>
                  <td className="px-4 py-2 text-slate-400">{evt.source}</td>
                  <td className="px-4 py-2 text-slate-400">{evt.region}</td>
                  <td className="px-4 py-2 tabular text-slate-400">{fmtBytes(evt.payloadSize)}</td>
                  <td className="px-4 py-2 tabular text-slate-300">{fmtMs(evt.latencyMs)}</td>
                  <td className="px-4 py-2 tabular text-slate-400">{evt.retries}</td>
                  <td className="px-4 py-2">
                    <Chip color={STATUS_COLORS[evt.status]}>{evt.status}</Chip>
                  </td>
                  <td className="px-4 py-2">
                    <ChevronRight size={14} className="text-slate-600" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Detail drawer */}
      {selected && <EventDetailDrawer event={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function EventDetailDrawer({ event, onClose }: { event: PipelineEvent; onClose: () => void }) {
  const payload = useMemo(() => generatePayload(event), [event]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative h-full w-full max-w-2xl overflow-y-auto border-l border-base-700 bg-base-900 shadow-2xl animate-fade-in"
        onClick={(ev) => ev.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-base-700 bg-base-900/95 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold text-accent-300">{event.type}</span>
            <Chip color={STATUS_COLORS[event.status]}>{event.status}</Chip>
          </div>
          <button onClick={onClose} className="btn btn-ghost p-1.5">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <Meta label="Event ID" value={event.id} />
            <Meta label="Sequence" value={String(event.seq)} />
            <Meta label="Region" value={event.region} />
            <Meta label="Source" value={event.source} />
            <Meta label="Received" value={fmtDateTime(event.receivedAt)} />
            <Meta label="Latency" value={fmtMs(event.latencyMs)} />
            <Meta label="Payload Size" value={fmtBytes(event.payloadSize)} />
            <Meta label="Retries" value={String(event.retries)} />
          </div>

          {/* Payload */}
          <Section icon={<FileCode size={14} />} title="Payload">
            <pre className="overflow-x-auto rounded-lg bg-base-950/80 p-3 text-xs text-slate-300 font-mono leading-relaxed">{payload}</pre>
          </Section>

          {/* Schema & Validation */}
          <Section icon={<Shield size={14} />} title="Schema & Validation">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {event.valid ? (
                  <><CheckCircle2 size={16} className="text-ok-400" /><span className="text-ok-400">Schema validated</span></>
                ) : (
                  <><XCircle size={16} className="text-err-400" /><span className="text-err-400">Schema validation failed</span></>
                )}
                <Chip color="neutral">v{event.schemaVersion}</Chip>
              </div>
              <div className="rounded-lg bg-base-950/60 p-3 text-xs font-mono text-slate-400">
                <div className="text-slate-500">{'// schema-registry/event-schema.json'}</div>
                <div>{'{'}</div>
                <div className="pl-3">{'"type": "object",'}</div>
                <div className="pl-3">{'"required": ["event_id", "timestamp", "source", "payload"],'}</div>
                <div className="pl-3">{'"properties": {'}</div>
                <div className="pl-6">{'"event_id": {"type": "string"},'}</div>
                <div className="pl-6">{'"timestamp": {"type": "string", "format": "date-time"},'}</div>
                <div className="pl-6">{'"source": {"type": "string"},'}</div>
                <div className="pl-6">{'"payload": {"type": "object"}'}</div>
                <div className="pl-3">{'}'}</div>
                <div>{'}'}</div>
              </div>
            </div>
          </Section>

          {/* Processing trace */}
          <Section icon={<RefreshCw size={14} />} title="Processing Trace">
            <div className="space-y-1">
              {event.traces.map((trace, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-base-950/40 px-3 py-2">
                  <div className={clsx(
                    'flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold',
                    trace.status === 'ok' ? 'bg-ok-500/15 text-ok-400' :
                    trace.status === 'warn' ? 'bg-warn-500/15 text-warn-400' :
                    'bg-err-500/15 text-err-400'
                  )}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-200">{STAGE_LABELS[trace.stage]}</span>
                      <span className="tabular text-xs text-slate-400">{fmtMs(trace.durationMs)}</span>
                    </div>
                    <div className="text-xs text-slate-500">{trace.detail}</div>
                  </div>
                  <Clock size={12} className="text-slate-600" />
                </div>
              ))}
            </div>
          </Section>

          {/* Storage */}
          <Section icon={<Database size={14} />} title="Storage">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Object Key</span>
                <span className="font-mono text-xs text-accent-300">{event.storageKey}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Format</span>
                <span className="text-slate-300">Parquet (columnar, compressed)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Partition</span>
                <span className="text-slate-300">{event.region}/{event.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">DuckDB Query</span>
                <Chip color="ok">indexed</Chip>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-base-800/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-0.5 truncate font-mono text-xs text-slate-300" title={value}>{value}</div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <span className="text-accent-400">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

function generatePayload(event: PipelineEvent): string {
  const base: Record<string, unknown> = {
    event_id: event.id,
    timestamp: new Date(event.receivedAt).toISOString(),
    source: event.source,
    region: event.region,
    schema_version: event.schemaVersion,
  };
  if (event.type === 'order.created') {
    base.payload = { order_id: 'ord_' + event.id, customer_id: 'cus_8821', amount: Math.round(Math.random() * 50000) / 100, currency: 'USD', items: Math.ceil(Math.random() * 5) };
  } else if (event.type === 'payment.processed') {
    base.payload = { payment_id: 'pay_' + event.id, order_id: 'ord_' + event.id, method: 'card', status: 'captured', amount: Math.round(Math.random() * 50000) / 100 };
  } else if (event.type === 'sensor.telemetry') {
    base.payload = { device_id: 'dev_' + event.region, temperature: Math.round(Math.random() * 400) / 10, humidity: Math.round(Math.random() * 100), battery: Math.round(Math.random() * 100) };
  } else {
    base.payload = { ref: event.id, data: '...', count: Math.ceil(Math.random() * 100) };
  }
  return JSON.stringify(base, null, 2);
}
