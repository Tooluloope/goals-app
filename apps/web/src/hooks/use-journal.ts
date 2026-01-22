'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreateJournalEntryDto, UpdateJournalEntryDto } from '@goals/shared';

// Helper to format date for query keys
function formatDateKey(date: Date | string): string {
  if (typeof date === 'string') return date.split('T')[0];
  return date.toISOString().split('T')[0];
}

// Query keys
export const journalKeys = {
  all: ['journal'] as const,
  list: (startDate?: string, endDate?: string) =>
    [...journalKeys.all, 'list', { startDate, endDate }] as const,
  detail: (id: string) => [...journalKeys.all, 'detail', id] as const,
  date: (date: string) => [...journalKeys.all, 'date', date] as const,
  today: () => [...journalKeys.all, 'today'] as const,
  streak: () => [...journalKeys.all, 'streak'] as const,
  prompt: () => [...journalKeys.all, 'prompt'] as const,
};

// Fetch journal entries
export function useJournalEntries(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: journalKeys.list(startDate, endDate),
    queryFn: () => apiClient.getJournalEntries(startDate, endDate),
  });
}

// Fetch single journal entry
export function useJournalEntry(id: string) {
  return useQuery({
    queryKey: journalKeys.detail(id),
    queryFn: () => apiClient.getJournalEntry(id),
    enabled: !!id,
  });
}

// Fetch journal entry by date
export function useJournalEntryByDate(date: string) {
  return useQuery({
    queryKey: journalKeys.date(date),
    queryFn: () => apiClient.getJournalEntryByDate(date),
    enabled: !!date,
  });
}

// Fetch today's journal entry
export function useTodayJournalEntry() {
  return useQuery({
    queryKey: journalKeys.today(),
    queryFn: () => apiClient.getTodayJournalEntry(),
  });
}

// Fetch journal streak
export function useJournalStreak() {
  return useQuery({
    queryKey: journalKeys.streak(),
    queryFn: () => apiClient.getJournalStreak(),
  });
}

// Fetch daily prompt
export function useJournalPrompt() {
  return useQuery({
    queryKey: journalKeys.prompt(),
    queryFn: () => apiClient.getJournalPrompt(),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}

// Create journal entry mutation
export function useCreateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateJournalEntryDto) => apiClient.createJournalEntry(data),
    onSuccess: (newEntry) => {
      queryClient.setQueryData(journalKeys.detail(newEntry.id), newEntry);
      queryClient.setQueryData(journalKeys.date(formatDateKey(newEntry.date)), newEntry);
      queryClient.invalidateQueries({ queryKey: journalKeys.all });
    },
  });
}

// Update journal entry mutation
export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJournalEntryDto }) =>
      apiClient.updateJournalEntry(id, data),
    onSuccess: (updatedEntry) => {
      queryClient.setQueryData(journalKeys.detail(updatedEntry.id), updatedEntry);
      queryClient.setQueryData(journalKeys.date(formatDateKey(updatedEntry.date)), updatedEntry);
      queryClient.invalidateQueries({ queryKey: journalKeys.all });
    },
  });
}

// Upsert journal entry mutation (create or update)
export function useUpsertJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateJournalEntryDto) => apiClient.upsertJournalEntry(data),
    onSuccess: (entry) => {
      queryClient.setQueryData(journalKeys.detail(entry.id), entry);
      queryClient.setQueryData(journalKeys.date(formatDateKey(entry.date)), entry);
      queryClient.setQueryData(journalKeys.today(), entry);
      queryClient.invalidateQueries({ queryKey: journalKeys.streak() });
      queryClient.invalidateQueries({ queryKey: journalKeys.list() });
    },
  });
}

// Delete journal entry mutation
export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteJournalEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.all });
    },
  });
}
