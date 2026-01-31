'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { useAuthStore, useViewMode } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { setShouldShowOnboarding } from '@/lib/onboarding';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, currentWorkspace } = useAuthStore();
  const updateSettings = useAuthStore((state) => state.updateSettings);
  const viewMode = useViewMode();
  const today = new Date();
  const greeting = getGreeting();

  // Redirect to Family Hub if in family workspace
  useEffect(() => {
    if (currentWorkspace?.type === 'family') {
      router.replace('/family');
    }
  }, [currentWorkspace, router]);

  useEffect(() => {
    const checkout = searchParams?.get('checkout');
    if (!checkout) {
      return;
    }

    let isActive = true;
    const syncSubscription = async () => {
      try {
        setShouldShowOnboarding(true);
        if (checkout === 'cancelled') {
          await updateSettings({ viewMode: 'focus' });
          toast({
            title: 'Checkout cancelled',
            description: 'Your subscription was not completed. You can upgrade anytime.',
            variant: 'default',
          });
          return;
        }

        let subscription = await apiClient.getSubscriptionStatus();
        if (checkout === 'success' && subscription.plan === 'FREE') {
          for (let attempt = 0; attempt < 2; attempt += 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            subscription = await apiClient.getSubscriptionStatus();
            if (subscription.plan !== 'FREE') break;
          }
        }
        if (!isActive) return;

        if (subscription.plan !== 'FREE') {
          await updateSettings({ viewMode: 'power' });
          toast({
            title: 'Subscription active',
            description: 'Power Mode is now enabled on your account.',
            variant: 'success',
          });
        } else {
          toast({
            title: 'Subscription pending',
            description: 'Your payment is still processing. Please refresh in a moment.',
            variant: 'default',
          });
        }
      } catch (error) {
        console.error('Failed to sync subscription status:', error);
        if (isActive) {
          toast({
            title: 'Subscription check failed',
            description: 'We could not confirm your plan yet. Try refreshing soon.',
            variant: 'default',
          });
        }
      } finally {
        router.replace('/dashboard');
      }
    };

    syncSubscription();
    return () => {
      isActive = false;
    };
  }, [searchParams, updateSettings, toast, router]);

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

          {/* AI Insights - Only in Power Mode */}
          {viewMode === 'power' && (
            <Card className="p-0 overflow-hidden">
              <AiInsightsPanel className="p-4" />
            </Card>
          )}

          {/* Stale Projects Warning */}
          <StaleProjects />
        </div>
      </div>
    </AppLayout>
  );
}
