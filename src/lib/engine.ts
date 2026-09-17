import {
  PipelineEvent,
  EventType,
  StageId,
  StageMetrics,
  MetricPoint,
  StageTrace,
  STAGE_ORDER,
} from './types';
import { uid, clamp } from './format';

const EVENT_TYPES: EventType[] = [
  'order.created',
  'payment.processed',
  'user.signup',
  'inventory.updated',
  'sensor.telemetry',
  'webhook.received',
  'audit.logged',
];

const SOURCES = ['api-gateway', 'webhook-svc', 'iot-bridge', 'mobile-sdk', 'batch-loader', 'partner-feed'];
const REGIONS = ['us-east-1', 'eu-west-1', 'ap-southeast-2'];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export class PipelineEngine {
  private seq = 0;
  private startTime = Date.now();
  events: PipelineEvent[] = [];
  liveQueue: PipelineEvent[] = [];
  history: MetricPoint[] = [];
  stageMetrics: StageMetrics[] = STAGE_ORDER.map((stage) => ({
    stage,
    label: stage,
    processed: 0,
    throughput: 0,
    p95: 0,
    errorRate: 0,
    queueDepth: 0,
    status: 'healthy',
    coldStarts: 0,
  }));

  totalEvents = 0;
  totalErrors = 0;
  totalRetries = 0;
  totalCost = 0;
  running = true;
  generateEnabled = true;
  injectionRate = 50;
  failureMode: 'none' | 'cold_start' | 'queue_fail' | 'data_quality' | 'duplicate' | 'storage_fail' | 'access' = 'none';

  private listeners: (() => void)[] = [];
  private interval: ReturnType<typeof setInterval> | null = null;
  private tickCount = 0;

  subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }
  private emit() {
    this.listeners.forEach((l) => l());
  }

  start() {
    if (this.interval) return;
    this.interval = setInterval(() => this.tick(), 700);
  }
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  pause() {
    this.running = false;
    this.emit();
  }
  resume() {
    this.running = true;
    this.emit();
  }
  clearQueue() {
    this.liveQueue = [];
    this.emit();
  }
  generateBurst(count = 20) {
    for (let i = 0; i < count; i++) this.processEvent();
    this.emit();
  }
  setRate(rate: number) {
    this.injectionRate = rate;
    this.emit();
  }
  setFailure(mode: typeof this.failureMode) {
    this.failureMode = mode;
    this.emit();
  }

  private tick() {
    if (!this.running) {
      this.emit();
      return;
    }
    this.tickCount++;

    const eventsThisTick = Math.max(1, Math.round(this.injectionRate / 10) + Math.floor(Math.random() * 3));
    if (this.generateEnabled) {
      for (let i = 0; i < eventsThisTick; i++) this.processEvent();
    }

    // advance live queue
    this.liveQueue = this.liveQueue.filter((e) => Date.now() - e.receivedAt < 4000);

    // update stage metrics
    this.updateStageMetrics();

    // record history point every 2 ticks
    if (this.tickCount % 2 === 0) {
      const last = this.history[this.history.length - 1];
      const throughput = last ? last.throughput * 0.7 + this.currentThroughput() * 0.3 : this.currentThroughput();
      const latency = last ? last.latency * 0.7 + this.currentP95() * 0.3 : this.currentP95();
      const errors = last ? last.errors * 0.8 + this.currentErrorRate() * 0.2 : this.currentErrorRate();
      const queueDepth = this.stageMetrics[1].queueDepth;
      this.history.push({
        t: Date.now(),
        throughput,
        latency,
        errors,
        cost: this.costPerEvent(),
        queueDepth,
        events: this.totalEvents,
      });
      if (this.history.length > 120) this.history.shift();
    }

    this.emit();
  }

  private processEvent() {
    this.seq++;
    const id = uid();
    const type = rand(EVENT_TYPES);
    const source = rand(SOURCES);
    const region = rand(REGIONS);
    const receivedAt = Date.now();
    const size = Math.round(randBetween(0.2, 8) * 1024);

    const failChance = this.failureMode !== 'none' ? 0.18 : 0.02;
    const willFail = Math.random() < failChance;

    // Build traces through stages
    const traces: StageTrace[] = [];
    let clock = receivedAt;
    let status: PipelineEvent['status'] = 'stored';
    let retries = 0;
    let valid = true;

    for (const stage of STAGE_ORDER) {
      const enter = clock;
      let dur = randBetween(5, 45);
      if (stage === 'ingest' && this.failureMode === 'cold_start' && Math.random() < 0.3) {
        dur += randBetween(200, 800);
      }
      if (stage === 'queue' && this.failureMode === 'queue_fail' && willFail) {
        dur += randBetween(100, 300);
      }
      if (stage === 'transform' && this.failureMode === 'data_quality' && willFail) {
        valid = false;
      }
      if (stage === 'storage' && this.failureMode === 'storage_fail' && willFail) {
        dur += randBetween(50, 200);
      }
      clock += dur;
      let traceStatus: StageTrace['status'] = 'ok';
      let detail = '';
      if (stage === 'ingest') detail = `Lambda warm-up 12ms · payload ${size}B`;
      if (stage === 'queue') detail = `queued · visibility 30s · batch=10`;
      if (stage === 'transform') detail = valid ? 'schema validated v2.1' : 'schema mismatch: missing field `amount`';
      if (stage === 'storage') detail = willFail && stage === 'storage' && this.failureMode === 'storage_fail' ? 'S3 503 slow down' : `DuckDB insert OK · partition=${region}`;
      if (stage === 'analytics') detail = 'aggregated into minute_rollup';
      if (stage === 'monitor') detail = 'metrics emitted · trace sampled';

      if (stage === 'transform' && !valid) {
        traceStatus = 'error';
        status = 'failed';
        break;
      }
      if (willFail && stage === 'storage' && this.failureMode === 'storage_fail') {
        traceStatus = 'error';
        retries = 1;
        status = 'retried';
        detail = 'retry 1/3 after 200ms backoff';
        // simulate recovery on retry
        clock += randBetween(150, 300);
        const retryEnter = clock;
        clock += randBetween(10, 30);
        traces.push({
          stage: 'storage',
          enteredAt: enter,
          exitedAt: clock,
          status: 'warn',
          durationMs: clock - enter,
          detail: 'recovered after retry',
        });
        // skip re-adding below
        continue;
      }
      if (willFail && stage === 'queue' && this.failureMode === 'queue_fail') {
        traceStatus = 'warn';
        retries = 1;
        detail = 'dlq fallback · redrive enabled';
        status = 'retried';
      }

      traces.push({
        stage,
        enteredAt: enter,
        exitedAt: clock,
        status: traceStatus,
        durationMs: Math.round(dur),
        detail,
      });
    }

    const latencyMs = clock - receivedAt;

    if (status === 'failed' || (willFail && this.failureMode === 'access' && Math.random() < 0.5)) {
      status = 'failed';
      this.totalErrors++;
    } else if (status === 'retried') {
      this.totalRetries++;
    }

    const storageKey = `s3://pipeline/${region}/${type}/${new Date().toISOString().slice(0, 10)}/${id}.parquet`;

    const evt: PipelineEvent = {
      id,
      seq: this.seq,
      type,
      source,
      payloadSize: size,
      receivedAt,
      status,
      retries,
      latencyMs,
      schemaVersion: '2.1.0',
      valid,
      traces,
      storageKey,
      region,
    };

    this.totalEvents++;
    this.totalCost += 0.0000012 * size + 0.00002;
    this.events.unshift(evt);
    if (this.events.length > 300) this.events.pop();
    this.liveQueue.unshift(evt);
    if (this.liveQueue.length > 60) this.liveQueue.pop();
  }

  private updateStageMetrics() {
    const recent = this.events.slice(0, 80);
    for (const sm of this.stageMetrics) {
      const stageEvents = recent.filter((e) => e.traces.some((t) => t.stage === sm.stage));
      const okEvents = stageEvents.filter((e) => e.status !== 'failed');
      sm.processed = this.totalEvents;
      sm.throughput = this.currentThroughput();
      const durs = stageEvents.map((e) => e.traces.find((t) => t.stage === sm.stage)?.durationMs ?? 0).filter(Boolean);
      durs.sort((a, b) => a - b);
      sm.p95 = durs.length > 0 ? durs[Math.floor(durs.length * 0.95)] : 0;
      const errs = stageEvents.filter((e) => e.status === 'failed').length;
      sm.errorRate = stageEvents.length > 0 ? (errs / stageEvents.length) * 100 : 0;
      sm.queueDepth = sm.stage === 'queue' ? Math.round(this.liveQueue.length * 1.5 + randBetween(0, 20)) : 0;
      sm.coldStarts += sm.stage === 'ingest' && this.failureMode === 'cold_start' && Math.random() < 0.1 ? 1 : 0;
      sm.status = sm.errorRate > 8 ? 'error' : sm.errorRate > 3 || sm.queueDepth > 80 ? 'degraded' : 'healthy';
    }
  }

  currentThroughput(): number {
    return this.injectionRate * (this.running ? 1 : 0) + randBetween(-5, 5);
  }
  currentP95(): number {
    const base = this.failureMode === 'cold_start' ? 180 : this.failureMode === 'storage_fail' ? 120 : 45;
    return base + randBetween(-10, 15);
  }
  currentErrorRate(): number {
    return this.failureMode !== 'none' ? randBetween(4, 9) : randBetween(0.2, 1.2);
  }
  costPerEvent(): number {
    return this.totalEvents > 0 ? this.totalCost / this.totalEvents : 0;
  }
  recoveryTime(): number {
    return this.failureMode === 'none' ? 0 : randBetween(800, 2400);
  }
  uptimePct(): number {
    return 99.94 + randBetween(-0.05, 0.05);
  }

  reset() {
    this.events = [];
    this.liveQueue = [];
    this.history = [];
    this.totalEvents = 0;
    this.totalErrors = 0;
    this.totalRetries = 0;
    this.totalCost = 0;
    this.seq = 0;
    this.emit();
  }
}

export const engine = new PipelineEngine();
