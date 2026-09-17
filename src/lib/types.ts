export type StageId =
  | 'ingest'
  | 'queue'
  | 'transform'
  | 'storage'
  | 'analytics'
  | 'monitor';

export type EventStatus = 'processing' | 'stored' | 'failed' | 'retried' | 'dead_letter';

export type EventType =
  | 'order.created'
  | 'payment.processed'
  | 'user.signup'
  | 'inventory.updated'
  | 'sensor.telemetry'
  | 'webhook.received'
  | 'audit.logged';

export interface StageTrace {
  stage: StageId;
  enteredAt: number;
  exitedAt: number;
  status: 'ok' | 'warn' | 'error';
  durationMs: number;
  detail: string;
}

export interface PipelineEvent {
  id: string;
  seq: number;
  type: EventType;
  source: string;
  payloadSize: number;
  receivedAt: number;
  status: EventStatus;
  retries: number;
  latencyMs: number;
  schemaVersion: string;
  valid: boolean;
  traces: StageTrace[];
  storageKey: string;
  region: string;
}

export interface StageMetrics {
  stage: StageId;
  label: string;
  processed: number;
  throughput: number;
  p95: number;
  errorRate: number;
  queueDepth: number;
  status: 'healthy' | 'degraded' | 'error';
  coldStarts: number;
}

export interface MetricPoint {
  t: number;
  throughput: number;
  latency: number;
  errors: number;
  cost: number;
  queueDepth: number;
  events: number;
}

export interface KpiResult {
  metric: string;
  target: number;
  actual: number;
  unit: string;
  status: 'pass' | 'warn' | 'fail';
}

export interface FailureScenario {
  id: string;
  name: string;
  description: string;
  injected: boolean;
  detectionTimeMs: number;
  recoveryTimeMs: number;
  eventsAffected: number;
  dataIntegrity: 'verified' | 'degraded' | 'lost';
  steps: { phase: string; label: string; status: 'pending' | 'active' | 'done'; ts: number }[];
}

export type PageId =
  | 'overview'
  | 'live'
  | 'events'
  | 'analytics'
  | 'perf'
  | 'reliability'
  | 'evidence'
  | 'config';

export const STAGE_LABELS: Record<StageId, string> = {
  ingest: 'Serverless Ingestion',
  queue: 'Queue (SQS/Kafka)',
  transform: 'Transform Lambda',
  storage: 'Storage (DuckDB)',
  analytics: 'Analytics',
  monitor: 'Monitoring',
};

export const STAGE_ORDER: StageId[] = ['ingest', 'queue', 'transform', 'storage', 'analytics', 'monitor'];
