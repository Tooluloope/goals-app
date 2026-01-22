'use client';

import { useRouter } from 'next/navigation';
import { Target, ChevronRight, Plus, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjects, useUpdateTaskStatus } from '@/hooks/use-projects';
import { getDailyFocusTasks, truncate, cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { getColorClasses } from '@/types/config';

export function DailyFocus() {
  const router = useRouter();
  const { data: projects, isLoading } = useProjects();
  const updateTaskStatus = useUpdateTaskStatus();
  const { openAddTaskModal } = useUIStore();
  const { currentWorkspace } = useAuthStore();
  const {
    getStatusesForWorkspace,
    getTaskStatusesForWorkspace,
    getAreaById,
  } = useConfigStore();

  const statuses = currentWorkspace ? getStatusesForWorkspace(currentWorkspace.id) : [];
  const taskStatuses = currentWorkspace ? getTaskStatusesForWorkspace(currentWorkspace.id) : [];

  const activeStatusIds = statuses.filter(s => s.name === 'Doing').map(s => s.id);
  const activeTaskStatusIds = taskStatuses.filter(s => s.name === 'Next Action').map(s => s.id);
  const doneTaskStatusId = taskStatuses.find(s => s.name === 'Done')?.id || 'task-done';

  const focusTasks = projects ? getDailyFocusTasks(projects, activeStatusIds, activeTaskStatusIds, 5) : [];

  const handleTaskDone = async (projectId: string, taskId: string) => {
    await updateTaskStatus.mutateAsync({ projectId, taskId, statusId: doneTaskStatusId });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Daily Focus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (focusTasks.length === 0) {
    const doingProjects = projects?.filter((p) => activeStatusIds.includes(p.statusId)) || [];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Daily Focus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-4 rounded-full bg-muted p-3">
              <Target className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium">No next actions</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {doingProjects.length > 0
                ? 'Add some next actions to your active projects'
                : 'Start by moving a project to Doing status'}
            </p>
            {doingProjects.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => openAddTaskModal(doingProjects[0].id)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Daily Focus
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {focusTasks.map(({ task, project }) => {
          const area = currentWorkspace ? getAreaById(currentWorkspace.id, project.areaId) : null;
          const colors = area ? getColorClasses(area.color) : { bg: 'bg-slate-100', text: 'text-slate-700' };
          return (
            <div
              key={task.id}
              className="group flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent/50"
            >
              <Button
                variant="outline"
                size="icon-sm"
                className="h-8 w-8 shrink-0 rounded-full"
                onClick={() => handleTaskDone(project.id, task.id)}
                disabled={updateTaskStatus.isPending}
              >
                <Check className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-tight">{truncate(task.title, 50)}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    className={cn('text-xs', colors.bg, colors.text)}
                  >
                    {area?.name || 'Unknown'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {truncate(project.name, 25)}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100"
                onClick={() => router.push(`/project/${project.id}`)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
