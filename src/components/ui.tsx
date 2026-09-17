import { ReactNode } from 'react';
import { clsx } from '@/lib/clsx';

export function Panel({
  children,
  className,
  title,
  icon,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={clsx('panel', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-base-700/60 px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            {icon}
            {title}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  unit,
  trend,
  icon,
  status = 'neutral',
}: {
  label: string;
  value: string;
  unit?: string;
  trend?: string;
  icon?: ReactNode;
  status?: 'good' | 'warn' | 'bad' | 'neutral';
}) {
  const colors = {
    good: 'text-ok-400',
    warn: 'text-warn-400',
    bad: 'text-err-400',
    neutral: 'text-slate-100',
  };
  return (
    <div className="panel panel-hover p-4 transition-all hover:shadow-glow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</span>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={clsx('tabular text-2xl font-semibold', colors[status])}>{value}</span>
        {unit && <span className="text-sm text-slate-500">{unit}</span>}
      </div>
      {trend && <div className="mt-1 text-xs text-slate-500">{trend}</div>}
    </div>
  );
}

export function StatusDot({ status }: { status: 'healthy' | 'degraded' | 'error' | 'ok' | 'warn' }) {
  const colors = {
    healthy: 'bg-ok-500',
    ok: 'bg-ok-500',
    degraded: 'bg-warn-500',
    warn: 'bg-warn-500',
    error: 'bg-err-500',
  };
  return (
    <span className="relative inline-flex h-2 w-2">
      <span className={clsx('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', colors[status])} />
      <span className={clsx('relative inline-flex h-2 w-2 rounded-full', colors[status])} />
    </span>
  );
}

export function Chip({
  children,
  color = 'neutral',
}: {
  children: ReactNode;
  color?: 'neutral' | 'accent' | 'ok' | 'warn' | 'err';
}) {
  const colors = {
    neutral: 'bg-base-700/60 text-slate-300',
    accent: 'bg-accent-500/15 text-accent-300',
    ok: 'bg-ok-500/15 text-ok-400',
    warn: 'bg-warn-500/15 text-warn-400',
    err: 'bg-err-500/15 text-err-400',
  };
  return <span className={clsx('chip', colors[color])}>{children}</span>;
}

export function ProgressBar({ value, max, color = 'accent' }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const colorMap: Record<string, string> = {
    accent: 'bg-accent-500',
    ok: 'bg-ok-500',
    warn: 'bg-warn-500',
    err: 'bg-err-500',
  };
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-base-700">
      <div
        className={clsx('h-full rounded-full transition-all duration-500', colorMap[color] || colorMap.accent)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
