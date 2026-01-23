import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import { BaseProps, CTA, ThemeType } from '../types';

const defaultApp = 'Goals';
const defaultLogoUrl = 'https://goals-app.com/logo.png';

// Theme colors
const themes: Record<ThemeType, { bg: string; light: string; text: string }> = {
  primary: { bg: '#4f46e5', light: '#eef2ff', text: '#312e81' },
  success: { bg: '#10b981', light: '#ecfdf5', text: '#065f46' },
  warning: { bg: '#f59e0b', light: '#fffbeb', text: '#92400e' },
  danger: { bg: '#ef4444', light: '#fef2f2', text: '#991b1b' },
  purple: { bg: '#8b5cf6', light: '#f5f3ff', text: '#5b21b6' },
  blue: { bg: '#3b82f6', light: '#eff6ff', text: '#1e40af' },
};

export type LayoutProps = BaseProps & {
  preview: string;
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
  action?: CTA;
  theme?: ThemeType;
  icon?: React.ReactNode;
  headerBg?: boolean;
  celebration?: string;
};

const styles = `
  .card { @apply overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg; }
  .header { @apply p-7 text-center; }
  .header-gradient { background: linear-gradient(135deg, var(--theme-bg) 0%, var(--theme-bg-light) 100%); }
  .content { @apply p-7; }
  .pill { @apply inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide; }
  .btn { @apply inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white no-underline shadow-lg; }
  .btn-secondary { @apply bg-slate-100 text-slate-700 shadow-none; }
  .muted { @apply text-slate-500; }
  .divider { @apply my-6 h-px bg-slate-200; }
  .metric-card { @apply rounded-xl bg-slate-50 p-4 text-center; }
  .metric-value { @apply text-2xl font-bold; }
  .metric-label { @apply text-xs uppercase tracking-wide text-slate-500; }
  .highlight-box { @apply rounded-xl border-l-4 p-4; }
  .info-row { @apply flex items-center justify-between border-b border-slate-100 py-3 text-sm; }
  .info-row:last-child { @apply border-b-0; }
  .footer { @apply border-t border-slate-100 bg-slate-50 p-6 text-center; }
  .celebration-emoji { @apply mb-4 text-5xl; }
  .streak-badge { @apply inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 font-bold text-white; }
  .avatar { @apply flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold; }
  .icon-wrapper { @apply mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl; }
`;

export function Layout({
  preview,
  title,
  intro,
  children,
  action,
  supportUrl = '#',
  unsubscribeUrl = '#',
  appName = defaultApp,
  logoUrl = defaultLogoUrl,
  theme = 'primary',
  icon,
  headerBg = false,
  celebration,
}: LayoutProps) {
  const themeColors = themes[theme];

  return (
    <Html>
      <Head>
        <style>{`
          :root {
            --theme-bg: ${themeColors.bg};
            --theme-bg-light: ${themeColors.bg}dd;
            --theme-light: ${themeColors.light};
            --theme-text: ${themeColors.text};
          }
        `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Tailwind config={{ theme: { extend: { colors: { primary: themeColors.bg } } } }}>
        <style>{styles}</style>
        <Body className="bg-gradient-to-b from-slate-50 to-slate-100 font-sans text-slate-900">
          <Container className="mx-auto my-10 max-w-xl px-4">
            <Section className="card">
              {/* Header */}
              <div
                className="header"
                style={{
                  background: headerBg
                    ? `linear-gradient(135deg, ${themeColors.bg} 0%, ${themeColors.bg}dd 100%)`
                    : '#ffffff',
                  color: headerBg ? '#ffffff' : themeColors.bg,
                }}
              >
                {celebration && <div className="celebration-emoji">{celebration}</div>}
                {icon && (
                  <div
                    className="icon-wrapper"
                    style={{
                      background: headerBg ? 'rgba(255,255,255,0.15)' : themeColors.light,
                    }}
                  >
                    {icon}
                  </div>
                )}
                {logoUrl && !icon && (
                  <Img
                    src={logoUrl}
                    alt={appName}
                    width={48}
                    height={48}
                    className="mx-auto mb-3"
                  />
                )}
                <Text
                  className="m-0 text-2xl font-extrabold tracking-tight"
                  style={{ color: headerBg ? '#ffffff' : themeColors.bg }}
                >
                  {appName}
                </Text>
              </div>

              {/* Content */}
              <div className="content">
                <h1 className="m-0 mb-2 text-2xl font-bold tracking-tight text-slate-900">
                  {title}
                </h1>
                {intro && (
                  <Text className="m-0 mb-6 text-base leading-relaxed text-slate-500">{intro}</Text>
                )}
                <div className="space-y-4 text-sm leading-relaxed text-slate-700">{children}</div>
                {action?.href && (
                  <div className="mt-8 text-center">
                    <a
                      href={action.href}
                      className="btn"
                      style={{
                        background: `linear-gradient(135deg, ${themeColors.bg} 0%, ${themeColors.bg}cc 100%)`,
                        boxShadow: `0 4px 14px ${themeColors.bg}40`,
                      }}
                    >
                      {action.label || 'Open'}
                    </a>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="footer">
                <Text className="m-0 text-xs leading-relaxed text-slate-400">
                  You're receiving this email because you have an account with {appName}.
                </Text>
                <Text className="m-0 mt-3 text-xs text-slate-400">
                  <a href={supportUrl} className="text-slate-500 no-underline hover:underline">
                    Help Center
                  </a>
                  <span className="mx-2 text-slate-300">•</span>
                  <a href={unsubscribeUrl} className="text-slate-500 no-underline hover:underline">
                    Unsubscribe
                  </a>
                </Text>
              </div>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

// Helper components for templates
export function HighlightBox({
  children,
  theme = 'primary',
  className = '',
}: {
  children: React.ReactNode;
  theme?: ThemeType;
  className?: string;
}) {
  const themeColors = themes[theme];
  return (
    <div
      className={`highlight-box ${className}`}
      style={{ background: themeColors.light, borderColor: themeColors.bg }}
    >
      {children}
    </div>
  );
}

export function MetricsGrid({
  metrics,
  theme = 'primary',
}: {
  metrics: { label: string; value: string }[];
  theme?: ThemeType;
}) {
  const themeColors = themes[theme];
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        margin: '20px 0',
      }}
    >
      {metrics.map((metric, i) => (
        <div key={i} className="metric-card">
          <div className="metric-value" style={{ color: themeColors.bg }}>
            {metric.value}
          </div>
          <div className="metric-label">{metric.label}</div>
        </div>
      ))}
    </div>
  );
}

export function InfoRows({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      {items.map((item, i) => (
        <div key={i} className="info-row">
          <span className="text-slate-500">{item.label}</span>
          <span className="font-semibold text-slate-900">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export function StreakBadge({ days }: { days: number }) {
  return (
    <div className="my-6 text-center">
      <div className="streak-badge">
        <span>🔥</span>
        <span>{days} days</span>
      </div>
    </div>
  );
}

export function Avatar({ name, theme = 'primary' }: { name: string; theme?: ThemeType }) {
  const themeColors = themes[theme];
  return (
    <div className="avatar" style={{ background: themeColors.light, color: themeColors.bg }}>
      {name[0].toUpperCase()}
    </div>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="m-0 list-none p-0">
      {items.map((item, i) => (
        <li
          key={i}
          className="relative border-b border-slate-100 py-2.5 pl-7 text-sm last:border-b-0"
        >
          <span className="absolute left-0 font-bold text-emerald-500">✓</span>
          {item}
        </li>
      ))}
    </ul>
  );
}
