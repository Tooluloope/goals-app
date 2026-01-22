'use client';

import { Plus, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { useProjects } from '@/hooks/use-projects';

export function QuickActions() {
  const {
    setAddProjectModalOpen,
    openAddTaskModal,
    openAddReviewModal,
  } = useUIStore();
  const { currentWorkspace } = useAuthStore();
  const { getStatusesForWorkspace } = useConfigStore();
  const { data: projects } = useProjects();

  const statuses = currentWorkspace ? getStatusesForWorkspace(currentWorkspace.id) : [];
  const doingStatusId = statuses.find(s => s.name === 'Doing')?.id || 'status-doing';

  const doingProjects = projects?.filter((p) => p.statusId === doingStatusId) || [];
  const firstDoingProject = doingProjects[0];

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setAddProjectModalOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        New Goal
      </Button>
      {firstDoingProject && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openAddTaskModal(firstDoingProject.id)}
          >
            <Check className="mr-2 h-4 w-4" />
            Add Task
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openAddReviewModal(firstDoingProject.id)}
          >
            <FileText className="mr-2 h-4 w-4" />
            Log Review
          </Button>
        </>
      )}
    </div>
  );
}
