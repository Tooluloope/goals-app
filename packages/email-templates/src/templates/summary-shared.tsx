import * as React from 'react';
import { Text } from '@react-email/components';
import { Layout } from '../components/Layout';
import { SummaryProps } from '../types';

function Metrics({ metrics }: { metrics?: { label: string; value: string }[] }) {
  if (!metrics?.length) return null;
  return (
    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
      {metrics.map((m) => (
        <div key={m.label} className="metric-row">
          <span className="muted">{m.label}</span>
          <strong>{m.value}</strong>
        </div>
      ))}
    </div>
  );
}

function Bullets({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-800">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function SummaryTemplate({
  heading,
  preview,
  actionLabel,
  ...props
}: SummaryProps & { heading: string; preview: string; actionLabel: string }) {
  return (
    <Layout
      preview={preview}
      title={`${props.periodLabel} ${heading}`}
      intro={`Here’s what stood out in ${props.periodLabel.toLowerCase()}.`}
      action={props.action ?? { label: actionLabel, href: '#' }}
      {...props}
    >
      <Metrics metrics={props.metrics} />
      <Bullets items={props.highlights} />
      <Text className="muted text-xs">Tap through for deeper AI insights.</Text>
    </Layout>
  );
}
