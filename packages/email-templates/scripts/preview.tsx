import { render } from '@react-email/render';
import { WelcomeEmail, WeeklySummaryEmail } from '../src';

const templates = {
  welcome: (href?: string) => (
    <WelcomeEmail action={{ label: 'Launch app', href: href || '#' }} toName="Tolu" />
  ),
  weekly: (href?: string) => (
    <WeeklySummaryEmail
      periodLabel="This week"
      metrics={[
        { label: 'Habits completed', value: '21/28' },
        { label: 'Streak', value: '5 days' },
        { label: 'Journaled', value: '4 days' },
      ]}
      highlights={[
        'Most consistent: Morning run',
        'Try focusing on hydration habit',
        'Mood trend: steady improvement',
      ]}
      action={{ label: 'Open dashboard', href: href || '#' }}
    />
  ),
} as const;

const name = process.argv[2] as keyof typeof templates;
if (!name || !templates[name]) {
  console.log('Usage: pnpm --filter email-templates preview <welcome|weekly>');
  process.exit(1);
}

const html = render(templates[name]('#'));
console.log(html);
