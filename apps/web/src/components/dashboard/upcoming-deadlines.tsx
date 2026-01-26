'use client';

import { useRouter } from 'next/navigation';
import { Calendar, ChevronRight, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjects } from '@/hooks/use-projects';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { getColorClasses } from '@/types/config';
import { getDaysUntilDeadline, getDeadlineUrgency, formatDate, cn } from '@/lib/utils';

export function UpcomingDeadlines() {
  const router = useRouter();
  const { data: projects, isLoading } = useProjects();
  const { currentWorkspace } = useAuthStore();
  const { getStatusesForWorkspace, getAreaById } = useConfigStore();

  const statuses = currentWorkspace ? getStatusesForWorkspace(currentWorkspace.id) : [];
  const activeStatusIds = statuses.filter((s) => s.type === 'active').map((s) => s.id);

  // Get projects with deadlines in next 30 days
  const upcomingProjects =
    projects
      ?.filter((p) => activeStatusIds.includes(p.statusId))
      .map((p) => ({
        ...p,
        daysUntil: getDaysUntilDeadline(p.targetDate),
        urgency: getDeadlineUrgency(p.targetDate),
      }))
      .filter((p) => p.daysUntil <= 30 && p.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (upcomingProjects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-4 rounded-full bg-muted p-3">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium">No upcoming deadlines</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              No projects are due in the next 30 days
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      default:
        return 'bg-card';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {upcomingProjects.map((project) => {
          const primaryAreaId = project.areaIds?.[0];
          const area =
            currentWorkspace && primaryAreaId
              ? getAreaById(currentWorkspace.id, primaryAreaId)
              : null;
          const colors = area
            ? getColorClasses(area.color)
            : { bg: 'bg-slate-100', text: 'text-slate-700' };
          return (
            <button
              key={project.id}
              onClick={() => router.push(`/project/${project.id}`)}
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all hover:shadow-sm',
                getUrgencyStyles(project.urgency)
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {project.urgency === 'critical' && (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                  )}
                  <p className="font-medium leading-tight">{project.name}</p>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge className={cn('text-xs', colors.bg, colors.text)}>
                    {area?.name || 'Unknown'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(project.targetDate, 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    'text-lg font-bold',
                    project.urgency === 'critical' && 'text-red-600',
                    project.urgency === 'warning' && 'text-amber-600'
                  )}
                >
                  {project.daysUntil}
                </p>
                <p className="text-xs text-muted-foreground">
                  {project.daysUntil === 1 ? 'day' : 'days'}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
