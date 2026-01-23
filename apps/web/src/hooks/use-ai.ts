'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { SummaryType } from '@goals/shared';

// Query keys
export const aiKeys = {
  all: ['ai'] as const,
  // Conversations
  conversations: () => [...aiKeys.all, 'conversations'] as const,
  conversationsList: (limit?: number) => [...aiKeys.conversations(), 'list', { limit }] as const,
  conversationDetail: (id: string) => [...aiKeys.conversations(), 'detail', id] as const,
  // Summaries
  summaries: () => [...aiKeys.all, 'summaries'] as const,
  summariesList: (type?: SummaryType, limit?: number) =>
    [...aiKeys.summaries(), 'list', { type, limit }] as const,
  weeklySummary: (weekStart: string) => [...aiKeys.summaries(), 'weekly', weekStart] as const,
  monthlySummary: (month: string) => [...aiKeys.summaries(), 'monthly', month] as const,
  yearlySummary: (year: string) => [...aiKeys.summaries(), 'yearly', year] as const,
  // Insights
  insights: () => [...aiKeys.all, 'insights'] as const,
  insightsList: (type?: string, includeDismissed?: boolean) =>
    [...aiKeys.insights(), 'list', { type, includeDismissed }] as const,
  // Daily Text
  dailyText: () => [...aiKeys.all, 'daily-text'] as const,
};

// ============================================================
// CONVERSATIONS
// ============================================================

// Fetch all conversations
export function useAiConversations(limit?: number) {
  return useQuery({
    queryKey: aiKeys.conversationsList(limit),
    queryFn: () => apiClient.getAiConversations(limit),
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

  return useMutation({
    mutationFn: (title?: string) => apiClient.createAiConversation(title),
    onSuccess: (newConversation) => {
      queryClient.setQueryData(aiKeys.conversationDetail(newConversation.id), {
        ...newConversation,
        messages: [],
      });
      queryClient.invalidateQueries({ queryKey: aiKeys.conversations() });
    },
  });
}

// Delete conversation mutation
export function useDeleteAiConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteAiConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.conversations() });
    },
  });
}

// ============================================================
// SUMMARIES
// ============================================================

// Fetch summaries list
export function useAiSummaries(type?: SummaryType, limit?: number) {
  return useQuery({
    queryKey: aiKeys.summariesList(type, limit),
    queryFn: () => apiClient.getAiSummaries(type, limit),
  });
}

// Fetch/generate weekly summary
export function useWeeklyAiSummary(weekStart: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: aiKeys.weeklySummary(weekStart),
    queryFn: () => apiClient.getWeeklyAiSummary(weekStart),
    enabled: options?.enabled ?? !!weekStart,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

// Fetch/generate monthly summary
export function useMonthlyAiSummary(month: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: aiKeys.monthlySummary(month),
    queryFn: () => apiClient.getMonthlyAiSummary(month),
    enabled: options?.enabled ?? !!month,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

// Fetch/generate yearly summary
export function useYearlyAiSummary(year: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: aiKeys.yearlySummary(year),
    queryFn: () => apiClient.getYearlyAiSummary(year),
    enabled: options?.enabled ?? !!year,
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
  });
}

// Generate/regenerate summary mutation
export function useGenerateAiSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      type,
      periodStart,
      forceRegenerate,
    }: {
      type: SummaryType;
      periodStart: string;
      forceRegenerate?: boolean;
    }) => apiClient.generateAiSummary(type, periodStart, forceRegenerate),
    onSuccess: (result, variables) => {
      // Update the specific summary cache
      if (variables.type === 'weekly') {
        queryClient.setQueryData(aiKeys.weeklySummary(variables.periodStart), result);
      } else if (variables.type === 'monthly') {
        queryClient.setQueryData(aiKeys.monthlySummary(variables.periodStart), result);
      } else if (variables.type === 'yearly') {
        queryClient.setQueryData(aiKeys.yearlySummary(variables.periodStart.split('-')[0]), result);
      }
      queryClient.invalidateQueries({ queryKey: aiKeys.summaries() });
    },
  });
}

// ============================================================
// INSIGHTS
// ============================================================

// Fetch insights
export function useAiInsights(type?: string, includeDismissed = false) {
  return useQuery({
    queryKey: aiKeys.insightsList(type, includeDismissed),
    queryFn: () => apiClient.getAiInsights(type, includeDismissed),
  });
}

// Generate insights mutation
export function useGenerateAiInsights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (types?: string[]) => apiClient.generateAiInsights(types),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.insights() });
    },
  });
}

// Dismiss insight mutation
export function useDismissAiInsight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.dismissAiInsight(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.insights() });
    },
  });
}

// ============================================================
// DAILY TEXT
// ============================================================

// Fetch personalized daily text
export function useDailyText() {
  return useQuery({
    queryKey: aiKeys.dailyText(),
    queryFn: () => apiClient.getDailyText(),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    refetchOnWindowFocus: false,
  });
}
