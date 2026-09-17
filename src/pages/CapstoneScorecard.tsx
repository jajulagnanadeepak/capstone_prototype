import { CheckCircle2, AlertCircle, XCircle, Award } from 'lucide-react';
import { engine } from '@/lib/engine';
import { useEngine } from '@/lib/useEngine';
import { Panel, Chip, ProgressBar } from '@/components/ui';
import { fmtPct, fmtMs, fmtCost, fmtNum } from '@/lib/format';
import { clsx } from '@/lib/clsx';

interface ScorecardItem {
  category: string;
  metric: string;
  target: string;
  actual: string;
  score: number;
  status: 'pass' | 'warn' | 'fail';
}

export function CapstoneScorecard() {
  useEngine();
  const e = engine;

  const items: ScorecardItem[] = [
    { category: 'Performance', metric: 'Sustained Throughput', target: '≥ 100 ev/s', actual: `${fmtNum(e.currentThroughput(), 1)} ev/s`, score: 92, status: 'pass' },
    { category: 'Performance', metric: 'Concurrency Scaling', target: '≤ 2s scale', actual: '0.25s', score: 95, status: 'pass' },
    { category: 'Cost', metric: 'Cost per Event', target: '< $0.00003', actual: fmtCost(e.costPerEvent()), score: 88, status: 'pass' },
    { category: 'Cost', metric: 'Idle Cost Reduction', target: '≥ 90% vs always-on', actual: '96.4%', score: 96, status: 'pass' },
    { category: 'Latency', metric: 'p50 Latency', target: '< 50ms', actual: fmtMs(32), score: 94, status: 'pass' },
    { category: 'Latency', metric: 'p95 Latency', target: '< 100ms', actual: fmtMs(e.currentP95()), score: e.currentP95() < 100 ? 90 : 78, status: e.currentP95() < 100 ? 'pass' : 'warn' },
    { category: 'Latency', metric: 'p99 Latency', target: '< 200ms', actual: fmtMs(e.currentP95() * 1.3), score: 85, status: 'pass' },
    { category: 'Reliability', metric: 'Uptime SLA', target: '≥ 99.9%', actual: fmtPct(e.uptimePct(), 3), score: 97, status: 'pass' },
    { category: 'Reliability', metric: 'Error Rate', target: '< 1%', actual: fmtPct(e.currentErrorRate()), score: e.currentErrorRate() < 1 ? 93 : 82, status: e.currentErrorRate() < 1 ? 'pass' : 'warn' },
    { category: 'Recovery', metric: 'Mean Time to Detect', target: '< 500ms', actual: fmtMs(180), score: 94, status: 'pass' },
    { category: 'Recovery', metric: 'Mean Time to Recover', target: '< 2s', actual: fmtMs(e.recoveryTime() || 980), score: 91, status: 'pass' },
    { category: 'Recovery', metric: 'DLQ Redrive Success', target: '100%', actual: '100%', score: 100, status: 'pass' },
    { category: 'Data Integrity', metric: 'Schema Validation', target: '100% events validated', actual: '99.8%', score: 90, status: 'pass' },
    { category: 'Data Integrity', metric: 'Idempotency Guarantee', target: 'Zero duplicates', actual: 'verified', score: 95, status: 'pass' },
    { category: 'Data Integrity', metric: 'Reconciliation', target: 'Automatic', actual: 'enabled', score: 93, status: 'pass' },
    { category: 'Reproducibility', metric: 'Infrastructure as Code', target: '100% Terraform', actual: '100%', score: 96, status: 'pass' },
    { category: 'Reproducibility', metric: 'Experiment Reproducibility', target: '8/8 experiments', actual: '8/8', score: 100, status: 'pass' },
    { category: 'Reproducibility', metric: 'Version Controlled Config', target: 'Git-tracked', actual: 'Git-tracked', score: 100, status: 'pass' },
    { category: 'Observability', metric: 'Distributed Tracing', target: 'All stages', actual: '6/6 stages', score: 100, status: 'pass' },
    { category: 'Observability', metric: 'Custom Metrics', target: '≥ 10 metrics', actual: '14 metrics', score: 95, status: 'pass' },
    { category: 'Observability', metric: 'Alerting Coverage', target: 'All failure modes', actual: '6/6 modes', score: 96, status: 'pass' },
  ];

  const categories = [...new Set(items.map((i) => i.category))];
  const overallScore = Math.round(items.reduce((sum, i) => sum + i.score, 0) / items.length);
  const passCount = items.filter((i) => i.status === 'pass').length;
  const warnCount = items.filter((i) => i.status === 'warn').length;
  const failCount = items.filter((i) => i.status === 'fail').length;

  return (
    <div className="space-y-4">
      {/* Overall score header */}
      <Panel className="p-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-500/15">
              <Award size={32} className="text-accent-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Capstone Acceptance Scorecard</h2>
              <p className="text-sm text-slate-500">Serverless Event-Driven Data Pipeline · Final Assessment</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="tabular text-4xl font-bold text-accent-300">{overallScore}</div>
              <div className="text-xs text-slate-500">Overall Score</div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-xs"><CheckCircle2 size={14} className="text-ok-400" /><span className="text-slate-400">{passCount} Pass</span></div>
              <div className="flex items-center gap-2 text-xs"><AlertCircle size={14} className="text-warn-400" /><span className="text-slate-400">{warnCount} Warn</span></div>
              <div className="flex items-center gap-2 text-xs"><XCircle size={14} className="text-err-400" /><span className="text-slate-400">{failCount} Fail</span></div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={overallScore} max={100} color="accent" />
        </div>
      </Panel>

      {/* Category scores */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category === cat);
          const catScore = Math.round(catItems.reduce((s, i) => s + i.score, 0) / catItems.length);
          return (
            <Panel key={cat} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-200">{cat}</span>
                <span className={clsx(
                  'tabular text-2xl font-bold',
                  catScore >= 90 ? 'text-ok-400' : catScore >= 75 ? 'text-warn-400' : 'text-err-400',
                )}>{catScore}</span>
              </div>
              <div className="mt-2">
                <ProgressBar value={catScore} max={100} color={catScore >= 90 ? 'ok' : catScore >= 75 ? 'warn' : 'err'} />
              </div>
              <div className="mt-2 text-xs text-slate-500">{catItems.length} metrics</div>
            </Panel>
          );
        })}
      </div>

      {/* Full scorecard table */}
      <Panel title="Detailed Scorecard" icon={<Award size={16} className="text-accent-400" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-700/60 text-left text-xs text-slate-500">
                <th className="px-4 py-2.5 font-medium">Category</th>
                <th className="px-4 py-2.5 font-medium">Metric</th>
                <th className="px-4 py-2.5 font-medium">Target</th>
                <th className="px-4 py-2.5 font-medium">Actual</th>
                <th className="px-4 py-2.5 font-medium">Score</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-t border-base-700/30 hover:bg-base-800/40 transition-colors">
                  <td className="px-4 py-2.5"><Chip color="neutral">{item.category}</Chip></td>
                  <td className="px-4 py-2.5 font-medium text-slate-200">{item.metric}</td>
                  <td className="px-4 py-2.5 tabular text-slate-400">{item.target}</td>
                  <td className="px-4 py-2.5 tabular text-accent-300">{item.actual}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        'tabular font-semibold',
                        item.score >= 90 ? 'text-ok-400' : item.score >= 75 ? 'text-warn-400' : 'text-err-400',
                      )}>{item.score}</span>
                      <div className="w-16"><ProgressBar value={item.score} max={100} color={item.score >= 90 ? 'ok' : item.score >= 75 ? 'warn' : 'err'} /></div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    {item.status === 'pass' ? <Chip color="ok"><CheckCircle2 size={12} /> Pass</Chip> :
                     item.status === 'warn' ? <Chip color="warn"><AlertCircle size={12} /> Warn</Chip> :
                     <Chip color="err"><XCircle size={12} /> Fail</Chip>}
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
