'use client';

import { useRouter } from 'next/navigation';
import {
  Bell,
  Clock,
  AlertTriangle,
  Calendar,
  Target,
  CheckCircle,
  Check,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/use-notifications';
import { Notification, NotificationType } from '@/types';
import { formatRelativeTime, cn } from '@/lib/utils';

const notificationConfig: Record<
  NotificationType,
  { icon: typeof Bell; color: string; bgColor: string }
> = {
  DueSoon: {
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  Overdue: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  ReviewDue: {
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  StaleProject: {
    icon: Target,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  DailyFocus: {
    icon: CheckCircle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
};

export default function NotificationsPage() {
  const router = useRouter();
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadNotifications = notifications?.filter((n) => !n.readAt) || [];
  const readNotifications = notifications?.filter((n) => n.readAt) || [];

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.readAt) {
      await markRead.mutateAsync(notification.id);
    }

    if (notification.projectId) {
      router.push(`/project/${notification.projectId}`);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Notifications">
        <div className="container max-w-2xl px-4 py-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </AppLayout>
    );
  }

  const NotificationItem = ({
    notification,
    isRead,
  }: {
    notification: Notification;
    isRead: boolean;
  }) => {
    const config = notificationConfig[notification.type];
    const Icon = config.icon;

    return (
      <button
        onClick={() => handleNotificationClick(notification)}
        className={cn(
          'w-full text-left rounded-xl border p-4 transition-all hover:shadow-sm',
          !isRead && 'bg-primary/5 border-primary/20',
          isRead && 'bg-card'
        )}
      >
        <div className="flex gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              config.bgColor
            )}
          >
            <Icon className={cn('h-5 w-5', config.color)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className={cn('font-medium', !isRead && 'text-primary')}>
                {notification.title}
              </p>
              {!isRead && (
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {notification.body}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatRelativeTime(notification.createdAt)}
            </p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <AppLayout title="Notifications">
      <div className="container max-w-2xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              Stay updated on your goals and tasks
            </p>
          </div>
          {unreadNotifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <Check className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>

        {/* No Notifications */}
        {(!notifications || notifications.length === 0) && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">All caught up!</h3>
              <p className="text-muted-foreground mt-1 text-center">
                You have no notifications at the moment.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Unread Notifications */}
        {unreadNotifications.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-semibold">Unread</h2>
              <Badge variant="secondary">{unreadNotifications.length}</Badge>
            </div>
            <div className="space-y-3">
              {unreadNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  isRead={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Read Notifications */}
        {readNotifications.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3">Earlier</h2>
            <div className="space-y-3">
              {readNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  isRead={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
