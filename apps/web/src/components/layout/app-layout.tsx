'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Sidebar } from './sidebar';
import { BottomNav } from './bottom-nav';
import { Header } from './header';
import { useAuthStore } from '@/store/auth-store';
import { NotificationSummaryModal } from '@/components/notifications/notification-summary-modal';
import { AddProjectModal } from '@/components/shared/add-project-modal';
import { AddTaskModal } from '@/components/shared/add-task-modal';
import { AddReviewModal } from '@/components/shared/add-review-modal';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
}

export function AppLayout({ children, title, showHeader = true }: AppLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking auth
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        {showHeader && <Header title={title} />}

        {/* Page Content */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>

        {/* Mobile Bottom Nav */}
        <BottomNav />
      </div>

      {/* Global Modals */}
      <NotificationSummaryModal />
      <AddProjectModal />
      <AddTaskModal />
      <AddReviewModal />
    </div>
  );
}
