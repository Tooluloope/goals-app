'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Habit, HabitWithStats, CreateHabitDto, UpdateHabitDto } from '@goals/shared';

// Query keys
export const habitKeys = {
  all: ['habits'] as const,
  list: (includeArchived?: boolean) => [...habitKeys.all, 'list', { includeArchived }] as const,
  detail: (id: string) => [...habitKeys.all, 'detail', id] as const,
  today: () => [...habitKeys.all, 'today'] as const,
  logs: (habitId: string, startDate?: string, endDate?: string) =>
    [...habitKeys.all, 'logs', habitId, { startDate, endDate }] as const,
};

// Fetch all habits
export function useHabits(includeArchived = false) {
  return useQuery({
    queryKey: habitKeys.list(includeArchived),
    queryFn: () => apiClient.getHabits(includeArchived),
  });
}

// Fetch single habit
export function useHabit(id: string) {
  return useQuery({
    queryKey: habitKeys.detail(id),
    queryFn: () => apiClient.getHabit(id),
    enabled: !!id,
  });
}

// Fetch today's habits with completion status
export function useTodayHabits() {
  return useQuery({
    queryKey: habitKeys.today(),
    queryFn: () => apiClient.getTodayHabits(),
  });
}

// Fetch habit logs
export function useHabitLogs(habitId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: habitKeys.logs(habitId, startDate, endDate),
    queryFn: () => apiClient.getHabitLogs(habitId, startDate, endDate),
    enabled: !!habitId,
  });
}

// Create habit mutation
export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHabitDto) => apiClient.createHabit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}

// Update habit mutation
export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHabitDto }) =>
      apiClient.updateHabit(id, data),
    onSuccess: (updatedHabit) => {
      queryClient.setQueryData(habitKeys.detail(updatedHabit.id), updatedHabit);
      queryClient.invalidateQueries({ queryKey: habitKeys.list() });
      queryClient.invalidateQueries({ queryKey: habitKeys.today() });
    },
  });
}

// Delete habit mutation
export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteHabit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}

// Toggle habit log mutation (optimistic update)
export function useToggleHabitLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ habitId, date, notes }: { habitId: string; date: string; notes?: string }) =>
      apiClient.toggleHabitLog(habitId, date, notes),
    onMutate: async ({ habitId, date }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: habitKeys.today() });

      // Snapshot the previous value
      const previousHabits = queryClient.getQueryData<HabitWithStats[]>(habitKeys.today());

      // Optimistically update the cache
      if (previousHabits) {
        queryClient.setQueryData<HabitWithStats[]>(habitKeys.today(), (old) =>
          old?.map((h) => (h.id === habitId ? { ...h, completedToday: !h.completedToday } : h))
        );
      }

      return { previousHabits };
    },
    onError: (_err, _variables, context) => {
      // Roll back to the previous value on error
      if (context?.previousHabits) {
        queryClient.setQueryData(habitKeys.today(), context.previousHabits);
      }
    },
    onSettled: () => {
      // Refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: habitKeys.today() });
      queryClient.invalidateQueries({ queryKey: habitKeys.list() });
    },
  });
}

// Reorder habits mutation
export function useReorderHabits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (habitIds: string[]) => apiClient.reorderHabits(habitIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitKeys.all });
    },
  });
}
