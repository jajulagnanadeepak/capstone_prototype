import { useState, useEffect } from 'react';
import { Cloud, Database, Workflow, Boxes, BarChart3, Activity, ArrowRight } from 'lucide-react';
import { StageId, STAGE_ORDER, STAGE_LABELS, PipelineEvent } from '@/lib/types';
import { clsx } from '@/lib/clsx';

const STAGE_ICONS: Record<StageId, typeof Cloud> = {
  ingest: Cloud,
  queue: Boxes,
  transform: Workflow,
  storage: Database,
  analytics: BarChart3,
  monitor: Activity,
};

export function PipelineDiagram({
  activeEvents,
  compact = false,
}: {
  activeEvents: PipelineEvent[];
  compact?: boolean;
}) {
  const [pulseStage, setPulseStage] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setPulseStage((s) => (s + 1) % STAGE_ORDER.length), 600);
    return () => clearInterval(i);
  }, []);

  return (
    <div className={clsx('flex items-stretch gap-1 overflow-x-auto', compact ? 'py-2' : 'py-4')}>
      {STAGE_ORDER.map((stage, i) => {
        const Icon = STAGE_ICONS[stage];
        const isActive = pulseStage === i;
        const stageEvents = activeEvents.filter((e) => e.traces.some((t) => t.stage === stage && Date.now() - t.enteredAt < 3000));
        return (
          <div key={stage} className="flex items-stretch gap-1">
            <div
              className={clsx(
                'relative flex min-w-[110px] flex-col items-center justify-center gap-2 rounded-xl border px-3 py-3 transition-all duration-300',
                isActive
                  ? 'border-accent-500/50 bg-accent-500/10 shadow-glow'
                  : 'border-base-700/60 bg-base-850/60',
              )}
            >
              {stageEvents.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-base-950">
                  {stageEvents.length}
                </span>
              )}
              <Icon
                size={compact ? 18 : 22}
                className={clsx('transition-colors', isActive ? 'text-accent-400' : 'text-slate-400')}
              />
              <span className={clsx('text-center font-medium', compact ? 'text-[10px]' : 'text-xs', isActive ? 'text-accent-300' : 'text-slate-300')}>
                {STAGE_LABELS[stage]}
              </span>
            </div>
            {i < STAGE_ORDER.length - 1 && (
              <div className="flex items-center">
                <svg width="28" height="20" className={clsx(isActive && 'text-accent-400', 'text-slate-600')}>
                  <line
                    x1="0"
                    y1="10"
                    x2="28"
                    y2="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className={clsx(isActive && 'animate-flow-dash')}
                  />
                  <path d="M22 6 L28 10 L22 14" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function EventFlowVisualization({ events }: { events: PipelineEvent[] }) {
  const [positions, setPositions] = useState<{ id: string; x: number; stage: number }[]>([]);

  useEffect(() => {
    const i = setInterval(() => {
      setPositions((prev) => {
        const next = prev
          .map((p) => ({ ...p, x: p.x + 3, stage: Math.min(5, Math.floor((p.x / 100) * 6)) }))
          .filter((p) => p.x < 100);
        if (events.length > 0 && Math.random() < 0.4 && next.length < 12) {
          next.push({ id: Math.random().toString(36).slice(2), x: 0, stage: 0 });
        }
        return next;
      });
    }, 100);
    return () => clearInterval(i);
  }, [events.length]);

  return (
    <div className="relative h-10 w-full overflow-hidden rounded-lg border border-base-700/40 bg-base-950/50">
      {positions.map((p) => (
        <div
          key={p.id}
          className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-accent-400 shadow-glow"
          style={{ left: `${p.x}%`, opacity: 1 - p.x / 120 }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-600">
        event stream
      </div>
    </div>
  );
}
