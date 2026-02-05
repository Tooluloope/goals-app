'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Sidebar } from './sidebar';
import { BottomNav } from './bottom-nav';
import { Header } from './header';
import { useAuthStore, useViewMode } from '@/store/auth-store';
import { NotificationSummaryModal } from '@/components/notifications/notification-summary-modal';
import { AddProjectModal } from '@/components/shared/add-project-modal';
import { AddTaskModal } from '@/components/shared/add-task-modal';
import { AddReviewModal } from '@/components/shared/add-review-modal';
import { HabitSuggestionWizard } from '@/components/habits/habit-suggestion-wizard';
import { getFocusModeRedirect } from '@/lib/mode-guard';
import { getPlanRequirement, hasPlanAccess } from '@/lib/plan-guard';
import { useSubscriptionStatus } from '@/hooks/use-subscription';
import { UpgradePrompt } from '@/components/subscription/upgrade-prompt';
import { EmailVerificationPrompt } from '@/components/auth/email-verification-prompt';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
}

export function AppLayout({ children, title, showHeader = true }: AppLayoutProps) {
  const { isAuthenticated, user } = useAuthStore();
  const viewMode = useViewMode();
  const pathname = usePathname();
  const router = useRouter();
  const planRequirement = getPlanRequirement(pathname ?? '');
  const { data: subscription, isLoading: isSubscriptionLoading } = useSubscriptionStatus(
    Boolean(planRequirement) && isAuthenticated
  );
  const isEmailVerified = Boolean(user?.emailVerifiedAt);
  const isViewModeReady = isAuthenticated && Boolean(user);

  // Mode guard - redirect Focus Mode users from Power Mode routes
  useEffect(() => {
    if (!isViewModeReady) return;
    const redirectPath = getFocusModeRedirect(pathname ?? '', viewMode);
    if (redirectPath) {
      router.replace(redirectPath);
    }
  }, [pathname, viewMode, router, isViewModeReady]);

  // AuthGuard handles redirect to login and saves return URL
  // Show loading while auth is being checked
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  let content = children;

  if (isAuthenticated && user && !isEmailVerified) {
    content = <EmailVerificationPrompt email={user.email} />;
  } else if (planRequirement) {
    if (isSubscriptionLoading) {
      content = (
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    } else if (!hasPlanAccess(subscription?.plan, planRequirement.requiredPlan)) {
      content = (
        <UpgradePrompt
          requiredPlan={planRequirement.requiredPlan}
          title={planRequirement.title}
          description={planRequirement.description}
        />
      );
    }
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        {showHeader && <Header title={title} />}

        {/* Page Content */}
        <main className="flex-1 overflow-y-scroll overflow-x-hidden pb-20 md:pb-0 overscroll-contain scrollbar-stable">
          {content}
        </main>

        {/* Mobile Bottom Nav */}
        <BottomNav />
      </div>

      {/* Global Modals */}
      <NotificationSummaryModal />
      <AddProjectModal />
      <AddTaskModal />
      <AddReviewModal />
      <HabitSuggestionWizard />
    </div>
  );
}
