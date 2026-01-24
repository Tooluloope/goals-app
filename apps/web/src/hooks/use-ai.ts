'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import type { SummaryType } from '@goals/shared';

// Query keys - now include workspaceId for proper cache isolation
export const aiKeys = {
  all: ['ai'] as const,
  // Conversations
  conversations: (workspaceId: string) => [...aiKeys.all, 'conversations', workspaceId] as const,
  conversationsList: (workspaceId: string, limit?: number) =>
    [...aiKeys.conversations(workspaceId), 'list', { limit }] as const,
  conversationDetail: (id: string) => [...aiKeys.all, 'conversations', 'detail', id] as const,
  // Summaries
  summaries: (workspaceId: string) => [...aiKeys.all, 'summaries', workspaceId] as const,
  summariesList: (workspaceId: string, type?: SummaryType, limit?: number) =>
    [...aiKeys.summaries(workspaceId), 'list', { type, limit }] as const,
  weeklySummary: (workspaceId: string, weekStart: string) =>
    [...aiKeys.summaries(workspaceId), 'weekly', weekStart] as const,
  monthlySummary: (workspaceId: string, month: string) =>
    [...aiKeys.summaries(workspaceId), 'monthly', month] as const,
  yearlySummary: (workspaceId: string, year: string) =>
    [...aiKeys.summaries(workspaceId), 'yearly', year] as const,
  // Insights
  insights: (workspaceId: string) => [...aiKeys.all, 'insights', workspaceId] as const,
  insightsList: (workspaceId: string, type?: string, includeDismissed?: boolean) =>
    [...aiKeys.insights(workspaceId), 'list', { type, includeDismissed }] as const,
  // Daily Text
  dailyText: (workspaceId: string) => [...aiKeys.all, 'daily-text', workspaceId] as const,
};

// ============================================================
// CONVERSATIONS
// ============================================================

// Fetch all conversations for current workspace
export function useAiConversations(limit?: number) {
  const { currentWorkspace } = useAuthStore();
  const workspaceId = currentWorkspace?.id || '';

  return useQuery({
    queryKey: aiKeys.conversationsList(workspaceId, limit),
    queryFn: () => apiClient.getAiConversations(workspaceId, limit),
    enabled: !!workspaceId,
  });
}

// Fetch single conversation with messages
export function useAiConversation(id: string) {
  return useQuery({
    queryKey: aiKeys.conversationDetail(id),
    queryFn: () => apiClient.getAiConversation(id),
    enabled: !!id,
  });
}

// Create conversation mutation
export function useCreateAiConversation() {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useAuthStore();
  const workspaceId = currentWorkspace?.id || '';

  return useMutation({
    mutationFn: (title?: string) => apiClient.createAiConversation(workspaceId, title),
    onSuccess: (newConversation) => {
      queryClient.setQueryData(aiKeys.conversationDetail(newConversation.id), {
        ...newConversation,
        messages: [],
      });
      queryClient.invalidateQueries({ queryKey: aiKeys.conversations(workspaceId) });
    },
  });
}

// Delete conversation mutation
export function useDeleteAiConversation() {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useAuthStore();
  const workspaceId = currentWorkspace?.id || '';

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteAiConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.conversations(workspaceId) });
    },
  });
}

// ============================================================
// SUMMARIES
// ============================================================

// Fetch summaries list for current workspace
export function useAiSummaries(type?: SummaryType, limit?: number) {
  const { currentWorkspace } = useAuthStore();
  const workspaceId = currentWorkspace?.id || '';

  return useQuery({
    queryKey: aiKeys.summariesList(workspaceId, type, limit),
    queryFn: () => apiClient.getAiSummaries(workspaceId, type, limit),
    enabled: !!workspaceId,
  });
}

// Fetch/generate weekly summary
export function useWeeklyAiSummary(weekStart: string, options?: { enabled?: boolean }) {
  const { currentWorkspace } = useAuthStore();
  const workspaceId = currentWorkspace?.id || '';

  return useQuery({
    queryKey: aiKeys.weeklySummary(workspaceId, weekStart),
    queryFn: () => apiClient.getWeeklyAiSummary(workspaceId, weekStart),
    enabled: (options?.enabled ?? !!weekStart) && !!workspaceId,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

// Fetch/generate monthly summary
export function useMonthlyAiSummary(month: string, options?: { enabled?: boolean }) {
  const { currentWorkspace } = useAuthStore();
  const workspaceId = currentWorkspace?.id || '';

  return useQuery({
    queryKey: aiKeys.monthlySummary(workspaceId, month),
    queryFn: () => apiClient.getMonthlyAiSummary(workspaceId, month),
    enabled: (options?.enabled ?? !!month) && !!workspaceId,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

// Fetch/generate yearly summary
export function useYearlyAiSummary(year: string, options?: { enabled?: boolean }) {
  const { currentWorkspace } = useAuthStore();
  const workspaceId = currentWorkspace?.id || '';

  return useQuery({
    queryKey: aiKeys.yearlySummary(workspaceId, year),
    queryFn: () => apiClient.getYearlyAiSummary(workspaceId, year),
    enabled: (options?.enabled ?? !!year) && !!workspaceId,
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
  });
}

// Generate/regenerate summary mutation
export function useGenerateAiSummary() {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useAuthStore();
  const workspaceId = currentWorkspace?.id || '';

  return useMutation({
    mutationFn: ({
      type,
      periodStart,
      forceRegenerate,
    }: {
      type: SummaryType;
      periodStart: string;
      forceRegenerate?: boolean;
    }) => apiClient.generateAiSummary(workspaceId, type, periodStart, forceRegenerate),
    onSuccess: (result, variables) => {
      // Update the specific summary cache
      if (variables.type === 'weekly') {
        queryClient.setQueryData(aiKeys.weeklySummary(workspaceId, variables.periodStart), result);
      } else if (variables.type === 'monthly') {
        queryClient.setQueryData(aiKeys.monthlySummary(workspaceId, variables.periodStart), result);
      } else if (variables.type === 'yearly') {
        queryClient.setQueryData(
          aiKeys.yearlySummary(workspaceId, variables.periodStart.split('-')[0]),
          result
        );
      }
      queryClient.invalidateQueries({ queryKey: aiKeys.summaries(workspaceId) });
    },
  });
}

// ============================================================
// INSIGHTS
// ============================================================

// Fetch insights for current workspace
export function useAiInsights(type?: string, includeDismissed = false) {
  const { currentWorkspace } = useAuthStore();
  const workspaceId = currentWorkspace?.id || '';

  return useQuery({
    queryKey: aiKeys.insightsList(workspaceId, type, includeDismissed),
    queryFn: () => apiClient.getAiInsights(workspaceId, type, includeDismissed),
    enabled: !!workspaceId,
  });
}

// Generate insights mutation
export function useGenerateAiInsights() {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useAuthStore();
  const workspaceId = currentWorkspace?.id || '';

  return useMutation({
    mutationFn: (types?: string[]) => apiClient.generateAiInsights(workspaceId, types),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.insights(workspaceId) });
    },
  });
}

// Dismiss insight mutation
export function useDismissAiInsight() {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useAuthStore();
  const workspaceId = currentWorkspace?.id || '';

  return useMutation({
    mutationFn: (id: string) => apiClient.dismissAiInsight(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.insights(workspaceId) });
    },
  });
}

// ============================================================
// DAILY TEXT
// ============================================================

// Fetch personalized daily text for current workspace
export function useDailyText() {
  const { currentWorkspace } = useAuthStore();
  const workspaceId = currentWorkspace?.id || '';

  return useQuery({
    queryKey: aiKeys.dailyText(workspaceId),
    queryFn: () => apiClient.getDailyText(workspaceId),
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    refetchOnWindowFocus: false,
  });
}
