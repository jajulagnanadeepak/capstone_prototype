import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, Zap, Award } from 'lucide-react';
import { engine } from '@/lib/engine';
import { PageId } from '@/lib/types';
import { clsx } from '@/lib/clsx';
import { useEngine } from '@/lib/useEngine';

interface DemoStep {
  id: number;
  page: PageId;
  title: string;
  description: string;
  action: () => void;
  waitMs: number;
}

export function DemoMode({ onClose, onNavigate, onShowScorecard }: { onClose: () => void; onNavigate: (p: PageId) => void; onShowScorecard: () => void }) {
  useEngine();
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);

  const steps: DemoStep[] = [
    {
      id: 0,
      page: 'overview',
      title: 'Overview & Key Metrics',
      description: 'Live pipeline health at a glance — throughput, cost/event, p95 latency, error rate, and recovery time. The interactive pipeline diagram shows events flowing through all six stages.',
      action: () => { engine.resume(); engine.setRate(50); },
      waitMs: 4000,
    },
    {
      id: 1,
      page: 'live',
      title: 'Live Pipeline Operations',
      description: 'Real-time stage metrics with animated event flow. Try the controls: pause, generate burst events, or adjust the injection rate. Watch the queue depth and per-stage p95 latency update live.',
      action: () => { engine.generateBurst(30); engine.setRate(120); },
      waitMs: 5000,
    },
    {
      id: 2,
      page: 'analytics',
      title: 'Analytics & Charts',
      description: 'Throughput, latency, errors, cost, queue depth, and cumulative events over time. Toggle between chart tabs and compare event type and regional distributions.',
      action: () => {},
      waitMs: 4000,
    },
    {
      id: 3,
      page: 'perf',
      title: 'Performance Benchmark',
      description: 'Configure workload parameters and run a benchmark. The lab measures throughput, p50/p95/p99 latency, error rate, cost per event, and cold start rate against targets.',
      action: () => {},
      waitMs: 4000,
    },
    {
      id: 4,
      page: 'reliability',
      title: 'Failure Injection & Recovery',
      description: 'Inject failures — cold start, queue failure, data quality, duplicates, storage failure, access control. Watch the four-phase progression: Failure → Detection → Recovery → Reconciliation.',
      action: () => { engine.setFailure('storage_fail'); },
      waitMs: 5000,
    },
    {
      id: 5,
      page: 'reliability',
      title: 'Recovery Complete',
      description: 'The system detected the failure, retried with exponential backoff, and reconciled all data. Zero data loss, DLQ redrive successful, and data integrity verified.',
      action: () => { engine.setFailure('none'); },
      waitMs: 4000,
    },
    {
      id: 6,
      page: 'overview',
      title: 'Final Result',
      description: 'All experiments passed. The serverless event-driven pipeline meets performance, cost, latency, reliability, recovery, and data integrity targets. View the full capstone scorecard for the final assessment.',
      action: () => {},
      waitMs: 3000,
    },
  ];

  const currentStep = steps[step];

  useEffect(() => {
    onNavigate(currentStep.page);
    currentStep.action();
  }, [step]);

  useEffect(() => {
    if (!auto) return;
    const timer = setTimeout(() => {
      if (step < steps.length - 1) {
        setStep((s) => s + 1);
      } else {
        onShowScorecard();
      }
    }, currentStep.waitMs);
    return () => clearTimeout(timer);
  }, [step, auto]);

  const next = useCallback(() => {
    if (step < steps.length - 1) setStep((s) => s + 1);
    else onShowScorecard();
  }, [step]);

  const prev = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  return (
    <>
      {/* Bottom progress bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-base-700 bg-base-900/95 backdrop-blur-lg">
        {/* Step indicators */}
        <div className="flex items-center gap-1 px-4 pt-2">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className={clsx(
                'h-1 flex-1 rounded-full transition-colors',
                i <= step ? 'bg-accent-500' : 'bg-base-700',
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-4 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-500/15">
            {step < steps.length - 1 ? <Zap size={18} className="text-accent-400" /> : <Award size={18} className="text-accent-400" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Step {step + 1} / {steps.length}</span>
              {step === steps.length - 1 && <span className="chip bg-ok-500/15 text-ok-400">Final</span>}
            </div>
            <div className="truncate text-sm font-semibold text-slate-200">{currentStep.title}</div>
            <div className="truncate text-xs text-slate-500">{currentStep.description}</div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setAuto(!auto)}
              className={clsx('btn text-xs', auto ? 'btn-outline' : 'btn-primary')}
            >
              {auto ? 'Pause Auto' : 'Resume Auto'}
            </button>
            {step > 0 && (
              <button onClick={prev} className="btn btn-ghost text-xs">
                Back
              </button>
            )}
            {step < steps.length - 1 ? (
              <button onClick={next} className="btn btn-primary text-xs">
                Next <ChevronRight size={12} />
              </button>
            ) : (
              <button onClick={onShowScorecard} className="btn btn-primary text-xs">
                View Scorecard <Award size={12} />
              </button>
            )}
            <button onClick={onClose} className="btn btn-ghost p-1.5">
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
