'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ProjectDependency, TaskDependency } from '@/types';
import { projectKeys } from './use-projects';

// Query keys
export const dependencyKeys = {
  all: ['dependencies'] as const,
  projectBlockers: (projectId: string) => [...dependencyKeys.all, 'project', projectId] as const,
  taskBlockers: (taskId: string) => [...dependencyKeys.all, 'task', taskId] as const,
};

// ============================================================
// PROJECT DEPENDENCY HOOKS
// ============================================================

// Fetch project blockers
export function useProjectBlockers(projectId: string) {
  return useQuery({
    queryKey: dependencyKeys.projectBlockers(projectId),
    queryFn: () => apiClient.getProjectBlockers(projectId),
    enabled: !!projectId,
  });
}

// Add project blocker mutation
export function useAddProjectBlocker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      blockerId,
      note,
    }: {
      projectId: string;
      blockerId: string;
      note?: string;
    }) => apiClient.addProjectBlocker(projectId, blockerId, note),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: dependencyKeys.projectBlockers(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

// Remove project blocker mutation
export function useRemoveProjectBlocker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, blockerId }: { projectId: string; blockerId: string }) =>
      apiClient.removeProjectBlocker(projectId, blockerId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: dependencyKeys.projectBlockers(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

// ============================================================
// TASK DEPENDENCY HOOKS
// ============================================================

// Fetch task blockers
export function useTaskBlockers(taskId: string) {
  return useQuery({
    queryKey: dependencyKeys.taskBlockers(taskId),
    queryFn: () => apiClient.getTaskBlockers(taskId),
    enabled: !!taskId,
  });
}

// Add task blocker mutation
export function useAddTaskBlocker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      blockerId,
      note,
    }: {
      taskId: string;
      blockerId: string;
      note?: string;
    }) => apiClient.addTaskBlocker(taskId, blockerId, note),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: dependencyKeys.taskBlockers(taskId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

// Remove task blocker mutation
export function useRemoveTaskBlocker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, blockerId }: { taskId: string; blockerId: string }) =>
      apiClient.removeTaskBlocker(taskId, blockerId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: dependencyKeys.taskBlockers(taskId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
