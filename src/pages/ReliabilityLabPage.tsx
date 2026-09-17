import { useState, useEffect } from 'react';
import { Shield, Snowflake, Boxes, Database, Copy, Lock, Activity, CheckCircle2, AlertTriangle, XCircle, Zap, RefreshCw } from 'lucide-react';
import { engine } from '@/lib/engine';
import { useEngine } from '@/lib/useEngine';
import { Panel, Chip, StatusDot, ProgressBar } from '@/components/ui';
import { fmtMs, fmtPct, fmtInt } from '@/lib/format';
import { clsx } from '@/lib/clsx';

interface Scenario {
  id: string;
  name: string;
  description: string;
  icon: typeof Snowflake;
  failureMode: 'cold_start' | 'queue_fail' | 'data_quality' | 'duplicate' | 'storage_fail' | 'access';
  detectionMs: number;
  recoveryMs: number;
  eventsAffected: number;
  dataIntegrity: 'verified' | 'degraded' | 'lost';
}

const SCENARIOS: Scenario[] = [
  { id: 'cold', name: 'Cold Start', description: 'Lambda containers not pre-warmed under sudden traffic burst', icon: Snowflake, failureMode: 'cold_start', detectionMs: 320, recoveryMs: 1200, eventsAffected: 14, dataIntegrity: 'verified' },
  { id: 'queue', name: 'Queue Failure', description: 'SQS visibility timeout expired, messages redelivered', icon: Boxes, failureMode: 'queue_fail', detectionMs: 180, recoveryMs: 850, eventsAffected: 8, dataIntegrity: 'verified' },
  { id: 'quality', name: 'Data Quality', description: 'Schema mismatch — missing required field in payload', icon: Activity, failureMode: 'data_quality', detectionMs: 95, recoveryMs: 600, eventsAffected: 5, dataIntegrity: 'degraded' },
  { id: 'duplicate', name: 'Duplicate Event', description: 'At-least-once delivery produced duplicate processing', icon: Copy, failureMode: 'duplicate', detectionMs: 210, recoveryMs: 450, eventsAffected: 3, dataIntegrity: 'verified' },
  { id: 'storage', name: 'Storage Failure', description: 'S3 503 Slow Down during high-volume partition write', icon: Database, failureMode: 'storage_fail', detectionMs: 140, recoveryMs: 980, eventsAffected: 11, dataIntegrity: 'verified' },
  { id: 'access', name: 'Access Control', description: 'IAM policy denied cross-account bucket access', icon: Lock, failureMode: 'access', detectionMs: 60, recoveryMs: 1500, eventsAffected: 6, dataIntegrity: 'degraded' },
];

export function ReliabilityLabPage() {
  useEngine();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [phase, setPhase] = useState(0);
  const [results, setResults] = useState<Scenario | null>(null);

  const runScenario = (sc: Scenario) => {
    setActiveId(sc.id);
    setPhase(0);
    setResults(null);
    engine.setFailure(sc.failureMode);

    const phases = 4; // failure -> detection -> recovery -> reconciliation
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setPhase(current);
      if (current >= phases) {
        clearInterval(interval);
        setResults(sc);
        engine.setFailure('none');
      }
    }, 800);
  };

  return (
    <div className="space-y-4">
      {/* Scenario cards */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {SCENARIOS.map((sc) => {
          const Icon = sc.icon;
          const isActive = activeId === sc.id;
          return (
            <Panel key={sc.id} className={clsx('p-4 transition-all', isActive && 'shadow-glow border-accent-500/40')}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/10 text-accent-400">
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{sc.name}</div>
                    <div className="text-xs text-slate-500">{sc.description}</div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => runScenario(sc)}
                disabled={isActive}
                className={clsx('mt-3 w-full btn', isActive ? 'btn-outline opacity-50' : 'btn-primary')}
              >
                {isActive ? (
                  <><RefreshCw size={14} className="animate-spin" /> Running…</>
                ) : (
                  <><Zap size={14} /> Inject Failure</>
                )}
              </button>
            </Panel>
          );
        })}
      </div>

      {/* Phase progression */}
      {activeId && (
        <Panel title="Failure → Detection → Recovery → Reconciliation" icon={<Activity size={16} className="text-accent-400" />}>
          <div className="p-4">
            <PhaseProgress phase={phase} />
          </div>
        </Panel>
      )}

      {/* Results */}
      {results && (
        <div className="grid gap-4 lg:grid-cols-2 animate-fade-in">
          <Panel title="Recovery Metrics" icon={<RefreshCw size={16} className="text-ok-400" />}>
            <div className="grid grid-cols-2 gap-px bg-base-700/40">
              <MetricCell label="Detection Time" value={fmtMs(results.detectionMs)} status="good" />
              <MetricCell label="Recovery Time" value={fmtMs(results.recoveryMs)} status={results.recoveryMs < 1000 ? 'good' : 'warn'} />
              <MetricCell label="Events Affected" value={fmtInt(results.eventsAffected)} />
              <MetricCell label="Mean Time to Resolve" value={fmtMs(results.detectionMs + results.recoveryMs)} status="good" />
            </div>
          </Panel>

          <Panel title="Data Integrity" icon={<Shield size={16} className="text-accent-400" />}>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Integrity Status</span>
                {results.dataIntegrity === 'verified' ? (
                  <Chip color="ok"><CheckCircle2 size={12} /> Verified</Chip>
                ) : results.dataIntegrity === 'degraded' ? (
                  <Chip color="warn"><AlertTriangle size={12} /> Degraded</Chip>
                ) : (
                  <Chip color="err"><XCircle size={12} /> Lost</Chip>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Reconciliation</span>
                <Chip color="ok">completed</Chip>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">DLQ Redrive</span>
                <Chip color="ok">success</Chip>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Compensation Events</span>
                <span className="tabular text-sm text-slate-300">{Math.ceil(results.eventsAffected * 0.7)}</span>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Data Consistency</span>
                  <span className="tabular text-ok-400">{fmtPct(99.7)}</span>
                </div>
                <ProgressBar value={99.7} max={100} color="ok" />
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* Status grid */}
      <Panel title="System Resilience Status" icon={<Shield size={16} className="text-accent-400" />}>
        <div className="grid grid-cols-2 gap-px bg-base-700/40 md:grid-cols-3 lg:grid-cols-6">
          {SCENARIOS.map((sc) => (
            <div key={sc.id} className="bg-base-850/80 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{sc.name}</span>
                <StatusDot status={activeId === sc.id && phase < 4 ? 'degraded' : 'healthy'} />
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {results?.id === sc.id ? 'Recovered' : activeId === sc.id ? 'In progress' : 'Ready'}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PhaseProgress({ phase }: { phase: number }) {
  const phases = [
    { label: 'Failure', icon: XCircle, color: 'err' },
    { label: 'Detection', icon: AlertTriangle, color: 'warn' },
    { label: 'Recovery', icon: RefreshCw, color: 'accent' },
    { label: 'Reconciliation', icon: CheckCircle2, color: 'ok' },
  ];
  return (
    <div className="flex items-center gap-1">
      {phases.map((p, i) => {
        const Icon = p.icon;
        const isDone = i < phase;
        const isActive = i === phase;
        const colorClass = isDone ? 'border-ok-500/50 bg-ok-500/10 text-ok-400' : isActive ? 'border-accent-500/50 bg-accent-500/10 text-accent-300' : 'border-base-700 bg-base-800/40 text-slate-600';
        return (
          <div key={p.label} className="flex flex-1 items-center">
            <div className={clsx('flex flex-col items-center gap-1.5 rounded-lg border px-3 py-2.5 transition-all', colorClass, isActive && 'shadow-glow')}>
              <Icon size={18} className={clsx(isActive && 'animate-pulse-soft')} />
              <span className="text-xs font-medium">{p.label}</span>
            </div>
            {i < phases.length - 1 && (
              <div className={clsx('h-0.5 flex-1 transition-colors', isDone ? 'bg-ok-500/50' : 'bg-base-700')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function MetricCell({ label, value, status = 'neutral' }: { label: string; value: string; status?: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const colors = { good: 'text-ok-400', warn: 'text-warn-400', bad: 'text-err-400', neutral: 'text-slate-200' };
  return (
    <div className="bg-base-850/80 p-4">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className={clsx('mt-1 tabular text-lg font-semibold', colors[status])}>{value}</div>
    </div>
  );
}
