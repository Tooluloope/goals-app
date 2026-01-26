'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, ChevronRight, Pause } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjects, useUpdateProjectStatus } from '@/hooks/use-projects';
import { isProjectStale, formatRelativeTime, cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { getColorClasses } from '@/types/config';

export function StaleProjects() {
  const router = useRouter();
  const { data: projects, isLoading } = useProjects();
  const updateProjectStatus = useUpdateProjectStatus();
  const { currentWorkspace } = useAuthStore();
  const { getStatusesForWorkspace, getAreaById } = useConfigStore();

  const statuses = currentWorkspace ? getStatusesForWorkspace(currentWorkspace.id) : [];
  const activeStatusIds = statuses.filter((s) => s.name === 'Doing').map((s) => s.id);
  const todoStatusId = statuses.find((s) => s.name === 'Todo')?.id || 'status-todo';

  // Get stale projects (Doing but not updated in 30 days)
  const staleProjects =
    projects?.filter((p) => isProjectStale(p, activeStatusIds)).slice(0, 3) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Needs Attention
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-14 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (staleProjects.length === 0) {
    return null; // Don't show if no stale projects
  }

  const handleMoveToTodo = async (projectId: string) => {
    await updateProjectStatus.mutateAsync({ projectId, statusId: todoStatusId });
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-700">
          <AlertCircle className="h-5 w-5" />
          Needs Attention
          <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-700">
            {staleProjects.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground mb-3">
          These projects are in &quot;Doing&quot; but haven&apos;t been updated in 30+ days.
        </p>
        {staleProjects.map((project) => {
          const primaryAreaId = project.areaIds?.[0];
          const area =
            currentWorkspace && primaryAreaId
              ? getAreaById(currentWorkspace.id, primaryAreaId)
              : null;
          const colors = area
            ? getColorClasses(area.color)
            : { bg: 'bg-slate-100', text: 'text-slate-700' };
          return (
            <div
              key={project.id}
              className="group flex items-center gap-3 rounded-xl border border-amber-200 bg-white p-3 transition-colors hover:bg-amber-50"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-tight">{project.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge className={cn('text-xs', colors.bg, colors.text)}>
                    {area?.name || 'Unknown'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Updated {formatRelativeTime(project.updatedAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveToTodo(project.id);
                  }}
                  disabled={updateProjectStatus.isPending}
                >
                  <Pause className="mr-1 h-4 w-4" />
                  Pause
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => router.push(`/project/${project.id}`)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
