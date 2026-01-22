'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Project } from '@/types';
import { getColorClasses } from '@/types/config';
import { calculateProjectProgress, formatDate, cn } from '@/lib/utils';
import { useUpdateProjectStatus, useDeleteProject } from '@/hooks/use-projects';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';

interface ProjectHeaderProps {
  project: Project;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const router = useRouter();
  const updateStatus = useUpdateProjectStatus();
  const deleteProject = useDeleteProject();
  const { toast } = useToast();
  const { currentWorkspace } = useAuthStore();
  const {
    getStatusesForWorkspace,
    getStatusById,
    getAreaById,
    getPriorityById,
    getCadenceById,
    getConfidenceById,
    getTaskStatusesForWorkspace,
  } = useConfigStore();

  const statuses = currentWorkspace ? getStatusesForWorkspace(currentWorkspace.id) : [];
  const taskStatuses = currentWorkspace ? getTaskStatusesForWorkspace(currentWorkspace.id) : [];
  const completedTaskStatusIds = taskStatuses.filter((s) => s.name === 'Done').map((s) => s.id);

  const currentStatus = currentWorkspace
    ? getStatusById(currentWorkspace.id, project.statusId)
    : null;
  const area = currentWorkspace ? getAreaById(currentWorkspace.id, project.areaId) : null;
  const priority = currentWorkspace
    ? getPriorityById(currentWorkspace.id, project.priorityId)
    : null;
  const cadence = currentWorkspace ? getCadenceById(currentWorkspace.id, project.cadenceId) : null;
  const confidence = currentWorkspace
    ? getConfidenceById(currentWorkspace.id, project.confidenceId)
    : null;

  const progress = calculateProjectProgress(project, completedTaskStatusIds);
  const areaColors = area
    ? getColorClasses(area.color)
    : { bg: 'bg-slate-100', text: 'text-slate-700' };
  const priorityColors = priority
    ? getColorClasses(priority.color)
    : { bg: 'bg-slate-50', text: 'text-slate-600' };

  const handleStatusChange = async (newStatusId: string) => {
    const newStatus = statuses.find((s) => s.id === newStatusId);
    await updateStatus.mutateAsync({ projectId: project.id, statusId: newStatusId });
    toast({
      title: 'Status updated',
      description: `Goal moved to ${newStatus?.name || 'new status'}`,
      variant: 'success',
    });
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this goal?')) {
      await deleteProject.mutateAsync(project.id);
      toast({
        title: 'Goal deleted',
        variant: 'success',
      });
      router.push('/board');
    }
  };

  return (
    <div className="border-b bg-background">
      <div className="container max-w-4xl px-4 py-4">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Title Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-tight md:text-3xl">{project.name}</h1>

            {/* Badges */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge className={cn(areaColors.bg, areaColors.text)}>
                {area?.name || 'Unknown Area'}
              </Badge>
              <Badge className={cn(priorityColors.bg, priorityColors.text)}>
                {priority?.name || 'Unknown'} Priority
              </Badge>
              <Badge variant="outline">{cadence?.name || 'Unknown'} Review</Badge>
              <Badge variant="outline">{confidence?.name || 'Unknown'} Confidence</Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {}}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Goal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status Selector */}
        <div className="mt-4 flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select value={project.statusId} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => {
                const colors = getColorClasses(status.color);
                return (
                  <SelectItem key={status.id} value={status.id}>
                    <span className={colors.text}>{status.name}</span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Progress Bar */}
        {progress.total > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {progress.completed}/{progress.total} ({progress.percentage}%)
              </span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        )}

        {/* Timeline */}
        <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">Start:</span>{' '}
            {formatDate(project.startDate, 'MMM d, yyyy')}
          </div>
          <div>
            <span className="font-medium text-foreground">Target:</span>{' '}
            {formatDate(project.targetDate, 'MMM d, yyyy')}
          </div>
          {project.lastReviewDate && (
            <div>
              <span className="font-medium text-foreground">Last Review:</span>{' '}
              {formatDate(project.lastReviewDate, 'MMM d, yyyy')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
