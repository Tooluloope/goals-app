'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';

import { AppLayout } from '@/components/layout/app-layout';
import { BoardColumn } from '@/components/board/board-column';
import { BoardFilters } from '@/components/board/board-filters';
import { ProjectCard } from '@/components/board/project-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useProjects, useUpdateProjectStatus } from '@/hooks/use-projects';
import { useUIStore } from '@/store/ui-store';
import { useConfigStore } from '@/store/config-store';
import { useAuthStore } from '@/store/auth-store';
import { isReviewDue, isDeadlineApproaching } from '@/lib/utils';

export default function BoardPage() {
  const { data: projects, isLoading } = useProjects();
  const updateProjectStatus = useUpdateProjectStatus();
  const { boardFilters, setAddProjectModalOpen } = useUIStore();
  const { currentWorkspace } = useAuthStore();
  const { getConfig, getBoardStatuses, initializeConfig } = useConfigStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Initialize config for workspace
  useEffect(() => {
    if (currentWorkspace) {
      initializeConfig(currentWorkspace.id);
    }
  }, [currentWorkspace, initializeConfig]);

  const config = currentWorkspace ? getConfig(currentWorkspace.id) : null;
  const boardStatuses = currentWorkspace ? getBoardStatuses(currentWorkspace.id) : [];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter projects based on board filters
  const filteredProjects =
    projects?.filter((project) => {
      // Area filter
      if (boardFilters.areaIds.length > 0 && !boardFilters.areaIds.includes(project.areaId)) {
        return false;
      }

      // Priority filter
      if (
        boardFilters.priorityIds.length > 0 &&
        !boardFilters.priorityIds.includes(project.priorityId)
      ) {
        return false;
      }

      // Due soon filter
      if (boardFilters.dueSoon && !isDeadlineApproaching(project.targetDate, 14)) {
        return false;
      }

      // Review due filter
      if (boardFilters.reviewDue && config && !isReviewDue(project, config.cadences)) {
        return false;
      }

      return true;
    }) || [];

  const getProjectsByStatus = (statusId: string) => {
    return filteredProjects.filter((p) => p.statusId === statusId);
  };

  const activeProject = activeId ? filteredProjects.find((p) => p.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const projectId = active.id as string;
    const overId = over.id as string;

    // Determine the target status ID
    // over.id could be a status column ID OR a project card ID (when dropped on another card)
    const isStatusColumn = boardStatuses.some((s) => s.id === overId);
    let newStatusId: string;

    if (isStatusColumn) {
      // Dropped directly on a column
      newStatusId = overId;
    } else {
      // Dropped on another project card - get statusId from sortable data
      const sortableData = over.data.current as { statusId?: string } | undefined;
      if (sortableData?.statusId) {
        newStatusId = sortableData.statusId;
      } else {
        // Fallback: find the project in the full projects list
        const targetProject = projects?.find((p) => p.id === overId);
        if (!targetProject) return;
        newStatusId = targetProject.statusId;
      }
    }

    // Find the dragged project in the full projects list (not filtered)
    const project = projects?.find((p) => p.id === projectId);
    if (!project || project.statusId === newStatusId) return;

    // Update project status
    updateProjectStatus.mutate({ projectId, statusId: newStatusId });
  };

  if (isLoading || !config) {
    return (
      <AppLayout title="Board">
        <div className="flex h-full gap-4 p-4 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[280px] space-y-3">
              <Skeleton className="h-10 w-24 rounded-lg" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Board">
      <div className="flex h-[calc(100vh-8rem)] flex-col md:h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h1 className="text-lg font-semibold md:text-xl">Goal Board</h1>
          <div className="flex items-center gap-2">
            <BoardFilters />
            <Button size="sm" onClick={() => setAddProjectModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Goal
            </Button>
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <div className="flex h-full min-w-max gap-4 p-4">
            <DndContext
              sensors={sensors}
              collisionDetection={pointerWithin}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {boardStatuses.map((status) => (
                <BoardColumn
                  key={status.id}
                  statusId={status.id}
                  statusName={status.name}
                  statusColor={status.color}
                  projects={getProjectsByStatus(status.id)}
                  activeId={activeId}
                />
              ))}

              <DragOverlay>
                {activeProject && (
                  <div className="rotate-3 scale-105">
                    <ProjectCard project={activeProject} isDragging />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
