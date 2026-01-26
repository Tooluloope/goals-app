'use client';

import { useRouter } from 'next/navigation';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Calendar, ChevronRight, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Project } from '@/types';
import { getColorClasses } from '@/types/config';
import { useConfigStore } from '@/store/config-store';
import { useAuthStore } from '@/store/auth-store';
import { useWorkspaceMembers } from '@/hooks/use-workspace-members';
import {
  calculateProjectProgress,
  formatDate,
  getDaysUntilDeadline,
  areaColors,
  priorityColors,
} from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  statusId?: string;
  isDragging?: boolean;
}

export function ProjectCard({ project, statusId, isDragging }: ProjectCardProps) {
  const router = useRouter();
  const { currentWorkspace } = useAuthStore();
  const { getAreaById, getPriorityById, getConfig, getTagById } = useConfigStore();
  const { data: workspaceMembers = [] } = useWorkspaceMembers(currentWorkspace?.id);

  // Get owner info if assigned
  const owner = project.ownerId ? workspaceMembers.find((m) => m.userId === project.ownerId) : null;

  const config = currentWorkspace ? getConfig(currentWorkspace.id) : null;

  // Get completed task status IDs for progress calculation
  const completedTaskStatusIds = config
    ? config.taskStatuses.filter((ts) => ts.countAsProgress).map((ts) => ts.id)
    : ['task-done'];

  const progress = calculateProjectProgress(project, completedTaskStatusIds);
  const daysUntil = getDaysUntilDeadline(project.targetDate);

  // Get area and priority config (use first area for primary display)
  const primaryAreaId = project.areaIds?.[0];
  const area =
    currentWorkspace && primaryAreaId ? getAreaById(currentWorkspace.id, primaryAreaId) : null;
  const priority = currentWorkspace
    ? getPriorityById(currentWorkspace.id, project.priorityId)
    : null;

  // Get tags for project
  const projectTags =
    currentWorkspace && project.tagIds
      ? project.tagIds.map((tagId) => getTagById(currentWorkspace.id, tagId)).filter(Boolean)
      : [];

  // Get colors from config or fallback to legacy colors
  const colors = area
    ? getColorClasses(area.color)
    : primaryAreaId && areaColors[primaryAreaId]
      ? areaColors[primaryAreaId]
      : {
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          border: 'border-slate-200',
        };

  const priorityColor = priority
    ? getColorClasses(priority.color)
    : priorityColors[project.priorityId] || { bg: 'bg-slate-50', text: 'text-slate-600' };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: project.id,
    data: {
      statusId: statusId || project.statusId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isActiveDragging = isDragging || isSortableDragging;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isActiveDragging && 'opacity-50 shadow-lg ring-2 ring-primary'
      )}
      onClick={() => router.push(`/project/${project.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-2">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            {/* Title */}
            <h3 className="font-medium leading-tight truncate" title={project.name}>
              {project.name}
            </h3>

            {/* Badges */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge className={cn('text-xs', colors.bg, colors.text)}>
                {area?.name || primaryAreaId || 'Unknown'}
              </Badge>
              {project.areaIds && project.areaIds.length > 1 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  +{project.areaIds.length - 1}
                </Badge>
              )}
              <Badge className={cn('text-xs', priorityColor.bg, priorityColor.text)}>
                {priority?.name || project.priorityId}
              </Badge>
            </div>

            {/* Tags */}
            {projectTags.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1">
                {projectTags.map((tag) => {
                  if (!tag) return null;
                  const tagColors = getColorClasses(tag.color);
                  return (
                    <span
                      key={tag.id}
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                        tagColors.bg,
                        tagColors.text
                      )}
                    >
                      {tag.name}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Blocked Indicator */}
            {project.blockedBy && project.blockedBy.length > 0 && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">
                  <Lock className="h-3 w-3" />
                  Blocked by {project.blockedBy.length}{' '}
                  {project.blockedBy.length === 1 ? 'project' : 'projects'}
                </span>
              </div>
            )}

            {/* Progress */}
            {progress.total > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{progress.percentage}%</span>
                </div>
                <Progress value={progress.percentage} className="h-1.5" />
              </div>
            )}

            {/* Deadline and Owner */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatDate(project.targetDate, 'MMM d')}
                </div>
                {owner && (
                  <Avatar className="h-5 w-5" title={owner.name}>
                    <AvatarImage src={owner.avatar || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {owner.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
              {daysUntil <= 30 && daysUntil >= 0 && (
                <span
                  className={cn(
                    'text-xs font-medium',
                    daysUntil <= 7 && 'text-red-600',
                    daysUntil > 7 && daysUntil <= 14 && 'text-amber-600'
                  )}
                >
                  {daysUntil} days left
                </span>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/project/${project.id}`);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
