'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';

// Query keys
export const notificationKeys = {
  all: ['notifications'] as const,
  user: (userId: string) => [...notificationKeys.all, 'user', userId] as const,
  unreadCount: (userId: string) => [...notificationKeys.all, 'unreadCount', userId] as const,
};

// Fetch notifications for current user
export function useNotifications() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: notificationKeys.user(user?.id ?? ''),
    queryFn: () => apiClient.getNotifications(),
    enabled: !!user,
  });
}

// Fetch unread count
export function useUnreadNotificationsCount() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: notificationKeys.unreadCount(user?.id ?? ''),
    queryFn: () => apiClient.getUnreadNotificationsCount(),
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Mark notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (notificationId: string) => apiClient.markNotificationRead(notificationId),
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: notificationKeys.user(user.id) });
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(user.id) });
      }
    },
  });
}

// Mark all notifications as read
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: () => apiClient.markAllNotificationsRead(),
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: notificationKeys.user(user.id) });
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(user.id) });
      }
    },
  });
}
