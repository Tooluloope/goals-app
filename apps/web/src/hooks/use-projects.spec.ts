'use client';

import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useProjects,
  useAllUserProjects,
  useProject,
  useCreateProject,
  useUpdateProject,
  useUpdateProjectStatus,
  useDeleteProject,
  useAddRequirement,
  useToggleRequirement,
  useAddDefinitionOfDone,
  useToggleDefinitionOfDone,
  useCreateTask,
  useUpdateTaskStatus,
  useDeleteTask,
  useAddReview,
  projectKeys,
} from './use-projects';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import React from 'react';

// Mock api-client
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getProjectsForWorkspace: jest.fn(),
    getAllProjects: jest.fn(),
    getProject: jest.fn(),
    createProject: jest.fn(),
    updateProject: jest.fn(),
    updateProjectStatus: jest.fn(),
    deleteProject: jest.fn(),
    addRequirement: jest.fn(),
    toggleRequirement: jest.fn(),
    addDefinitionOfDone: jest.fn(),
    toggleDefinitionOfDone: jest.fn(),
    createTask: jest.fn(),
    updateTaskStatus: jest.fn(),
    deleteTask: jest.fn(),
    addReview: jest.fn(),
  },
}));

// Mock auth-store
jest.mock('@/store/auth-store', () => ({
  useAuthStore: jest.fn(),
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('use-projects hooks', () => {
  let queryClient: QueryClient;

  const mockWorkspace = {
    id: 'ws-1',
    name: 'Test Workspace',
    type: 'personal' as const,
    ownerId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProject = {
    id: 'project-1',
    name: 'Test Project',
    workspaceId: 'ws-1',
    statusId: 'status-1',
    areaId: 'area-1',
    requirements: [],
    definitionOfDone: [],
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();

    // Default mock implementation
    mockUseAuthStore.mockReturnValue({
      currentWorkspace: mockWorkspace,
      user: mockUser,
    } as any);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  describe('projectKeys', () => {
    it('should generate correct keys', () => {
      expect(projectKeys.all).toEqual(['projects']);
      expect(projectKeys.workspace('ws-1')).toEqual(['projects', 'workspace', 'ws-1']);
      expect(projectKeys.user('user-1')).toEqual(['projects', 'user', 'user-1']);
      expect(projectKeys.detail('project-1')).toEqual(['projects', 'detail', 'project-1']);
    });
  });

  describe('useProjects', () => {
    it('should fetch projects for current workspace', async () => {
      mockApiClient.getProjectsForWorkspace.mockResolvedValue([mockProject] as any);

      const { result } = renderHook(() => useProjects(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([mockProject]);
      expect(mockApiClient.getProjectsForWorkspace).toHaveBeenCalledWith('ws-1');
    });

    it('should not fetch when no workspace is set', () => {
      mockUseAuthStore.mockReturnValue({
        currentWorkspace: null,
        user: mockUser,
      } as any);

      renderHook(() => useProjects(), { wrapper });

      expect(mockApiClient.getProjectsForWorkspace).not.toHaveBeenCalled();
    });
  });

  describe('useAllUserProjects', () => {
    it('should fetch all projects for user', async () => {
      mockApiClient.getAllProjects.mockResolvedValue([mockProject] as any);

      const { result } = renderHook(() => useAllUserProjects(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([mockProject]);
      expect(mockApiClient.getAllProjects).toHaveBeenCalled();
    });

    it('should not fetch when no user is set', () => {
      mockUseAuthStore.mockReturnValue({
        currentWorkspace: mockWorkspace,
        user: null,
      } as any);

      renderHook(() => useAllUserProjects(), { wrapper });

      expect(mockApiClient.getAllProjects).not.toHaveBeenCalled();
    });
  });

  describe('useProject', () => {
    it('should fetch project by id', async () => {
      mockApiClient.getProject.mockResolvedValue(mockProject as any);

      const { result } = renderHook(() => useProject('project-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockProject);
      expect(mockApiClient.getProject).toHaveBeenCalledWith('project-1');
    });

    it('should not fetch when projectId is empty', () => {
      renderHook(() => useProject(''), { wrapper });

      expect(mockApiClient.getProject).not.toHaveBeenCalled();
    });
  });

  describe('useCreateProject', () => {
    it('should create project and invalidate queries', async () => {
      const newProject = { ...mockProject, id: 'new-project' };
      mockApiClient.createProject.mockResolvedValue(newProject as any);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateProject(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          name: 'New Project',
          workspaceId: 'ws-1',
          statusId: 'status-1',
          areaId: 'area-1',
          startDate: '2024-01-01T00:00:00.000Z',
          targetDate: '2024-12-31T00:00:00.000Z',
          cadenceId: 'cadence-1',
          priorityId: 'priority-1',
          objective: 'Ship the project',
          successMetric: 'Launch complete',
          confidenceId: 'confidence-1',
        });
      });

      expect(mockApiClient.createProject).toHaveBeenCalled();
      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  describe('useUpdateProject', () => {
    it('should update project', async () => {
      const updatedProject = { ...mockProject, name: 'Updated Name' };
      mockApiClient.updateProject.mockResolvedValue(updatedProject as any);

      const { result } = renderHook(() => useUpdateProject(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'project-1',
          updates: { name: 'Updated Name' },
        });
      });

      expect(mockApiClient.updateProject).toHaveBeenCalledWith('project-1', {
        name: 'Updated Name',
      });
    });

    it('should update cache on success', async () => {
      const updatedProject = { ...mockProject, name: 'Updated Name' };
      mockApiClient.updateProject.mockResolvedValue(updatedProject as any);

      const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData');

      const { result } = renderHook(() => useUpdateProject(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'project-1',
          updates: { name: 'Updated Name' },
        });
      });

      expect(setQueryDataSpy).toHaveBeenCalled();
    });
  });

  describe('useUpdateProjectStatus', () => {
    it('should update project status with optimistic update', async () => {
      // Pre-populate cache with projects
      queryClient.setQueryData(projectKeys.workspace('ws-1'), [mockProject]);

      const updatedProject = { ...mockProject, statusId: 'done' };
      mockApiClient.updateProjectStatus.mockResolvedValue(updatedProject as any);

      const { result } = renderHook(() => useUpdateProjectStatus(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'project-1',
          statusId: 'done',
        });
      });

      expect(mockApiClient.updateProjectStatus).toHaveBeenCalledWith('project-1', 'done');
    });

    it('should rollback on error', async () => {
      // Pre-populate cache with projects
      queryClient.setQueryData(projectKeys.workspace('ws-1'), [mockProject]);

      mockApiClient.updateProjectStatus.mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useUpdateProjectStatus(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            projectId: 'project-1',
            statusId: 'done',
          });
        } catch {
          // Expected to throw
        }
      });

      // Should have rolled back to original state
      const cachedProjects = queryClient.getQueryData(projectKeys.workspace('ws-1')) as any[];
      expect(cachedProjects?.[0]?.statusId).toBe('status-1');
    });
  });

  describe('useDeleteProject', () => {
    it('should delete project and invalidate queries', async () => {
      mockApiClient.deleteProject.mockResolvedValue(undefined);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteProject(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('project-1');
      });

      expect(mockApiClient.deleteProject).toHaveBeenCalledWith('project-1');
      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  describe('useAddRequirement', () => {
    it('should add requirement', async () => {
      const updatedProject = {
        ...mockProject,
        requirements: [{ id: 'req-1', text: 'New requirement', completed: false }],
      };
      mockApiClient.addRequirement.mockResolvedValue(updatedProject as any);

      const { result } = renderHook(() => useAddRequirement(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'project-1',
          text: 'New requirement',
        });
      });

      expect(mockApiClient.addRequirement).toHaveBeenCalledWith('project-1', 'New requirement');
    });
  });

  describe('useToggleRequirement', () => {
    it('should toggle requirement', async () => {
      const updatedProject = {
        ...mockProject,
        requirements: [{ id: 'req-1', text: 'Requirement', completed: true }],
      };
      mockApiClient.toggleRequirement.mockResolvedValue(updatedProject as any);

      const { result } = renderHook(() => useToggleRequirement(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'project-1',
          itemId: 'req-1',
        });
      });

      expect(mockApiClient.toggleRequirement).toHaveBeenCalledWith('project-1', 'req-1');
    });
  });

  describe('useAddDefinitionOfDone', () => {
    it('should add definition of done', async () => {
      const updatedProject = {
        ...mockProject,
        definitionOfDone: [{ id: 'dod-1', text: 'New DoD', completed: false }],
      };
      mockApiClient.addDefinitionOfDone.mockResolvedValue(updatedProject as any);

      const { result } = renderHook(() => useAddDefinitionOfDone(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'project-1',
          text: 'New DoD',
        });
      });

      expect(mockApiClient.addDefinitionOfDone).toHaveBeenCalledWith('project-1', 'New DoD');
    });
  });

  describe('useToggleDefinitionOfDone', () => {
    it('should toggle definition of done', async () => {
      const updatedProject = {
        ...mockProject,
        definitionOfDone: [{ id: 'dod-1', text: 'DoD', completed: true }],
      };
      mockApiClient.toggleDefinitionOfDone.mockResolvedValue(updatedProject as any);

      const { result } = renderHook(() => useToggleDefinitionOfDone(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'project-1',
          itemId: 'dod-1',
        });
      });

      expect(mockApiClient.toggleDefinitionOfDone).toHaveBeenCalledWith('project-1', 'dod-1');
    });
  });

  describe('useCreateTask', () => {
    it('should create task', async () => {
      const newTask = { id: 'task-1', projectId: 'project-1', title: 'New Task' };
      mockApiClient.createTask.mockResolvedValue(newTask as any);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateTask(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'project-1',
          title: 'New Task',
          statusId: 'status-1',
        });
      });

      expect(mockApiClient.createTask).toHaveBeenCalled();
      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  describe('useUpdateTaskStatus', () => {
    it('should update task status', async () => {
      mockApiClient.updateTaskStatus.mockResolvedValue({ id: 'task-1', statusId: 'done' } as any);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateTaskStatus(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'project-1',
          taskId: 'task-1',
          statusId: 'done',
        });
      });

      expect(mockApiClient.updateTaskStatus).toHaveBeenCalledWith('task-1', 'done');
      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  describe('useDeleteTask', () => {
    it('should delete task', async () => {
      mockApiClient.deleteTask.mockResolvedValue(undefined);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteTask(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'project-1',
          taskId: 'task-1',
        });
      });

      expect(mockApiClient.deleteTask).toHaveBeenCalledWith('task-1');
      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  describe('useAddReview', () => {
    it('should add review', async () => {
      const updatedProject = {
        ...mockProject,
        reviews: [{ id: 'review-1', notes: 'Great progress' }],
      };
      mockApiClient.addReview.mockResolvedValue(updatedProject as any);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useAddReview(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          projectId: 'project-1',
          notes: 'Great progress',
          progress: 'On track',
          blockers: 'None',
          changes: 'None',
          nextStep: 'Continue development',
        });
      });

      expect(mockApiClient.addReview).toHaveBeenCalled();
      expect(invalidateSpy).toHaveBeenCalled();
    });
  });
});
