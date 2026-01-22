'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Target, ArrowRight, TrendingUp, Clock, CheckCircle2, Folder } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/app-layout';
import { useProjects } from '@/hooks/use-projects';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { calculateProjectProgress, isReviewDue, cn } from '@/lib/utils';
import { getColorClasses } from '@/types/config';

const AREA_GRADIENTS: Record<string, string> = {
  violet: 'from-violet-600 to-purple-700',
  pink: 'from-pink-500 to-rose-600',
  blue: 'from-blue-500 to-indigo-600',
  green: 'from-emerald-500 to-green-600',
  yellow: 'from-amber-400 to-yellow-500',
  orange: 'from-orange-500 to-red-500',
  red: 'from-red-500 to-rose-600',
  cyan: 'from-cyan-500 to-teal-600',
  indigo: 'from-indigo-500 to-violet-600',
  teal: 'from-teal-500 to-cyan-600',
  emerald: 'from-emerald-500 to-teal-600',
  amber: 'from-amber-500 to-orange-600',
  rose: 'from-rose-500 to-pink-600',
  slate: 'from-slate-500 to-gray-600',
};

export default function ProjectsPage() {
  const router = useRouter();
  const { data: projects, isLoading } = useProjects();
  const { currentWorkspace } = useAuthStore();
  const {
    getAreasForWorkspace,
    getStatusById,
    getStatusesForWorkspace,
    getCadencesForWorkspace,
    getTaskStatusesForWorkspace,
  } = useConfigStore();

  const areas = currentWorkspace ? getAreasForWorkspace(currentWorkspace.id) : [];
  const statuses = currentWorkspace ? getStatusesForWorkspace(currentWorkspace.id) : [];
  const cadences = currentWorkspace ? getCadencesForWorkspace(currentWorkspace.id) : [];
  const taskStatuses = currentWorkspace ? getTaskStatusesForWorkspace(currentWorkspace.id) : [];

  const doneTaskStatusIds = taskStatuses.filter(s => s.name === 'Done').map(s => s.id);

  const areaStats = useMemo(() => {
    if (!projects || !currentWorkspace) return [];

    return areas.map((area) => {
      const areaProjects = projects.filter((p) => p.areaId === area.id);
      const total = areaProjects.length;

      const completed = areaProjects.filter((p) => {
        const status = getStatusById(currentWorkspace.id, p.statusId);
        return status?.type === 'completed';
      }).length;

      const inProgress = areaProjects.filter((p) => {
        const status = getStatusById(currentWorkspace.id, p.statusId);
        return status?.type === 'active';
      }).length;

      const reviewsDue = areaProjects.filter((p) => {
        const status = getStatusById(currentWorkspace.id, p.statusId);
        return status?.type === 'active' && isReviewDue(p, cadences);
      }).length;

      const pendingTasks = areaProjects.reduce((acc, p) => {
        return acc + p.tasks.filter((t) => !doneTaskStatusIds.includes(t.statusId)).length;
      }, 0);

      const overallPercentage = total > 0
        ? Math.round(
            areaProjects.reduce((acc, p) => acc + calculateProjectProgress(p, doneTaskStatusIds).percentage, 0) / total
          )
        : 0;

      return {
        area,
        total,
        completed,
        inProgress,
        reviewsDue,
        pendingTasks,
        overallPercentage,
      };
    }).filter((stat) => stat.total > 0);
  }, [areas, projects, currentWorkspace, getStatusById, cadences, doneTaskStatusIds]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const totalProjects = areaStats.reduce((acc, s) => acc + s.total, 0);
    const totalCompleted = areaStats.reduce((acc, s) => acc + s.completed, 0);
    const totalInProgress = areaStats.reduce((acc, s) => acc + s.inProgress, 0);
    const totalReviewsDue = areaStats.reduce((acc, s) => acc + s.reviewsDue, 0);
    const overallProgress = totalProjects > 0
      ? Math.round(areaStats.reduce((acc, s) => acc + s.overallPercentage * s.total, 0) / totalProjects)
      : 0;

    return {
      totalProjects,
      totalCompleted,
      totalInProgress,
      totalReviewsDue,
      overallProgress,
    };
  }, [areaStats]);

  if (isLoading) {
    return (
      <AppLayout title="Projects">
        <div className="min-h-screen bg-background">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white">
            <div className="container mx-auto px-4 py-12">
              <Skeleton className="h-10 w-64 bg-white/20" />
              <Skeleton className="mt-2 h-6 w-96 bg-white/20" />
            </div>
          </div>
          <div className="container mx-auto px-4 py-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Projects">
      <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
              <Folder className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
              <p className="text-white/70">
                Browse all your goals organized by life areas
              </p>
            </div>
          </div>

          {/* Overall Stats */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-white/70">
                <Target className="h-4 w-4" />
                <span className="text-sm">Total Goals</span>
              </div>
              <p className="mt-1 text-2xl font-bold">{overallStats.totalProjects}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-white/70">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">In Progress</span>
              </div>
              <p className="mt-1 text-2xl font-bold">{overallStats.totalInProgress}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-white/70">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Completed</span>
              </div>
              <p className="mt-1 text-2xl font-bold">{overallStats.totalCompleted}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-white/70">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Reviews Due</span>
              </div>
              <p className="mt-1 text-2xl font-bold">{overallStats.totalReviewsDue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Area Cards */}
      <div className="container mx-auto px-4 py-8">
        {areaStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Folder className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No Projects Yet</h3>
            <p className="mt-2 max-w-md text-muted-foreground">
              Create your first goal to start tracking progress across different life areas.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {areaStats.map(({ area, total, completed, inProgress, reviewsDue, pendingTasks, overallPercentage }) => {
              const colors = getColorClasses(area.color);
              const gradient = AREA_GRADIENTS[area.color] || AREA_GRADIENTS.slate;

              return (
                <Card
                  key={area.id}
                  className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
                  onClick={() => router.push(`/projects/${area.id}`)}
                >
                  {/* Gradient Header */}
                  <div className={cn('bg-gradient-to-br p-6 text-white', gradient)}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{area.name}</h3>
                        <p className="mt-1 text-sm text-white/80">
                          {total} goal{total !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm transition-transform group-hover:translate-x-1">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/80">Overall Progress</span>
                        <span className="font-semibold">{overallPercentage}%</span>
                      </div>
                      <Progress
                        value={overallPercentage}
                        className="mt-2 h-2 bg-white/20"
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">In Progress</p>
                        <p className="text-lg font-semibold">{inProgress}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Completed</p>
                        <p className="text-lg font-semibold">{completed}</p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {reviewsDue > 0 && (
                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                          {reviewsDue} review{reviewsDue !== 1 ? 's' : ''} due
                        </Badge>
                      )}
                      {pendingTasks > 0 && (
                        <Badge variant="outline">
                          {pendingTasks} task{pendingTasks !== 1 ? 's' : ''} pending
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </AppLayout>
  );
}
