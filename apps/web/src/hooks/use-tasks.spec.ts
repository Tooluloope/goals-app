'use client';

import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTask, useUpdateTask, useUpdateTaskStatus, useDeleteTask, taskKeys } from './use-tasks';
import { apiClient } from '@/lib/api-client';
import React from 'react';

// Mock api-client
jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getTask: jest.fn(),
    updateTask: jest.fn(),
    updateTaskStatus: jest.fn(),
    deleteTask: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('use-tasks hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  describe('taskKeys', () => {
    it('should generate correct keys', () => {
      expect(taskKeys.all).toEqual(['tasks']);
      expect(taskKeys.detail('task-1')).toEqual(['tasks', 'detail', 'task-1']);
    });
  });

  describe('useTask', () => {
    it('should fetch task by id', async () => {
      const mockTask = { id: 'task-1', title: 'Test Task', statusId: 'status-1' };
      mockApiClient.getTask.mockResolvedValue(mockTask as any);

      const { result } = renderHook(() => useTask('task-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockTask);
      expect(mockApiClient.getTask).toHaveBeenCalledWith('task-1');
    });

    it('should not fetch when taskId is empty', () => {
      renderHook(() => useTask(''), { wrapper });

      expect(mockApiClient.getTask).not.toHaveBeenCalled();
    });

    it('should handle error', async () => {
      mockApiClient.getTask.mockRejectedValue(new Error('Not found'));

      const { result } = renderHook(() => useTask('nonexistent'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('useUpdateTask', () => {
    it('should update task', async () => {
      const mockTask = { id: 'task-1', title: 'Updated Task' };
      mockApiClient.updateTask.mockResolvedValue(mockTask as any);

      const { result } = renderHook(() => useUpdateTask(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'task-1',
          data: { title: 'Updated Task' },
        });
      });

      expect(mockApiClient.updateTask).toHaveBeenCalledWith('task-1', { title: 'Updated Task' });
    });

    it('should invalidate queries on success', async () => {
      const mockTask = { id: 'task-1', title: 'Updated Task' };
      mockApiClient.updateTask.mockResolvedValue(mockTask as any);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateTask(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'task-1',
          data: { title: 'Updated Task' },
        });
      });

      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  describe('useUpdateTaskStatus', () => {
    it('should update task status', async () => {
      const mockTask = { id: 'task-1', statusId: 'task-done' };
      mockApiClient.updateTaskStatus.mockResolvedValue(mockTask as any);

      const { result } = renderHook(() => useUpdateTaskStatus(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'task-1',
          statusId: 'task-done',
        });
      });

      expect(mockApiClient.updateTaskStatus).toHaveBeenCalledWith('task-1', 'task-done');
    });
  });

  describe('useDeleteTask', () => {
    it('should delete task', async () => {
      mockApiClient.deleteTask.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteTask(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('task-1');
      });

      expect(mockApiClient.deleteTask).toHaveBeenCalledWith('task-1');
    });

    it('should invalidate queries on success', async () => {
      mockApiClient.deleteTask.mockResolvedValue(undefined);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteTask(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('task-1');
      });

      expect(invalidateSpy).toHaveBeenCalled();
    });
  });
});
