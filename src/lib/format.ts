export function fmtNum(n: number, decimals = 0): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(decimals > 0 ? 1 : 0) + 'K';
  return n.toFixed(decimals);
}

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export function fmtMs(n: number): string {
  if (n < 1) return n.toFixed(2) + 'ms';
  if (n < 1000) return n.toFixed(0) + 'ms';
  return (n / 1000).toFixed(2) + 's';
}

export function fmtPct(n: number, decimals = 1): string {
  return n.toFixed(decimals) + '%';
}

export function fmtCost(n: number): string {
  if (n < 0.001) return '$' + n.toFixed(6);
  if (n < 1) return '$' + n.toFixed(4);
  return '$' + n.toFixed(2);
}

export function fmtBytes(n: number): string {
  if (n < 1024) return n + 'B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + 'KB';
  return (n / (1024 * 1024)).toFixed(2) + 'MB';
}

export function fmtTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

export function fmtDateTime(ts: number): string {
  const d = new Date(ts);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
