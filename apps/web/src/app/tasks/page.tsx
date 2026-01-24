'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, isBefore, isToday, startOfDay } from 'date-fns';
import { Check, Clock, ListChecks, Loader2, Search, X } from 'lucide-react';

import { AppLayout } from '@/components/layout/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useTasks } from '@/hooks/use-tasks';
import { useProjects } from '@/hooks/use-projects';
import { useUpdateTaskStatus } from '@/hooks/use-projects';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { useConfigStore } from '@/store/config-store';
import { TaskWithProject } from '@/types';
import { cn, truncate } from '@/lib/utils';
import { getColorClasses } from '@/types/config';

type DueBucket = 'Overdue' | 'Today' | 'Upcoming' | 'No date';

const bucketTask = (task: TaskWithProject): DueBucket => {
  const due = task.dueDate ? new Date(task.dueDate) : null;
  if (!due) return 'No date';
  const todayStart = startOfDay(new Date());
  if (isToday(due)) return 'Today';
  if (isBefore(due, todayStart)) return 'Overdue';
  return 'Upcoming';
};

const formatDue = (task: TaskWithProject): string => {
  const due = task.dueDate ? new Date(task.dueDate) : null;
  if (!due) return 'No due date';
  if (isToday(due)) return 'Due today';
  if (isBefore(due, startOfDay(new Date()))) return 'Overdue';
  return `Due ${format(due, 'EEE, MMM d')}`;
};

export default function TasksPage() {
  const router = useRouter();
  const { data: tasks, isLoading } = useTasks();
  const { data: projects = [] } = useProjects();
  const updateStatus = useUpdateTaskStatus();
  const { currentWorkspace } = useAuthStore();
  const { initializeConfig, getTaskStatusById, getTaskStatusesForWorkspace } = useConfigStore();
  const { openAddTaskModal } = useUIStore();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dueFilter, setDueFilter] = useState<DueBucket | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    if (currentWorkspace) {
      initializeConfig(currentWorkspace.id);
    }
  }, [currentWorkspace, initializeConfig]);

  const getDoneStatusId = (workspaceId?: string) => {
    if (!workspaceId) return 'task-done';
    const statuses = getTaskStatusesForWorkspace(workspaceId);
    return statuses.find((s) => s.name === 'Done')?.id || 'task-done';
  };

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((task) => {
      if (statusFilter !== 'all' && task.statusId !== statusFilter) return false;

      if (dueFilter !== 'all') {
        const bucket = bucketTask(task);
        if (bucket !== dueFilter) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const projectName = task.project?.name?.toLowerCase() || '';
        if (!task.title.toLowerCase().includes(q) && !projectName.includes(q)) return false;
      }

      return true;
    });
  }, [tasks, statusFilter, dueFilter, search]);

  const grouped = useMemo(() => {
    const groups: Record<DueBucket, TaskWithProject[]> = {
      Overdue: [],
      Today: [],
      Upcoming: [],
      'No date': [],
    };
    filteredTasks.forEach((t) => {
      groups[bucketTask(t)].push(t);
    });
    return groups;
  }, [filteredTasks]);

  const handleMarkDone = async (task: TaskWithProject) => {
    const workspaceId = task.project?.workspaceId;
    const doneId = getDoneStatusId(workspaceId);
    if (!task.project?.id) return;
    await updateStatus.mutateAsync({
      projectId: task.project.id,
      taskId: task.id,
      statusId: doneId,
    });
  };

  const renderStatusBadge = (task: TaskWithProject) => {
    const wsId = task.project?.workspaceId;
    const status = wsId ? getTaskStatusById(wsId, task.statusId) : undefined;
    const colors = status
      ? getColorClasses(status.color)
      : { bg: 'bg-slate-100', text: 'text-slate-700' };
    return <Badge className={cn(colors.bg, colors.text)}>{status?.name || 'Status'}</Badge>;
  };

  useEffect(() => {
    if (projects.length === 0) {
      if (selectedProjectId) setSelectedProjectId('');
      return;
    }

    const exists = projects.some((p) => p.id === selectedProjectId);
    if (!selectedProjectId || !exists) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const metrics = useMemo(() => {
    const total = tasks?.length ?? 0;
    const overdue = tasks?.filter((t) => bucketTask(t) === 'Overdue').length ?? 0;
    const today = tasks?.filter((t) => bucketTask(t) === 'Today').length ?? 0;
    const nextActionId = currentWorkspace
      ? getTaskStatusesForWorkspace(currentWorkspace.id).find((s) => s.name === 'Next Action')
          ?.id || 'task-next'
      : 'task-next';
    const nextActions = tasks?.filter((t) => t.statusId === nextActionId).length ?? 0;
    return { total, overdue, today, nextActions };
  }, [tasks, currentWorkspace, getTaskStatusesForWorkspace]);

  return (
    <AppLayout title="My Tasks">
      <div className="container max-w-5xl px-4 py-6 md:py-8 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">My Tasks</h1>
            <p className="text-muted-foreground">All tasks across your goals and workspaces.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/board')}>
              Go to Board
            </Button>
            <select
              className="min-w-[200px] rounded-md border bg-background px-3 py-2 text-sm"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={projects.length === 0}
            >
              {projects.length === 0 ? (
                <option value="">No goals available</option>
              ) : (
                projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))
              )}
            </select>
            <Button
              onClick={() => selectedProjectId && openAddTaskModal(selectedProjectId)}
              disabled={!selectedProjectId}
            >
              Add Task
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total', value: metrics.total },
            { label: 'Overdue', value: metrics.overdue },
            { label: 'Today', value: metrics.today },
            { label: 'Next Actions', value: metrics.nextActions },
          ].map((m) => (
            <Card key={m.label}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                  <p className="text-2xl font-semibold">{m.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="space-y-3">
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Task Manager
            </CardTitle>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative w-full md:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tasks or projects"
                    className="pl-9"
                  />
                  {search && (
                    <button
                      className="absolute right-3 top-2.5 text-muted-foreground"
                      onClick={() => setSearch('')}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <select
                  className="w-[150px] rounded-md border bg-background px-3 py-2 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  {currentWorkspace &&
                    getTaskStatusesForWorkspace(currentWorkspace.id).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
                <select
                  className="w-[140px] rounded-md border bg-background px-3 py-2 text-sm"
                  value={dueFilter}
                  onChange={(e) => setDueFilter(e.target.value as DueBucket | 'all')}
                >
                  <option value="all">All dates</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Today">Today</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="No date">No date</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                <Clock className="h-6 w-6" />
                <p>No tasks match these filters.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {(Object.keys(grouped) as DueBucket[]).map((bucket) => {
                  const items = grouped[bucket];
                  if (items.length === 0) return null;
                  return (
                    <div key={bucket} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold uppercase text-muted-foreground">
                          {bucket}
                        </h3>
                        <span className="text-xs text-muted-foreground">({items.length})</span>
                      </div>
                      <div className="space-y-2">
                        {items.map((task) => (
                          <div
                            key={task.id}
                            className={cn(
                              'flex items-start gap-3 rounded-xl border bg-card p-3 shadow-sm transition-colors',
                              task.project?.id && 'cursor-pointer hover:bg-accent/40'
                            )}
                            onClick={() => {
                              if (task.project?.id && task.id) {
                                router.push(`/project/${task.project.id}/task/${task.id}`);
                              }
                            }}
                          >
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium leading-tight">
                                  {truncate(task.title, 80)}
                                </p>
                                {renderStatusBadge(task)}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span>{task.project?.name || 'Unknown project'}</span>
                                <span>•</span>
                                <span>{formatDue(task)}</span>
                                {currentWorkspace?.name && (
                                  <Badge variant="outline" className="text-xs">
                                    {currentWorkspace.name}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {task.statusId !== getDoneStatusId(task.project?.workspaceId) && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleMarkDone(task);
                                }}
                                disabled={updateStatus.isPending}
                                aria-label="Mark done"
                              >
                                {updateStatus.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
