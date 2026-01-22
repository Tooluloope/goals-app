'use client';

import { useRouter } from 'next/navigation';
import { Clock, ChevronRight, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjects } from '@/hooks/use-projects';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { getColorClasses } from '@/types/config';
import { isReviewDue, getDaysSinceLastReview, formatRelativeTime, cn } from '@/lib/utils';

export function ReviewsDue() {
  const router = useRouter();
  const { data: projects, isLoading } = useProjects();
  const { openAddReviewModal } = useUIStore();
  const { currentWorkspace } = useAuthStore();
  const { getStatusesForWorkspace, getCadencesForWorkspace, getCadenceById } = useConfigStore();

  const statuses = currentWorkspace ? getStatusesForWorkspace(currentWorkspace.id) : [];
  const cadences = currentWorkspace ? getCadencesForWorkspace(currentWorkspace.id) : [];
  const activeStatusIds = statuses.filter((s) => s.name === 'Doing').map((s) => s.id);

  // Get projects that need review
  const projectsNeedingReview =
    projects
      ?.filter((p) => activeStatusIds.includes(p.statusId) && isReviewDue(p, cadences))
      .map((p) => ({
        ...p,
        daysSinceReview: getDaysSinceLastReview(p.lastReviewDate),
      }))
      .sort((a, b) => (b.daysSinceReview || 999) - (a.daysSinceReview || 999))
      .slice(0, 5) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Reviews Due
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (projectsNeedingReview.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Reviews Due
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-4 rounded-full bg-emerald-100 p-3">
              <Clock className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="font-medium">All caught up!</h3>
            <p className="mt-1 text-sm text-muted-foreground">No reviews are due right now</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Reviews Due
          <Badge variant="secondary" className="ml-auto">
            {projectsNeedingReview.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {projectsNeedingReview.map((project) => {
          const cadence = currentWorkspace
            ? getCadenceById(currentWorkspace.id, project.cadenceId)
            : null;
          const colors = cadence
            ? getColorClasses('sky')
            : { bg: 'bg-slate-100', text: 'text-slate-700' };
          return (
            <div
              key={project.id}
              className="group flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent/50"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-tight">{project.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge className={cn('text-xs', colors.bg, colors.text)}>
                    {cadence?.name || 'Unknown'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {project.lastReviewDate
                      ? `Last review ${formatRelativeTime(project.lastReviewDate)}`
                      : 'Never reviewed'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openAddReviewModal(project.id);
                  }}
                >
                  <FileText className="mr-1 h-4 w-4" />
                  Log Review
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
