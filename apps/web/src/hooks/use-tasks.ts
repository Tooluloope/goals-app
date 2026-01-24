'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Task } from '@/types';
import { projectKeys } from './use-projects';

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  workspace: (workspaceId: string) => [...taskKeys.all, 'workspace', workspaceId] as const,
  detail: (taskId: string) => [...taskKeys.all, 'detail', taskId] as const,
};

// Fetch tasks for current workspace
export function useTasks() {
  const { currentWorkspace } = useAuthStore();

  return useQuery({
    queryKey: taskKeys.workspace(currentWorkspace?.id ?? ''),
    queryFn: () => apiClient.getTasks(currentWorkspace?.id ?? ''),
    enabled: !!currentWorkspace,
  });
}

// Fetch single task
export function useTask(taskId: string) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => apiClient.getTask(taskId),
    enabled: !!taskId,
  });
}

// Update task mutation
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof apiClient.updateTask>[1] }) =>
      apiClient.updateTask(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

// Update task status mutation
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, statusId }: { id: string; statusId: string }) =>
      apiClient.updateTaskStatus(id, statusId),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

// Delete task mutation
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
