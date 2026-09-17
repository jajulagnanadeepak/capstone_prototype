import { Cloud, Boxes, Workflow, Database, BarChart3, ArrowRight, Settings } from 'lucide-react';
import { Panel, Chip } from '@/components/ui';
import { engine } from '@/lib/engine';
import { useEngine } from '@/lib/useEngine';

export function ConfigurationPage() {
  useEngine();

  const stages = [
    {
      icon: Cloud,
      name: 'Events',
      component: 'API Gateway / Webhook',
      config: [
        { k: 'Protocol', v: 'HTTPS + WebSocket' },
        { k: 'Auth', v: 'API Key + JWT' },
        { k: 'Rate Limit', v: '500 req/s' },
        { k: 'Compression', v: 'gzip' },
      ],
    },
    {
      icon: Boxes,
      name: 'Lambda / Workers',
      component: 'AWS Lambda (Node 20)',
      config: [
        { k: 'Memory', v: '512 MB' },
        { k: 'Timeout', v: '15s' },
        { k: 'Concurrency', v: '10 provisioned / 100 reserved' },
        { k: 'Runtime', v: 'nodejs20.x' },
      ],
    },
    {
      icon: Boxes,
      name: 'SQS / Kafka',
      component: 'Amazon SQS + DLQ',
      config: [
        { k: 'Visibility Timeout', v: '30s' },
        { k: 'Batch Size', v: '10' },
        { k: 'Max Receive Count', v: '3' },
        { k: 'DLQ Redrive', v: 'enabled' },
      ],
    },
    {
      icon: Workflow,
      name: 'Transform',
      component: 'Lambda (Node 20)',
      config: [
        { k: 'Schema Version', v: '2.1.0' },
        { k: 'Validation', v: 'JSON Schema + Avro' },
        { k: 'Idempotency Key', v: 'event_id + source' },
        { k: 'Memory', v: '1024 MB' },
      ],
    },
    {
      icon: Database,
      name: 'DuckDB',
      component: 'S3 + DuckDB Analytics',
      config: [
        { k: 'Format', v: 'Parquet (columnar)' },
        { k: 'Compression', v: 'ZSTD' },
        { k: 'Partition', v: 'region/date/type' },
        { k: 'Index', v: 'BRIN on timestamp' },
      ],
    },
    {
      icon: BarChart3,
      name: 'Analytics',
      component: 'DuckDB + CloudWatch',
      config: [
        { k: 'Rollup', v: '1-minute aggregates' },
        { k: 'Retention', v: '90 days hot / 1yr cold' },
        { k: 'Dashboard', v: 'Grafana + CloudWatch' },
        { k: 'SLO', v: '99.9% availability' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <Panel title="Pipeline Architecture" icon={<Settings size={16} className="text-accent-400" />}>
        <div className="p-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {stages.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.name} className="flex items-center gap-2">
                  <div className="flex min-w-[140px] flex-col items-center gap-2 rounded-xl border border-base-700/60 bg-base-850/60 p-3 text-center">
                    <Icon size={20} className="text-accent-400" />
                    <div>
                      <div className="text-sm font-semibold text-slate-200">{s.name}</div>
                      <div className="text-[10px] text-slate-500">{s.component}</div>
                    </div>
                  </div>
                  {i < stages.length - 1 && <ArrowRight size={16} className="text-slate-600 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      </Panel>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {stages.map((s) => {
          const Icon = s.icon;
          return (
            <Panel key={s.name} title={s.name} icon={<Icon size={16} className="text-accent-400" />} action={<Chip color="neutral">{s.component}</Chip>}>
              <div className="divide-y divide-base-700/30">
                {s.config.map((c) => (
                  <div key={c.k} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-slate-500">{c.k}</span>
                    <span className="tabular text-slate-200">{c.v}</span>
                  </div>
                ))}
              </div>
            </Panel>
          );
        })}
      </div>

      <Panel title="Environment Variables" icon={<Settings size={16} className="text-accent-400" />}>
        <div className="p-4">
          <pre className="overflow-x-auto rounded-lg bg-base-950/80 p-3 text-xs font-mono leading-relaxed text-slate-300">{`# Pipeline Configuration
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789/event-queue
DLQ_URL=https://sqs.us-east-1.amazonaws.com/123456789/event-dlq
SCHEMA_REGISTRY=https://schema-registry.internal/v2
DUCKDB_PATH=s3://analytics-warehouse/events/
LAMBDA_MEMORY=512
MAX_CONCURRENCY=100
BATCH_SIZE=10
VISIBILITY_TIMEOUT=30
LOG_LEVEL=info
OTEL_ENDPOINT=https://otel-collector.internal:4318`}</pre>
        </div>
      </Panel>
    </div>
  );
}
