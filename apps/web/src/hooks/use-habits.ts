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
      await queryClient.cancelQueries({ queryKey: habitKeys.list(false) });

      // Snapshot the previous values
      const previousTodayHabits = queryClient.getQueryData<HabitWithStats[]>(habitKeys.today());
      const previousListHabits = queryClient.getQueryData<HabitWithStats[]>(habitKeys.list(false));

      // Check if today's date is being toggled (use local date, not UTC)
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const isToday = date === today;

      // Helper to toggle habit - updates completedToday and logs array
      const toggleHabit = (habits: HabitWithStats[] | undefined) =>
        habits?.map((h) => {
          if (h.id !== habitId) return h;

          const wasCompleted = h.completedToday;
          const newCompletedToday = isToday ? !wasCompleted : h.completedToday;

          // Update logs array optimistically
          const logs = h.logs || [];
          const logIndex = logs.findIndex((log) => {
            const logDate =
              typeof log.date === 'string'
                ? (log.date as string).substring(0, 10)
                : new Date(log.date).toISOString().substring(0, 10);
            return logDate === date && log.completed;
          });

          let newLogs;
          if (logIndex >= 0) {
            // Remove the log (un-complete)
            newLogs = logs.filter((_, i) => i !== logIndex);
          } else {
            // Add a new log (complete) - cast date as any to avoid type issues with string vs Date
            newLogs = [
              ...logs,
              {
                id: `temp-${Date.now()}`,
                habitId,
                date: date as unknown as Date,
                completed: true,
                createdAt: new Date(),
              },
            ];
          }

          return { ...h, completedToday: newCompletedToday, logs: newLogs };
        });

      // Optimistically update both caches
      if (previousTodayHabits) {
        queryClient.setQueryData<HabitWithStats[]>(
          habitKeys.today(),
          toggleHabit(previousTodayHabits)
        );
      }
      if (previousListHabits) {
        queryClient.setQueryData<HabitWithStats[]>(
          habitKeys.list(false),
          toggleHabit(previousListHabits)
        );
      }

      return { previousTodayHabits, previousListHabits };
    },
    onError: (_err, _variables, context) => {
      // Roll back to the previous values on error
      if (context?.previousTodayHabits) {
        queryClient.setQueryData(habitKeys.today(), context.previousTodayHabits);
      }
      if (context?.previousListHabits) {
        queryClient.setQueryData(habitKeys.list(false), context.previousListHabits);
      }
    },
    onSettled: () => {
      // Refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: habitKeys.today() });
      queryClient.invalidateQueries({ queryKey: habitKeys.all }); // Invalidate all habit queries
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
