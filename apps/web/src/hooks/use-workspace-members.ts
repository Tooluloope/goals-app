'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Query keys
export const workspaceMemberKeys = {
  all: ['workspace-members'] as const,
  workspace: (workspaceId: string) => [...workspaceMemberKeys.all, workspaceId] as const,
};

export interface WorkspaceMemberInfo {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: string;
}

// Fetch workspace members
export function useWorkspaceMembers(workspaceId: string | undefined) {
  return useQuery({
    queryKey: workspaceMemberKeys.workspace(workspaceId ?? ''),
    queryFn: async (): Promise<WorkspaceMemberInfo[]> => {
      if (!workspaceId) return [];
      const workspace = await apiClient.getWorkspaceWithMembers(workspaceId);
      return (workspace.members || []).map((m) => ({
        id: m.id,
        userId: m.user?.id || m.userId,
        name: m.user?.name || 'Unknown',
        email: m.user?.email || '',
        avatar: m.user?.avatar,
        role: m.role,
      }));
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
