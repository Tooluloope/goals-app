'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import * as dataService from '@/services/data-service';
import {
  Project,
  CreateProjectData,
  AddReviewData,
  CreateTaskData,
} from '@/types';

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  workspace: (workspaceId: string) => [...projectKeys.all, 'workspace', workspaceId] as const,
  user: (userId: string) => [...projectKeys.all, 'user', userId] as const,
  detail: (projectId: string) => [...projectKeys.all, 'detail', projectId] as const,
};

// Fetch projects for current workspace
export function useProjects() {
  const { currentWorkspace } = useAuthStore();

  return useQuery({
    queryKey: projectKeys.workspace(currentWorkspace?.id ?? ''),
    queryFn: () => dataService.getProjectsForWorkspace(currentWorkspace?.id ?? ''),
    enabled: !!currentWorkspace,
  });
}

// Fetch all projects for the current user (across all workspaces)
export function useAllUserProjects() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: projectKeys.user(user?.id ?? ''),
    queryFn: () => dataService.getProjectsForUser(user?.id ?? ''),
    enabled: !!user,
  });
}

// Fetch single project
export function useProject(projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => dataService.getProject(projectId),
    enabled: !!projectId,
  });
}

// Create project mutation
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectData) => dataService.createProject(data),
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.workspace(newProject.workspaceId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

// Update project mutation
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, updates }: { projectId: string; updates: Partial<Project> }) =>
      dataService.updateProject(projectId, updates),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject);
      queryClient.invalidateQueries({ queryKey: projectKeys.workspace(updatedProject.workspaceId) });
    },
  });
}

// Update project status mutation
export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, statusId }: { projectId: string; statusId: string }) =>
      dataService.updateProjectStatus(projectId, statusId),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject);
      queryClient.invalidateQueries({ queryKey: projectKeys.workspace(updatedProject.workspaceId) });
    },
  });
}

// Delete project mutation
export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useAuthStore();

  return useMutation({
    mutationFn: (projectId: string) => dataService.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.workspace(currentWorkspace?.id ?? '') });
    },
  });
}

// Add requirement mutation
export function useAddRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, text }: { projectId: string; text: string }) =>
      dataService.addRequirement(projectId, text),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject);
    },
  });
}

// Toggle requirement mutation
export function useToggleRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, itemId }: { projectId: string; itemId: string }) =>
      dataService.toggleRequirement(projectId, itemId),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject);
    },
  });
}

// Add definition of done mutation
export function useAddDefinitionOfDone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, text }: { projectId: string; text: string }) =>
      dataService.addDefinitionOfDone(projectId, text),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject);
    },
  });
}

// Toggle definition of done mutation
export function useToggleDefinitionOfDone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, itemId }: { projectId: string; itemId: string }) =>
      dataService.toggleDefinitionOfDone(projectId, itemId),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject);
    },
  });
}

// Create task mutation
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskData) => dataService.createTask(data),
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(newTask.projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

// Update task status mutation
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, taskId, statusId }: { projectId: string; taskId: string; statusId: string }) =>
      dataService.updateTaskStatus(projectId, taskId, statusId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

// Delete task mutation
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, taskId }: { projectId: string; taskId: string }) =>
      dataService.deleteTask(projectId, taskId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}

// Add review mutation
export function useAddReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddReviewData) => dataService.addReview(data),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject);
      queryClient.invalidateQueries({ queryKey: projectKeys.workspace(updatedProject.workspaceId) });
    },
  });
}
