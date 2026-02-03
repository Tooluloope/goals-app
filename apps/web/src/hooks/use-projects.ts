'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Project, CreateProjectData, AddReviewData, CreateTaskData } from '@/types';

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  workspace: (workspaceId: string) => [...projectKeys.all, 'workspace', workspaceId] as const,
  user: (userId: string) => [...projectKeys.all, 'user', userId] as const,
  detail: (projectId: string) => [...projectKeys.all, 'detail', projectId] as const,
};

// Fetch projects for current workspace
type UseProjectsOptions = {
  refetchOnWindowFocus?: boolean | 'always';
  refetchOnMount?: boolean | 'always';
  staleTime?: number;
};

export function useProjects(options: UseProjectsOptions = {}) {
  const { currentWorkspace } = useAuthStore();

  return useQuery({
    queryKey: projectKeys.workspace(currentWorkspace?.id ?? ''),
    queryFn: () => apiClient.getProjectsForWorkspace(currentWorkspace?.id ?? ''),
    enabled: !!currentWorkspace,
    refetchOnWindowFocus: options.refetchOnWindowFocus,
    refetchOnMount: options.refetchOnMount,
    staleTime: options.staleTime,
  });
}

// Fetch all projects for the current user (across all workspaces)
export function useAllUserProjects() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: projectKeys.user(user?.id ?? ''),
    queryFn: () => apiClient.getAllProjects(),
    enabled: !!user,
  });
}

// Fetch single project
export function useProject(projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => apiClient.getProject(projectId),
    enabled: !!projectId,
  });
}

// Create project mutation
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectData) => apiClient.createProject(data as any),
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
      apiClient.updateProject(projectId, updates as any),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject);
      queryClient.invalidateQueries({
        queryKey: projectKeys.workspace(updatedProject.workspaceId),
      });
    },
  });
}

// Update project status mutation with optimistic updates
export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useAuthStore();

  return useMutation({
    mutationFn: ({ projectId, statusId }: { projectId: string; statusId: string }) =>
      apiClient.updateProjectStatus(projectId, statusId),
    onMutate: async ({ projectId, statusId }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      const workspaceKey = projectKeys.workspace(currentWorkspace?.id ?? '');
      await queryClient.cancelQueries({ queryKey: workspaceKey });

      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData<Project[]>(workspaceKey);

      // Optimistically update the cache
      if (previousProjects) {
        queryClient.setQueryData<Project[]>(workspaceKey, (old) =>
          old?.map((p) => (p.id === projectId ? { ...p, statusId } : p))
        );
      }

      // Return context with the snapshot
      return { previousProjects, workspaceKey };
    },
    onError: (_err, _variables, context) => {
      // Roll back to the previous value on error
      if (context?.previousProjects) {
        queryClient.setQueryData(context.workspaceKey, context.previousProjects);
      }
    },
    onSettled: () => {
      // Refetch after mutation settles to ensure data consistency
      queryClient.invalidateQueries({
        queryKey: projectKeys.workspace(currentWorkspace?.id ?? ''),
      });
    },
  });
}

// Delete project mutation
export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useAuthStore();

  return useMutation({
    mutationFn: (projectId: string) => apiClient.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.workspace(currentWorkspace?.id ?? ''),
      });
    },
  });
}

// Add requirement mutation
export function useAddRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, text }: { projectId: string; text: string }) =>
      apiClient.addRequirement(projectId, text),
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
      apiClient.toggleRequirement(projectId, itemId),
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
      apiClient.addDefinitionOfDone(projectId, text),
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
      apiClient.toggleDefinitionOfDone(projectId, itemId),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject);
    },
  });
}

// Create task mutation
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskData) => apiClient.createTask(data as any),
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
    mutationFn: ({
      projectId,
      taskId,
      statusId,
    }: {
      projectId: string;
      taskId: string;
      statusId: string;
    }) => apiClient.updateTaskStatus(taskId, statusId),
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
      apiClient.deleteTask(taskId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}

// Add review mutation
export function useAddReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddReviewData) => apiClient.addReview(data as any),
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject);
      queryClient.invalidateQueries({
        queryKey: projectKeys.workspace(updatedProject.workspaceId),
      });
    },
  });
}
