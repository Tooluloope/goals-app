'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertCircle,
  Calendar,
  Clock,
  Target,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { useNotifications } from '@/hooks/use-notifications';
import { useProjects } from '@/hooks/use-projects';
import { isReviewDue, isDeadlineApproaching, formatDate } from '@/lib/utils';

export function NotificationSummaryModal() {
  const router = useRouter();
  const { showNotificationSummary, setShowNotificationSummary } = useUIStore();
  const { currentWorkspace } = useAuthStore();
  const { getStatusesForWorkspace, getCadencesForWorkspace, getTaskStatusesForWorkspace } = useConfigStore();
  const { data: notifications } = useNotifications();
  const { data: projects } = useProjects();

  const statuses = currentWorkspace ? getStatusesForWorkspace(currentWorkspace.id) : [];
  const cadences = currentWorkspace ? getCadencesForWorkspace(currentWorkspace.id) : [];
  const taskStatuses = currentWorkspace ? getTaskStatusesForWorkspace(currentWorkspace.id) : [];

  const doingStatusId = statuses.find(s => s.name === 'Doing')?.id || 'status-doing';
  const doneTaskStatusIds = taskStatuses.filter(s => s.name === 'Done').map(s => s.id);

  // Calculate summary data
  const unreadNotifications = notifications?.filter((n) => !n.readAt) || [];
  const doingProjects = projects?.filter((p) => p.statusId === doingStatusId) || [];
  const reviewsDue = doingProjects.filter(p => isReviewDue(p, cadences));
  const upcomingDeadlines = doingProjects.filter((p) =>
    isDeadlineApproaching(p.targetDate, 30)
  );

  // Get tasks due soon
  const tasksDueSoon = doingProjects.flatMap((p) =>
    p.tasks
      .filter((t) => !doneTaskStatusIds.includes(t.statusId) && t.dueDate)
      .map((t) => ({ task: t, project: p }))
  );

  const hasItems =
    unreadNotifications.length > 0 ||
    reviewsDue.length > 0 ||
    upcomingDeadlines.length > 0;

  // Auto-close if no items
  useEffect(() => {
    if (showNotificationSummary && !hasItems) {
      setShowNotificationSummary(false);
    }
  }, [showNotificationSummary, hasItems, setShowNotificationSummary]);

  if (!hasItems) return null;

  return (
    <Dialog open={showNotificationSummary} onOpenChange={setShowNotificationSummary}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Welcome Back
          </DialogTitle>
          <DialogDescription>
            Here&apos;s a quick summary of what needs your attention today.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4">
            {/* Notifications */}
            {unreadNotifications.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  {unreadNotifications.length} unread notification
                  {unreadNotifications.length !== 1 && 's'}
                </div>
                <div className="space-y-2">
                  {unreadNotifications.slice(0, 3).map((notification) => (
                    <div
                      key={notification.id}
                      className="rounded-lg border bg-card p-3"
                    >
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.body}
                      </p>
                    </div>
                  ))}
                  {unreadNotifications.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{unreadNotifications.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Reviews Due */}
            {reviewsDue.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {reviewsDue.length} review{reviewsDue.length !== 1 && 's'} due
                </div>
                <div className="flex flex-wrap gap-2">
                  {reviewsDue.map((project) => (
                    <Badge key={project.id} variant="outline" className="py-1">
                      {project.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Deadlines */}
            {upcomingDeadlines.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Deadlines approaching
                </div>
                <div className="space-y-2">
                  {upcomingDeadlines.slice(0, 3).map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between rounded-lg border bg-card p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{project.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(project.targetDate, 'MMM d')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full"
            onClick={() => {
              setShowNotificationSummary(false);
              router.push('/dashboard');
            }}
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setShowNotificationSummary(false)}
          >
            Dismiss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
