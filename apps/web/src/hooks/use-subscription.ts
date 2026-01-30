'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export const subscriptionKeys = {
  status: ['subscription', 'status'] as const,
};

export function useSubscriptionStatus(enabled = true) {
  return useQuery({
    queryKey: subscriptionKeys.status,
    queryFn: () => apiClient.getSubscriptionStatus(),
    enabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
