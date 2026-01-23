'use client';

import dynamic from 'next/dynamic';
import { Suspense, useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles } from 'lucide-react';

const templates = {
  welcome: dynamic(() => import('email-templates').then((m) => m.WelcomeEmail)),
  verifyEmail: dynamic(() => import('email-templates').then((m) => m.VerifyEmail)),
  resetPassword: dynamic(() => import('email-templates').then((m) => m.ResetPassword)),
  passwordChanged: dynamic(() => import('email-templates').then((m) => m.PasswordChanged)),
  workspaceInvite: dynamic(() => import('email-templates').then((m) => m.WorkspaceInvite)),
  habitReminder: dynamic(() => import('email-templates').then((m) => m.HabitReminder)),
  journalNudge: dynamic(() => import('email-templates').then((m) => m.JournalNudge)),
  weeklySummary: dynamic(() => import('email-templates').then((m) => m.WeeklySummaryEmail)),
  monthlySummary: dynamic(() => import('email-templates').then((m) => m.MonthlySummaryEmail)),
  yearlyReview: dynamic(() => import('email-templates').then((m) => m.YearlyReviewEmail)),
  securityAlert: dynamic(() => import('email-templates').then((m) => m.SecurityAlertEmail)),
};

const templateDefaults: Record<string, any> = {
  welcome: { toName: 'Tolu', action: { label: 'Launch app', href: '#' } },
  verifyEmail: { action: { label: 'Verify email', href: '#' } },
  resetPassword: { action: { label: 'Reset password', href: '#' } },
  passwordChanged: { action: { label: 'Secure account', href: '#' } },
  workspaceInvite: {
    inviterName: 'Alex',
    workspaceName: 'Growth Squad',
    action: { label: 'Accept invite', href: '#' },
  },
  habitReminder: {
    habitName: 'Morning Run',
    streak: 4,
    action: { label: 'Open today’s habits', href: '#' },
  },
  journalNudge: { journalDate: 'Today', action: { label: 'Open journal', href: '#' } },
  weeklySummary: {
    periodLabel: 'This week',
    metrics: [
      { label: 'Habits completed', value: '21/28' },
      { label: 'Streak', value: '5 days' },
      { label: 'Journaled', value: '4 days' },
    ],
    highlights: ['Most consistent: Morning run', 'Focus on hydration', 'Mood trend: up'],
    action: { label: 'Open dashboard', href: '#' },
  },
  monthlySummary: {
    periodLabel: 'January',
    metrics: [
      { label: 'Completion rate', value: '76%' },
      { label: 'Top habit', value: 'Reading' },
    ],
    highlights: ['Longest streak: 12 days', 'Try adding strength twice weekly'],
    action: { label: 'See details', href: '#' },
  },
  yearlyReview: {
    periodLabel: '2025',
    metrics: [
      { label: 'Total habits done', value: '612' },
      { label: 'Avg streak', value: '7 days' },
    ],
    highlights: ['Morning routine is your anchor', 'Hydration was most improved habit'],
    action: { label: 'Open full review', href: '#' },
  },
  securityAlert: {
    location: 'Lagos, NG',
    device: 'MacOS • Chrome',
    time: 'Just now',
    action: { label: 'Review activity', href: '#' },
  },
};

export default function EmailPreviewPage() {
  const [selected, setSelected] = useState<keyof typeof templates>('welcome');
  const [actionHref, setActionHref] = useState('#');

  const TemplateComponent = templates[selected];
  const defaults = templateDefaults[selected];
  const props = useMemo(
    () => ({ ...defaults, action: { ...defaults?.action, href: actionHref || '#' } }),
    [defaults, actionHref]
  );

  return (
    <AppLayout title="Email Previews" showHeader={false}>
      <div className="flex min-h-screen bg-muted/40">
        <div className="w-full space-y-4 px-4 py-6 md:px-8">
          <Alert className="border-primary/30 bg-primary/5">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              This page renders React Email templates with Tailwind. Use it like a mini Storybook.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">Pick a template</CardTitle>
                <p className="text-sm text-muted-foreground">Live render below; tweak CTA link.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Select value={selected} onValueChange={(v) => setSelected(v as any)}>
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(templates).map((key) => (
                      <SelectItem key={key} value={key}>
                        {key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Input
                    value={actionHref}
                    onChange={(e) => setActionHref(e.target.value)}
                    placeholder="CTA link"
                    className="w-64"
                  />
                  <Button variant="outline" onClick={() => setActionHref('#')}>
                    Reset link
                  </Button>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-[340px_1fr]">
                <div className="border-r bg-muted/30 p-4 space-y-3 text-sm">
                  <p className="font-semibold">Defaults</p>
                  <pre className="overflow-auto rounded-lg bg-background p-3 text-xs text-muted-foreground">
                    {JSON.stringify(defaults, null, 2)}
                  </pre>
                </div>
                <div className="min-h-[70vh] bg-white">
                  <ScrollArea className="h-full">
                    <div className="bg-white p-6">
                      <Suspense fallback={<div className="p-6">Loading template...</div>}>
                        <TemplateComponent {...props} />
                      </Suspense>
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
