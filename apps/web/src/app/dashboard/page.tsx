'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/app-layout';
import { DailyFocus } from '@/components/dashboard/daily-focus';
import { UpcomingDeadlines } from '@/components/dashboard/upcoming-deadlines';
import { ReviewsDue } from '@/components/dashboard/reviews-due';
import { StaleProjects } from '@/components/dashboard/stale-projects';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { ProgressStats } from '@/components/dashboard/progress-stats';
import { AiInsightsPanel } from '@/components/ai/ai-insights-panel';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';

export default function DashboardPage() {
  const router = useRouter();
  const { user, currentWorkspace } = useAuthStore();
  const today = new Date();
  const greeting = getGreeting();

  // Redirect to Family Hub if in family workspace
  useEffect(() => {
    if (currentWorkspace?.type === 'family') {
      router.replace('/family');
    }
  }, [currentWorkspace, router]);

  function getGreeting() {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  return (
    <AppLayout title="Today">
      <div className="container max-w-4xl px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold md:text-3xl">
            {greeting}, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="mt-1 text-muted-foreground">{format(today, 'EEEE, MMMM d, yyyy')}</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <QuickActions />
        </div>

        {/* Progress Stats */}
        <div className="mb-6">
          <ProgressStats />
        </div>

        {/* Dashboard Grid */}
        <div className="space-y-6">
          {/* Daily Focus - Most Important */}
          <DailyFocus />

          {/* Two Column Grid for Desktop */}
          <div className="grid gap-6 md:grid-cols-2">
            <UpcomingDeadlines />
            <ReviewsDue />
          </div>

          {/* AI Insights */}
          <Card className="p-0 overflow-hidden">
            <AiInsightsPanel className="p-4" />
          </Card>

          {/* Stale Projects Warning */}
          <StaleProjects />
        </div>
      </div>
    </AppLayout>
  );
}
