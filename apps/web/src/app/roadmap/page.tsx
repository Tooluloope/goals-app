'use client';

import { useMemo, useState } from 'react';
import { format, getMonth, getYear } from 'date-fns';
import { Map, Filter } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { RoadmapStats } from '@/components/roadmap/roadmap-stats';
import {
  ProgressCharts,
  AreaProgressChart,
  MonthlyProgressChart,
} from '@/components/roadmap/progress-charts';
import { RoadmapTimeline } from '@/components/roadmap/roadmap-timeline';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjects } from '@/hooks/use-projects';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { toDate } from '@/lib/utils';

export default function RoadmapPage() {
  const { data: projects, isLoading } = useProjects();
  const { currentWorkspace } = useAuthStore();
  const {
    getAreasForWorkspace,
    getStatusesForWorkspace,
    getAreaById,
    getStatusById,
    getTaskStatusesForWorkspace,
  } = useConfigStore();

  const [selectedAreaId, setSelectedAreaId] = useState<string>('all');

  const areas = useMemo(
    () => (currentWorkspace ? getAreasForWorkspace(currentWorkspace.id) : []),
    [currentWorkspace, getAreasForWorkspace]
  );
  const statuses = useMemo(
    () => (currentWorkspace ? getStatusesForWorkspace(currentWorkspace.id) : []),
    [currentWorkspace, getStatusesForWorkspace]
  );
  const taskStatuses = useMemo(
    () => (currentWorkspace ? getTaskStatusesForWorkspace(currentWorkspace.id) : []),
    [currentWorkspace, getTaskStatusesForWorkspace]
  );
  const completedTaskStatusIds = useMemo(
    () => taskStatuses.filter((s) => s.name === 'Done').map((s) => s.id),
    [taskStatuses]
  );

  // Filter projects by area
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (selectedAreaId === 'all') return projects;
    return projects.filter((p) => p.areaId === selectedAreaId);
  }, [projects, selectedAreaId]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalGoals = filteredProjects.length;
    const completedGoals = filteredProjects.filter((p) => {
      const status = currentWorkspace ? getStatusById(currentWorkspace.id, p.statusId) : null;
      return status?.type === 'completed';
    }).length;
    const inProgressGoals = filteredProjects.filter((p) => {
      const status = currentWorkspace ? getStatusById(currentWorkspace.id, p.statusId) : null;
      return status?.type === 'active';
    }).length;
    const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    return { totalGoals, completedGoals, inProgressGoals, completionRate };
  }, [filteredProjects, currentWorkspace, getStatusById]);

  // Calculate area progress data for chart
  const areaData = useMemo(() => {
    if (!currentWorkspace) return [];

    return areas
      .map((area) => {
        const areaProjects = filteredProjects.filter((p) => p.areaId === area.id);
        const total = areaProjects.length;
        const completed = areaProjects.filter((p) => {
          const status = getStatusById(currentWorkspace.id, p.statusId);
          return status?.type === 'completed';
        }).length;

        return {
          name: area.name,
          total,
          completed,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
          color: area.color,
        };
      })
      .filter((a) => a.total > 0);
  }, [areas, filteredProjects, currentWorkspace, getStatusById]);

  // Calculate monthly progress data for chart
  const monthlyData = useMemo(() => {
    if (!currentWorkspace) return [];

    const months: { month: string; completed: number; started: number }[] = [];
    const currentYear = getYear(new Date());

    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(currentYear, i, 1);
      const monthName = format(monthDate, 'MMM');

      const started = filteredProjects.filter((p) => {
        const startDate = toDate(p.startDate);
        return getMonth(startDate) === i && getYear(startDate) === currentYear;
      }).length;

      const completed = filteredProjects.filter((p) => {
        const status = getStatusById(currentWorkspace.id, p.statusId);
        if (status?.type !== 'completed') return false;
        // For now, count completed projects in their target month
        const targetDate = toDate(p.targetDate);
        return getMonth(targetDate) === i && getYear(targetDate) === currentYear;
      }).length;

      months.push({ month: monthName, completed, started });
    }

    return months;
  }, [filteredProjects, currentWorkspace, getStatusById]);

  // Prepare timeline data
  const timelineProjects = useMemo(() => {
    if (!currentWorkspace) return [];

    return filteredProjects.map((project) => {
      const area = getAreaById(currentWorkspace.id, project.areaId);
      const status = getStatusById(currentWorkspace.id, project.statusId);

      return {
        project,
        areaName: area?.name || 'Unknown',
        areaColor: area?.color || 'slate',
        statusName: status?.name || 'Unknown',
        statusType: (status?.type || 'active') as 'active' | 'completed' | 'cancelled',
        progress: 0, // Will be calculated in the timeline component
      };
    });
  }, [filteredProjects, currentWorkspace, getAreaById, getStatusById]);

  if (isLoading) {
    return (
      <AppLayout title="Roadmap">
        <div className="container max-w-7xl px-4 py-6 md:py-8">
          <div className="mb-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Roadmap">
      <div className="container max-w-7xl px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Map className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">{new Date().getFullYear()} Roadmap</h1>
              <p className="text-muted-foreground">Track your goals and visualize progress</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedAreaId} onValueChange={setSelectedAreaId}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <RoadmapStats
          totalGoals={stats.totalGoals}
          completedGoals={stats.completedGoals}
          inProgressGoals={stats.inProgressGoals}
          completionRate={stats.completionRate}
        />

        {/* Charts */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <AreaProgressChart data={areaData} />
          <MonthlyProgressChart data={monthlyData} />
        </div>

        {/* Timeline */}
        <div className="mt-8">
          <RoadmapTimeline
            projects={timelineProjects}
            completedTaskStatusIds={completedTaskStatusIds}
          />
        </div>
      </div>
    </AppLayout>
  );
}
