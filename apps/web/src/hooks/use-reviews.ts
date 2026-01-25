'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  WeeklyReview,
  MonthlyReview,
  CreateWeeklyReviewDto,
  UpdateWeeklyReviewDto,
  CreateMonthlyReviewDto,
  UpdateMonthlyReviewDto,
} from '@goals/shared';

// Query keys
export const reviewKeys = {
  all: ['reviews'] as const,
  // Weekly reviews
  weekly: {
    all: ['reviews', 'weekly'] as const,
    list: (limit?: number) => [...reviewKeys.weekly.all, 'list', { limit }] as const,
    detail: (id: string) => [...reviewKeys.weekly.all, 'detail', id] as const,
    current: () => [...reviewKeys.weekly.all, 'current'] as const,
    date: (weekStart: string) => [...reviewKeys.weekly.all, 'date', weekStart] as const,
    stats: () => [...reviewKeys.weekly.all, 'stats'] as const,
    prompts: () => [...reviewKeys.weekly.all, 'prompts'] as const,
  },
  // Monthly reviews
  monthly: {
    all: ['reviews', 'monthly'] as const,
    list: (limit?: number) => [...reviewKeys.monthly.all, 'list', { limit }] as const,
    detail: (id: string) => [...reviewKeys.monthly.all, 'detail', id] as const,
    current: () => [...reviewKeys.monthly.all, 'current'] as const,
    date: (month: string) => [...reviewKeys.monthly.all, 'date', month] as const,
    stats: () => [...reviewKeys.monthly.all, 'stats'] as const,
    prompts: () => [...reviewKeys.monthly.all, 'prompts'] as const,
  },
};

// ============================================================
// WEEKLY REVIEWS
// ============================================================

// Fetch weekly reviews
export function useWeeklyReviews(limit?: number) {
  return useQuery({
    queryKey: reviewKeys.weekly.list(limit),
    queryFn: () => apiClient.getWeeklyReviews(limit),
  });
}

// Fetch single weekly review
export function useWeeklyReview(id: string) {
  return useQuery({
    queryKey: reviewKeys.weekly.detail(id),
    queryFn: () => apiClient.getWeeklyReview(id),
    enabled: !!id,
  });
}

// Fetch current week's review
export function useCurrentWeekReview() {
  return useQuery({
    queryKey: reviewKeys.weekly.current(),
    queryFn: () => apiClient.getCurrentWeekReview(),
  });
}

// Fetch weekly review by date
export function useWeeklyReviewByDate(weekStart: string) {
  return useQuery({
    queryKey: reviewKeys.weekly.date(weekStart),
    queryFn: () => apiClient.getWeeklyReviewByDate(weekStart),
    enabled: !!weekStart,
  });
}

// Fetch weekly review stats
export function useWeeklyReviewStats() {
  return useQuery({
    queryKey: reviewKeys.weekly.stats(),
    queryFn: () => apiClient.getWeeklyReviewStats(),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes (stats only change on new reviews)
  });
}

// Fetch weekly review prompts
export function useWeeklyReviewPrompts() {
  return useQuery({
    queryKey: reviewKeys.weekly.prompts(),
    queryFn: () => apiClient.getWeeklyReviewPrompts(),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

// Create weekly review mutation
export function useCreateWeeklyReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWeeklyReviewDto) => apiClient.createWeeklyReview(data),
    onSuccess: (newReview) => {
      queryClient.setQueryData(reviewKeys.weekly.detail(newReview.id), newReview);
      queryClient.invalidateQueries({ queryKey: reviewKeys.weekly.all });
    },
  });
}

// Update weekly review mutation
export function useUpdateWeeklyReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWeeklyReviewDto }) =>
      apiClient.updateWeeklyReview(id, data),
    onSuccess: (updatedReview) => {
      queryClient.setQueryData(reviewKeys.weekly.detail(updatedReview.id), updatedReview);
      queryClient.invalidateQueries({ queryKey: reviewKeys.weekly.all });
    },
  });
}

// Upsert weekly review mutation
export function useUpsertWeeklyReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWeeklyReviewDto) => apiClient.upsertWeeklyReview(data),
    onSuccess: (review) => {
      queryClient.setQueryData(reviewKeys.weekly.detail(review.id), review);
      queryClient.setQueryData(reviewKeys.weekly.current(), review);
      queryClient.invalidateQueries({ queryKey: reviewKeys.weekly.stats() });
      queryClient.invalidateQueries({ queryKey: reviewKeys.weekly.list() });
    },
  });
}

// Delete weekly review mutation
export function useDeleteWeeklyReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteWeeklyReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.weekly.all });
    },
  });
}

// ============================================================
// MONTHLY REVIEWS
// ============================================================

// Fetch monthly reviews
export function useMonthlyReviews(limit?: number) {
  return useQuery({
    queryKey: reviewKeys.monthly.list(limit),
    queryFn: () => apiClient.getMonthlyReviews(limit),
  });
}

// Fetch single monthly review
export function useMonthlyReview(id: string) {
  return useQuery({
    queryKey: reviewKeys.monthly.detail(id),
    queryFn: () => apiClient.getMonthlyReview(id),
    enabled: !!id,
  });
}

// Fetch current month's review
export function useCurrentMonthReview() {
  return useQuery({
    queryKey: reviewKeys.monthly.current(),
    queryFn: () => apiClient.getCurrentMonthReview(),
  });
}

// Fetch monthly review by date
export function useMonthlyReviewByDate(month: string) {
  return useQuery({
    queryKey: reviewKeys.monthly.date(month),
    queryFn: () => apiClient.getMonthlyReviewByDate(month),
    enabled: !!month,
  });
}

// Fetch monthly review stats
export function useMonthlyReviewStats() {
  return useQuery({
    queryKey: reviewKeys.monthly.stats(),
    queryFn: () => apiClient.getMonthlyReviewStats(),
  });
}

// Fetch monthly review prompts
export function useMonthlyReviewPrompts() {
  return useQuery({
    queryKey: reviewKeys.monthly.prompts(),
    queryFn: () => apiClient.getMonthlyReviewPrompts(),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

// Create monthly review mutation
export function useCreateMonthlyReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMonthlyReviewDto) => apiClient.createMonthlyReview(data),
    onSuccess: (newReview) => {
      queryClient.setQueryData(reviewKeys.monthly.detail(newReview.id), newReview);
      queryClient.invalidateQueries({ queryKey: reviewKeys.monthly.all });
    },
  });
}

// Update monthly review mutation
export function useUpdateMonthlyReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMonthlyReviewDto }) =>
      apiClient.updateMonthlyReview(id, data),
    onSuccess: (updatedReview) => {
      queryClient.setQueryData(reviewKeys.monthly.detail(updatedReview.id), updatedReview);
      queryClient.invalidateQueries({ queryKey: reviewKeys.monthly.all });
    },
  });
}

// Upsert monthly review mutation
export function useUpsertMonthlyReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMonthlyReviewDto) => apiClient.upsertMonthlyReview(data),
    onSuccess: (review) => {
      queryClient.setQueryData(reviewKeys.monthly.detail(review.id), review);
      queryClient.setQueryData(reviewKeys.monthly.current(), review);
      queryClient.invalidateQueries({ queryKey: reviewKeys.monthly.stats() });
      queryClient.invalidateQueries({ queryKey: reviewKeys.monthly.list() });
    },
  });
}

// Delete monthly review mutation
export function useDeleteMonthlyReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteMonthlyReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.monthly.all });
    },
  });
}
