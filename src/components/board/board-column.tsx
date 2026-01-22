'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Project } from '@/types';
import { getColorClasses } from '@/types/config';
import { ProjectCard } from './project-card';
import { cn } from '@/lib/utils';

interface BoardColumnProps {
  statusId: string;
  statusName: string;
  statusColor: string;
  projects: Project[];
  activeId: string | null;
}

export function BoardColumn({ statusId, statusName, statusColor, projects, activeId }: BoardColumnProps) {
  const colors = getColorClasses(statusColor);

  const { setNodeRef, isOver } = useDroppable({
    id: statusId,
  });

  return (
    <div className="flex h-full min-w-[280px] flex-col rounded-2xl bg-muted/50 md:min-w-[300px]">
      {/* Column Header */}
      <div className="flex items-center gap-2 p-4">
        <span
          className={cn(
            'rounded-lg px-2.5 py-1 text-sm font-semibold',
            colors.bg,
            colors.text
          )}
        >
          {statusName}
        </span>
        <span className="text-sm text-muted-foreground">
          {projects.length}
        </span>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 space-y-3 overflow-y-auto p-2 pt-0 transition-colors',
          isOver && 'bg-primary/5 rounded-xl'
        )}
      >
        <SortableContext
          items={projects.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isDragging={activeId === project.id}
            />
          ))}
        </SortableContext>

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 text-sm text-muted-foreground">
            No goals here
          </div>
        )}
      </div>
    </div>
  );
}
