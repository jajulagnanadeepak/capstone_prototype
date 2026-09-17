import { Pause, Play, Zap, Trash2, Activity, Database, Boxes, Workflow, BarChart3, Cloud, RefreshCw } from 'lucide-react';
import { engine } from '@/lib/engine';
import { useEngine } from '@/lib/useEngine';
import { Panel, StatusDot, Chip, ProgressBar } from '@/components/ui';
import { EventFlowVisualization } from '@/components/PipelineDiagram';
import { fmtNum, fmtInt, fmtMs, fmtPct, fmtTime } from '@/lib/format';
import { StageId, STAGE_LABELS } from '@/lib/types';
import { clsx } from '@/lib/clsx';

const STAGE_ICONS: Record<StageId, typeof Cloud> = {
  ingest: Cloud,
  queue: Boxes,
  transform: Workflow,
  storage: Database,
  analytics: BarChart3,
  monitor: Activity,
};

export function LivePipelinePage() {
  useEngine();
  const e = engine;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Panel
        title="Pipeline Controls"
        icon={<Activity size={16} className="text-accent-400" />}
        action={
          <div className="flex items-center gap-2">
            <StatusDot status={e.running ? 'healthy' : 'degraded'} />
            <span className="text-xs text-slate-400">{e.running ? 'Running' : 'Paused'}</span>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          {e.running ? (
            <button onClick={() => e.pause()} className="btn btn-outline">
              <Pause size={14} /> Pause
            </button>
          ) : (
            <button onClick={() => e.resume()} className="btn btn-primary">
              <Play size={14} /> Resume
            </button>
          )}
          <button onClick={() => e.generateBurst(25)} className="btn btn-outline">
            <Zap size={14} /> Generate Events
          </button>
          <button onClick={() => e.clearQueue()} className="btn btn-danger">
            <Trash2 size={14} /> Clear Queue
          </button>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-slate-500">Injection Rate</span>
            <input
              type="range"
              min="10"
              max="200"
              value={e.injectionRate}
              onChange={(ev) => e.setRate(Number(ev.target.value))}
              className="h-1 w-32 cursor-pointer appearance-none rounded-full bg-base-700 accent-accent-500"
            />
            <span className="tabular text-sm text-accent-300">{e.injectionRate} ev/s</span>
          </div>
        </div>
      </Panel>

      {/* Event flow */}
      <Panel title="Live Event Stream" icon={<Zap size={16} className="text-accent-400" />}>
        <div className="p-4">
          <EventFlowVisualization events={e.liveQueue} />
        </div>
      </Panel>

      {/* Stage metrics grid */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {e.stageMetrics.map((sm) => {
          const Icon = STAGE_ICONS[sm.stage];
          const statusColor = sm.status === 'healthy' ? 'text-ok-400' : sm.status === 'degraded' ? 'text-warn-400' : 'text-err-400';
          return (
            <Panel key={sm.stage} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={18} className="text-accent-400" />
                  <span className="text-sm font-semibold text-slate-200">{STAGE_LABELS[sm.stage]}</span>
                </div>
                <StatusDot status={sm.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <Metric label="Throughput" value={`${fmtNum(sm.throughput, 1)} ev/s`} />
                <Metric label="p95" value={fmtMs(sm.p95)} />
                <Metric label="Error Rate" value={fmtPct(sm.errorRate)} status={sm.errorRate > 5 ? 'bad' : 'good'} />
                <Metric label="Processed" value={fmtInt(sm.processed)} />
                {sm.stage === 'queue' && (
                  <div className="col-span-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-slate-500">Queue Depth</span>
                      <span className="tabular text-slate-300">{sm.queueDepth}</span>
                    </div>
                    <ProgressBar value={sm.queueDepth} max={100} color={sm.queueDepth > 80 ? 'err' : sm.queueDepth > 50 ? 'warn' : 'accent'} />
                  </div>
                )}
                {sm.coldStarts > 0 && (
                  <Metric label="Cold Starts" value={fmtInt(sm.coldStarts)} status="warn" />
                )}
              </div>
            </Panel>
          );
        })}
      </div>

      {/* Live event log */}
      <Panel
        title="Real-time Event Log"
        icon={<RefreshCw size={16} className={clsx('text-accent-400', e.running && 'animate-spin [animation-duration:2s]')} />}
        action={<Chip color="accent">{e.liveQueue.length} in transit</Chip>}
      >
        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-base-850/95 backdrop-blur">
              <tr className="text-left text-slate-500">
                <th className="px-4 py-2 font-medium">Time</th>
                <th className="px-4 py-2 font-medium">Seq</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Source</th>
                <th className="px-4 py-2 font-medium">Region</th>
                <th className="px-4 py-2 font-medium">Latency</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {e.liveQueue.slice(0, 30).map((evt) => (
                <tr key={evt.id} className="border-t border-base-700/30 animate-slide-in hover:bg-base-800/40">
                  <td className="px-4 py-1.5 tabular text-slate-400">{fmtTime(evt.receivedAt)}</td>
                  <td className="px-4 py-1.5 tabular text-slate-500">{evt.seq}</td>
                  <td className="px-4 py-1.5 font-mono text-accent-300">{evt.type}</td>
                  <td className="px-4 py-1.5 text-slate-400">{evt.source}</td>
                  <td className="px-4 py-1.5 text-slate-400">{evt.region}</td>
                  <td className="px-4 py-1.5 tabular text-slate-300">{fmtMs(evt.latencyMs)}</td>
                  <td className="px-4 py-1.5">
                    <Chip color={evt.status === 'stored' ? 'ok' : evt.status === 'failed' ? 'err' : 'warn'}>
                      {evt.status}
                    </Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Metric({ label, value, status = 'neutral' }: { label: string; value: string; status?: 'good' | 'bad' | 'warn' | 'neutral' }) {
  const colors = { good: 'text-ok-400', bad: 'text-err-400', warn: 'text-warn-400', neutral: 'text-slate-300' };
  return (
    <div>
      <div className="text-slate-500">{label}</div>
      <div className={clsx('tabular font-medium', colors[status])}>{value}</div>
    </div>
  );
}
