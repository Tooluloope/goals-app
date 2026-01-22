'use client';

import { useState } from 'react';
import { format, differenceInDays, isAfter, isBefore, startOfMonth, endOfMonth } from 'date-fns';
import { useRouter } from 'next/navigation';
import { LayoutList, GanttChart, ChevronRight, Calendar, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn, toDate, calculateProjectProgress } from '@/lib/utils';
import { getColorClasses } from '@/types/config';
import type { Project } from '@/types';

interface TimelineProject {
  project: Project;
  areaName: string;
  areaColor: string;
  statusName: string;
  statusType: 'active' | 'completed' | 'cancelled';
  progress: number;
}

interface RoadmapTimelineProps {
  projects: TimelineProject[];
  completedTaskStatusIds: string[];
}

type ViewMode = 'gantt' | 'timeline';

export function RoadmapTimeline({ projects, completedTaskStatusIds }: RoadmapTimelineProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('gantt');
  const router = useRouter();

  // Calculate date range for Gantt chart
  const today = new Date();
  const startDate = startOfMonth(today);
  const endDate = endOfMonth(new Date(today.getFullYear(), 11, 31)); // End of current year
  const totalDays = differenceInDays(endDate, startDate);

  // Sort projects by start date
  const sortedProjects = [...projects].sort(
    (a, b) => toDate(a.project.startDate).getTime() - toDate(b.project.startDate).getTime()
  );

  const getStatusColor = (statusType: string) => {
    switch (statusType) {
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-primary';
    }
  };

  const getBarPosition = (project: Project) => {
    const projectStart = toDate(project.startDate);
    const projectEnd = toDate(project.targetDate);

    const startOffset = Math.max(0, differenceInDays(projectStart, startDate));
    const endOffset = Math.min(totalDays, differenceInDays(projectEnd, startDate));
    const duration = endOffset - startOffset;

    const left = (startOffset / totalDays) * 100;
    const width = Math.max(2, (duration / totalDays) * 100);

    return { left: `${left}%`, width: `${width}%` };
  };

  const isOverdue = (project: Project, statusType: string) => {
    if (statusType === 'completed') return false;
    return isAfter(today, toDate(project.targetDate));
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Project Timeline</CardTitle>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant={viewMode === 'gantt' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('gantt')}
            className="h-8 px-3"
          >
            <GanttChart className="mr-2 h-4 w-4" />
            Gantt
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('timeline')}
            className="h-8 px-3"
          >
            <LayoutList className="mr-2 h-4 w-4" />
            Timeline
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'gantt' ? (
          <GanttView
            projects={sortedProjects}
            startDate={startDate}
            endDate={endDate}
            totalDays={totalDays}
            getBarPosition={getBarPosition}
            getStatusColor={getStatusColor}
            isOverdue={isOverdue}
            onProjectClick={(id) => router.push(`/project/${id}`)}
            completedTaskStatusIds={completedTaskStatusIds}
          />
        ) : (
          <VerticalTimeline
            projects={sortedProjects}
            getStatusColor={getStatusColor}
            isOverdue={isOverdue}
            onProjectClick={(id) => router.push(`/project/${id}`)}
            completedTaskStatusIds={completedTaskStatusIds}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface GanttViewProps {
  projects: TimelineProject[];
  startDate: Date;
  endDate: Date;
  totalDays: number;
  getBarPosition: (project: Project) => { left: string; width: string };
  getStatusColor: (statusType: string) => string;
  isOverdue: (project: Project, statusType: string) => boolean;
  onProjectClick: (id: string) => void;
  completedTaskStatusIds: string[];
}

function GanttView({
  projects,
  startDate,
  totalDays,
  getBarPosition,
  getStatusColor,
  isOverdue,
  onProjectClick,
  completedTaskStatusIds,
}: GanttViewProps) {
  // Generate month markers
  const months: { name: string; position: number }[] = [];
  for (let i = 0; i <= 12; i++) {
    const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    if (monthDate.getFullYear() > startDate.getFullYear() + 1) break;
    const daysFromStart = differenceInDays(monthDate, startDate);
    if (daysFromStart >= 0 && daysFromStart <= totalDays) {
      months.push({
        name: format(monthDate, 'MMM'),
        position: (daysFromStart / totalDays) * 100,
      });
    }
  }

  // Today marker position
  const todayPosition = (differenceInDays(new Date(), startDate) / totalDays) * 100;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Month headers */}
        <div className="relative mb-2 h-6 border-b">
          {months.map((month, idx) => (
            <div
              key={idx}
              className="absolute text-xs text-muted-foreground"
              style={{ left: `${month.position}%` }}
            >
              {month.name}
            </div>
          ))}
        </div>

        {/* Projects */}
        <div className="space-y-2">
          {projects.map((item) => {
            const position = getBarPosition(item.project);
            const progress = calculateProjectProgress(item.project, completedTaskStatusIds);
            const overdue = isOverdue(item.project, item.statusType);
            const areaColors = getColorClasses(item.areaColor);

            return (
              <div
                key={item.project.id}
                className="group relative flex items-center gap-4 rounded-lg p-2 hover:bg-muted/50 cursor-pointer"
                onClick={() => onProjectClick(item.project.id)}
              >
                {/* Project name */}
                <div className="w-40 shrink-0">
                  <p className="truncate text-sm font-medium">{item.project.name}</p>
                  <Badge className={cn('text-[10px]', areaColors.bg, areaColors.text)}>
                    {item.areaName}
                  </Badge>
                </div>

                {/* Gantt bar area */}
                <div className="relative h-8 flex-1 rounded bg-muted/30">
                  {/* Today marker */}
                  {todayPosition > 0 && todayPosition < 100 && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
                      style={{ left: `${todayPosition}%` }}
                    />
                  )}

                  {/* Project bar */}
                  <div
                    className={cn(
                      'absolute top-1 bottom-1 rounded transition-all',
                      overdue ? 'bg-red-500/80' : getStatusColor(item.statusType),
                      'group-hover:ring-2 ring-primary/50'
                    )}
                    style={position}
                  >
                    {/* Progress fill */}
                    <div
                      className="absolute inset-0 rounded bg-white/30"
                      style={{ width: `${progress.percentage}%` }}
                    />
                    {/* Progress text */}
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white">
                      {progress.percentage}%
                    </span>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-primary" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-green-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-red-500" />
            <span>Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-px bg-red-500" />
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface VerticalTimelineProps {
  projects: TimelineProject[];
  getStatusColor: (statusType: string) => string;
  isOverdue: (project: Project, statusType: string) => boolean;
  onProjectClick: (id: string) => void;
  completedTaskStatusIds: string[];
}

function VerticalTimeline({
  projects,
  getStatusColor,
  isOverdue,
  onProjectClick,
  completedTaskStatusIds,
}: VerticalTimelineProps) {
  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-6">
        {projects.map((item) => {
          const progress = calculateProjectProgress(item.project, completedTaskStatusIds);
          const overdue = isOverdue(item.project, item.statusType);
          const areaColors = getColorClasses(item.areaColor);

          return (
            <div
              key={item.project.id}
              className="relative group cursor-pointer"
              onClick={() => onProjectClick(item.project.id)}
            >
              {/* Timeline dot */}
              <div
                className={cn(
                  'absolute -left-5 top-2 h-4 w-4 rounded-full border-4 border-background',
                  overdue ? 'bg-red-500' : getStatusColor(item.statusType)
                )}
              />

              {/* Content card */}
              <div className="rounded-lg border bg-card p-4 transition-all hover:shadow-md hover:border-primary/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-semibold truncate">{item.project.name}</h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge className={cn('text-[10px]', areaColors.bg, areaColors.text)}>
                        {item.areaName}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(overdue && 'border-red-500 text-red-500')}
                      >
                        {item.statusName}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>

                {/* Dates */}
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(toDate(item.project.startDate), 'MMM d')} -{' '}
                      {format(toDate(item.project.targetDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{progress.percentage}%</span>
                  </div>
                  <Progress value={progress.percentage} className="h-1.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
