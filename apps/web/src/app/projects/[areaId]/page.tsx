'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Plus,
  ChevronRight,
  ListTodo,
  FileText,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useProjects } from '@/hooks/use-projects';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { useUIStore } from '@/store/ui-store';
import { getColorClasses } from '@/types/config';
import {
  calculateProjectProgress,
  formatDate,
  getDaysUntilDeadline,
  getDeadlineUrgency,
  isReviewDue,
  cn,
} from '@/lib/utils';
import { Project } from '@/types';
import { RichTextContent } from '@/components/ui/rich-text-content';

// Area gradient backgrounds
const AREA_GRADIENTS: Record<string, string> = {
  violet: 'from-violet-600 to-purple-700',
  pink: 'from-pink-500 to-rose-600',
  sky: 'from-sky-500 to-blue-600',
  emerald: 'from-emerald-500 to-teal-600',
  amber: 'from-amber-500 to-orange-600',
  red: 'from-red-500 to-rose-600',
  purple: 'from-purple-500 to-indigo-600',
  blue: 'from-blue-500 to-indigo-600',
  slate: 'from-slate-500 to-gray-600',
  green: 'from-green-500 to-emerald-600',
  teal: 'from-teal-500 to-cyan-600',
  cyan: 'from-cyan-500 to-sky-600',
  indigo: 'from-indigo-500 to-violet-600',
  fuchsia: 'from-fuchsia-500 to-pink-600',
  rose: 'from-rose-500 to-red-600',
  orange: 'from-orange-500 to-amber-600',
  yellow: 'from-yellow-500 to-amber-600',
  lime: 'from-lime-500 to-green-600',
  gray: 'from-gray-500 to-slate-600',
};

export default function AreaProjectsPage() {
  const params = useParams();
  const router = useRouter();
  const areaId = params.areaId as string;

  const { data: projects, isLoading } = useProjects();
  const { currentWorkspace } = useAuthStore();
  const {
    getAreaById,
    getStatusById,
    getPriorityById,
    getCadencesForWorkspace,
    getTaskStatusesForWorkspace,
  } = useConfigStore();
  const { setAddProjectModalOpen, openAddTaskModal } = useUIStore();

  const area = currentWorkspace ? getAreaById(currentWorkspace.id, areaId) : null;
  const cadences = useMemo(
    () => (currentWorkspace ? getCadencesForWorkspace(currentWorkspace.id) : []),
    [currentWorkspace, getCadencesForWorkspace]
  );
  const taskStatuses = useMemo(
    () => (currentWorkspace ? getTaskStatusesForWorkspace(currentWorkspace.id) : []),
    [currentWorkspace, getTaskStatusesForWorkspace]
  );
  const doneTaskStatusIds = useMemo(
    () => taskStatuses.filter((s) => s.name === 'Done').map((s) => s.id),
    [taskStatuses]
  );
  const nextActionStatusId = useMemo(
    () => taskStatuses.find((s) => s.name === 'Next Action')?.id || 'task-next',
    [taskStatuses]
  );

  // Filter projects for this area
  const areaProjects = useMemo(() => {
    return projects?.filter((p) => p.areaId === areaId) || [];
  }, [projects, areaId]);

  // Calculate area-wide stats
  const areaStats = useMemo(() => {
    const total = areaProjects.length;
    const completed = areaProjects.filter((p) => {
      const status = currentWorkspace ? getStatusById(currentWorkspace.id, p.statusId) : null;
      return status?.type === 'completed';
    }).length;
    const inProgress = areaProjects.filter((p) => {
      const status = currentWorkspace ? getStatusById(currentWorkspace.id, p.statusId) : null;
      return status?.name === 'Doing';
    }).length;
    const reviewsDue = areaProjects.filter((p) => isReviewDue(p, cadences)).length;

    // Total progress across all projects
    let totalItems = 0;
    let completedItems = 0;
    areaProjects.forEach((p) => {
      const progress = calculateProjectProgress(p, doneTaskStatusIds);
      totalItems += progress.total;
      completedItems += progress.completed;
    });
    const overallPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Get all pending tasks across area
    const pendingTasks: { task: NonNullable<Project['tasks']>[0]; project: Project }[] = [];
    areaProjects.forEach((p) => {
      (p.tasks ?? [])
        .filter((t) => t.statusId === nextActionStatusId)
        .forEach((t) => pendingTasks.push({ task: t, project: p }));
    });

    return {
      total,
      completed,
      inProgress,
      reviewsDue,
      overallPercentage,
      pendingTasks: pendingTasks.slice(0, 5),
    };
  }, [
    areaProjects,
    currentWorkspace,
    getStatusById,
    cadences,
    doneTaskStatusIds,
    nextActionStatusId,
  ]);

  const areaColors = area
    ? getColorClasses(area.color)
    : { bg: 'bg-slate-100', text: 'text-slate-700' };
  const gradient = area
    ? AREA_GRADIENTS[area.color] || 'from-slate-500 to-gray-600'
    : 'from-slate-500 to-gray-600';

  if (isLoading) {
    return (
      <AppLayout title="Projects">
        <div className="space-y-6 p-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  if (!area) {
    return (
      <AppLayout title="Projects">
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Area not found</h2>
          <p className="text-muted-foreground mb-4">
            This area doesn&apos;t exist or has been removed.
          </p>
          <Button onClick={() => router.push('/board')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Board
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={area.name}>
      <div className="min-h-screen">
        {/* Hero Header */}
        <div className={cn('relative overflow-hidden bg-gradient-to-br', gradient)}>
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

          <div className="relative container max-w-5xl px-4 py-8 md:py-12">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6 text-white/70">
              <button
                onClick={() => router.push('/board')}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Projects
              </button>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-white">{area.name}</span>
            </div>

            {/* Area Title */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3">
                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  {areaStats.total} Goal{areaStats.total !== 1 && 's'}
                </Badge>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                  {area.name}
                </h1>
                {area.description && (
                  <p className="text-lg text-white/80 max-w-lg">{area.description}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                  onClick={() => setAddProjectModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Goal
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                  <Target className="h-4 w-4" />
                  Total Goals
                </div>
                <p className="text-2xl font-bold text-white">{areaStats.total}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                  <TrendingUp className="h-4 w-4" />
                  In Progress
                </div>
                <p className="text-2xl font-bold text-white">{areaStats.inProgress}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Completed
                </div>
                <p className="text-2xl font-bold text-white">{areaStats.completed}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                  <TrendingUp className="h-4 w-4" />
                  Overall Progress
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-white">{areaStats.overallPercentage}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container max-w-5xl px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar - Pending Tasks & Reviews */}
            <div className="lg:col-span-1 space-y-6">
              {/* Pending Tasks */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ListTodo className="h-5 w-5 text-orange-500" />
                    Next Actions
                    {areaStats.pendingTasks.length > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {areaStats.pendingTasks.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {areaStats.pendingTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No pending tasks in this area
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {areaStats.pendingTasks.map(({ task, project }) => (
                        <div
                          key={task.id}
                          className="group flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => router.push(`/project/${project.id}`)}
                        >
                          <div className="h-5 w-5 rounded border-2 border-muted-foreground/30 mt-0.5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm leading-tight group-hover:text-primary transition-colors">
                              {task.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{project.name}</p>
                          </div>
                          {task.dueDate && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatDate(task.dueDate, 'MMM d')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reviews Due */}
              {areaStats.reviewsDue > 0 && (
                <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-400">
                      <Clock className="h-5 w-5" />
                      Reviews Due
                      <Badge className="ml-auto bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                        {areaStats.reviewsDue}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {areaProjects
                        .filter((p) => isReviewDue(p, cadences))
                        .slice(0, 3)
                        .map((project) => (
                          <button
                            key={project.id}
                            onClick={() => router.push(`/project/${project.id}`)}
                            className="w-full text-left p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-amber-950/30 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
                          >
                            <p className="font-medium text-sm">{project.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {project.lastReviewDate
                                ? `Last reviewed ${formatDate(project.lastReviewDate, 'MMM d')}`
                                : 'Never reviewed'}
                            </p>
                          </button>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Main - Project Cards */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">Goals in {area.name}</h2>
              </div>

              {areaProjects.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="font-medium mb-2">No goals yet</h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Start tracking your {area.name.toLowerCase()} goals
                    </p>
                    <Button onClick={() => setAddProjectModalOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Goal
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Accordion
                  type="multiple"
                  defaultValue={areaProjects.map((p) => p.id)}
                  className="space-y-4"
                >
                  {areaProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      doneTaskStatusIds={doneTaskStatusIds}
                      onNavigate={() => router.push(`/project/${project.id}`)}
                      onAddTask={() => openAddTaskModal(project.id)}
                    />
                  ))}
                </Accordion>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// Project Card Component
function ProjectCard({
  project,
  doneTaskStatusIds,
  onNavigate,
  onAddTask,
}: {
  project: Project;
  doneTaskStatusIds: string[];
  onNavigate: () => void;
  onAddTask: () => void;
}) {
  const { currentWorkspace } = useAuthStore();
  const { getStatusById, getPriorityById, getTaskStatusesForWorkspace } = useConfigStore();

  const status = currentWorkspace ? getStatusById(currentWorkspace.id, project.statusId) : null;
  const priority = currentWorkspace
    ? getPriorityById(currentWorkspace.id, project.priorityId)
    : null;
  const taskStatuses = currentWorkspace ? getTaskStatusesForWorkspace(currentWorkspace.id) : [];
  const nextActionStatusId = taskStatuses.find((s) => s.name === 'Next Action')?.id || 'task-next';

  const progress = calculateProjectProgress(project, doneTaskStatusIds);
  const daysUntil = getDaysUntilDeadline(project.targetDate);
  const urgency = getDeadlineUrgency(project.targetDate);

  const statusColors = status
    ? getColorClasses(status.color)
    : { bg: 'bg-slate-100', text: 'text-slate-700' };
  const priorityColors = priority
    ? getColorClasses(priority.color)
    : { bg: 'bg-slate-50', text: 'text-slate-600' };

  const tasks = project.tasks ?? [];
  const reviewNotes = project.reviewNotes ?? [];
  const nextActions = tasks.filter((t) => t.statusId === nextActionStatusId);
  const latestReview = reviewNotes[reviewNotes.length - 1];

  return (
    <AccordionItem value={project.id} className="border rounded-xl bg-card overflow-hidden">
      <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/50 [&[data-state=open]]:border-b">
        <div className="flex items-start gap-4 w-full text-left">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className={cn(statusColors.bg, statusColors.text, 'text-xs')}>
                {status?.name || 'Unknown'}
              </Badge>
              <Badge className={cn(priorityColors.bg, priorityColors.text, 'text-xs')}>
                {priority?.name || 'Unknown'}
              </Badge>
              {urgency === 'critical' && (
                <Badge variant="destructive" className="text-xs">
                  Due in {daysUntil} days
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg">{project.name}</h3>
            <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
              <RichTextContent>{project.objective}</RichTextContent>
            </div>
          </div>

          {/* Progress Circle */}
          <div className="shrink-0 text-center">
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${(progress.percentage / 100) * 150.8} 150.8`}
                  className="text-primary"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                {progress.percentage}%
              </span>
            </div>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-5 pb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {/* Objective & Success Metric */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                <Target className="h-3 w-3" />
                Objective
              </h4>
              <div className="text-sm">
                <RichTextContent>{project.objective}</RichTextContent>
              </div>
            </div>
            {project.successMetric && (
              <div className="bg-muted/50 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Success Metric
                </h4>
                <div className="text-sm">
                  <RichTextContent>{project.successMetric}</RichTextContent>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Target: {formatDate(project.targetDate, 'MMM d, yyyy')}
              </div>
            </div>
          </div>

          {/* Tasks & Review */}
          <div className="space-y-4">
            {/* Next Actions */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                <ListTodo className="h-3 w-3" />
                Next Actions ({nextActions.length})
              </h4>
              {nextActions.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No pending tasks</p>
              ) : (
                <ul className="space-y-1">
                  {nextActions.slice(0, 3).map((task) => (
                    <li key={task.id} className="text-sm flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      {task.title}
                    </li>
                  ))}
                  {nextActions.length > 3 && (
                    <li className="text-xs text-muted-foreground">
                      +{nextActions.length - 3} more
                    </li>
                  )}
                </ul>
              )}
            </div>

            {/* Latest Review */}
            {latestReview && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Latest Review
                </h4>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    {formatDate(latestReview.date, 'MMM d, yyyy')}
                  </p>
                  <div className="text-sm line-clamp-2">
                    <RichTextContent>{latestReview.notes || ''}</RichTextContent>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={onAddTask}>
            <Plus className="mr-1 h-4 w-4" />
            Add Task
          </Button>
          <Button size="sm" onClick={onNavigate}>
            View Details
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
