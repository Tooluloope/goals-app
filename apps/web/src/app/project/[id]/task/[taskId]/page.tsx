'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EditTaskModal } from '@/components/shared/edit-task-modal';
import { useTask, useUpdateTaskStatus, useUpdateTask, useDeleteTask } from '@/hooks/use-tasks';
import { useProject } from '@/hooks/use-projects';
import { useAddTaskBlocker, useRemoveTaskBlocker } from '@/hooks/use-dependencies';
import { useWorkspaceMembers } from '@/hooks/use-workspace-members';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate, cn } from '@/lib/utils';
import { getColorClasses } from '@/types/config';
import {
  ArrowLeft,
  MoreHorizontal,
  Trash2,
  Edit,
  Lock,
  Key,
  Calendar,
  Folder,
  ChevronRight,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
  X,
  AlertTriangle,
  Tag,
  Plus,
  Flame,
  User,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const taskId = params.taskId as string;

  const { data: task, isLoading: taskLoading } = useTask(taskId);
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const updateStatus = useUpdateTaskStatus();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const addBlocker = useAddTaskBlocker();
  const removeBlocker = useRemoveTaskBlocker();
  const { toast } = useToast();

  const { currentWorkspace, user } = useAuthStore();
  const { getTaskStatusesForWorkspace, getTaskStatusById, getPriorityById } = useConfigStore();
  const { data: workspaceMembers = [] } = useWorkspaceMembers(currentWorkspace?.id);
  const hasMultipleMembers = workspaceMembers.length > 1;

  const [searchQuery, setSearchQuery] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Get priority from parent project
  const priority =
    project && currentWorkspace ? getPriorityById(currentWorkspace.id, project.priorityId) : null;

  const taskStatuses = currentWorkspace ? getTaskStatusesForWorkspace(currentWorkspace.id) : [];
  const currentStatus =
    task && currentWorkspace ? getTaskStatusById(currentWorkspace.id, task.statusId) : null;

  // Check if task is blocked
  const isBlocked = useMemo(() => {
    if (!task?.blockedBy || task.blockedBy.length === 0) return false;
    return task.blockedBy.some((dep) => {
      if (!dep.blocker) return true;
      const status = currentWorkspace
        ? getTaskStatusById(currentWorkspace.id, dep.blocker.statusId)
        : null;
      return status?.type !== 'completed';
    });
  }, [task, currentWorkspace, getTaskStatusById]);

  // Get other tasks from the same project that can be blockers
  const availableBlockers = useMemo(() => {
    if (!project?.tasks || !task) return [];
    const currentBlockerIds = task.blockedBy?.map((d) => d.blockerId) || [];
    return project.tasks.filter((t) => t.id !== task.id && !currentBlockerIds.includes(t.id));
  }, [project, task]);

  // Filter available blockers by search
  const filteredBlockers = useMemo(() => {
    if (!searchQuery) return availableBlockers.slice(0, 5);
    return availableBlockers
      .filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 10);
  }, [availableBlockers, searchQuery]);

  const handleStatusChange = async (newStatusId: string) => {
    if (!task) return;
    try {
      await updateStatus.mutateAsync({ id: task.id, statusId: newStatusId });
      toast({
        title: 'Status updated',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleAssigneeChange = async (newAssigneeId: string) => {
    if (!task) return;
    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: { assignedToId: newAssigneeId === 'unassigned' ? null : newAssigneeId },
      });
      toast({
        title: 'Assignee updated',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update assignee',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask.mutateAsync(task.id);
        toast({
          title: 'Task deleted',
          variant: 'success',
        });
        router.push(`/project/${projectId}`);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete task',
          variant: 'destructive',
        });
      }
    }
  };

  const handleAddBlocker = async (blockerId: string) => {
    if (!task) return;
    try {
      await addBlocker.mutateAsync({ taskId: task.id, blockerId });
      toast({
        title: 'Blocker added',
        variant: 'success',
      });
      setSearchQuery('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add blocker',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveBlocker = async (blockerId: string) => {
    if (!task) return;
    try {
      await removeBlocker.mutateAsync({ taskId: task.id, blockerId });
      toast({
        title: 'Blocker removed',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove blocker',
        variant: 'destructive',
      });
    }
  };

  if (taskLoading || projectLoading) {
    return (
      <AppLayout title="Task">
        <div className="container max-w-6xl px-4 py-6">
          <Skeleton className="mb-4 h-8 w-32" />
          <Skeleton className="mb-6 h-12 w-3/4" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!task || !project) {
    return (
      <AppLayout title="Task Not Found">
        <div className="container max-w-6xl px-4 py-6 text-center">
          <p className="text-muted-foreground">Task not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={task.title}>
      <div className="relative min-h-[calc(100vh-8rem)] bg-background md:min-h-[calc(100vh-4rem)]">
        <div className="border-b bg-card/80 backdrop-blur">
          <div className="container max-w-6xl px-4 py-6">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Button variant="ghost" size="sm" className="-ml-2" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Separator orientation="vertical" className="h-4" />
              <span>{project.name}</span>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-foreground">Task Detail</span>
            </div>

            <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    #{task.id.slice(-8)}
                  </Badge>
                  {priority && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs font-medium',
                        priority.color === 'red' && 'bg-red-500/10 text-red-500',
                        priority.color === 'amber' && 'bg-amber-500/10 text-amber-500',
                        priority.color === 'slate' && 'bg-slate-500/10 text-slate-400'
                      )}
                    >
                      {priority.level === 1 ? 'High Priority' : priority.name}
                    </Badge>
                  )}
                  {currentStatus && (
                    <Badge variant="secondary" className="text-xs">
                      {currentStatus.name}
                    </Badge>
                  )}
                  {task.isRecurring && (
                    <Badge variant="secondary" className="text-xs">
                      Recurring
                    </Badge>
                  )}
                </div>
                <h1 className="mt-3 text-2xl font-semibold leading-tight md:text-3xl">
                  {task.title}
                </h1>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditModalOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Task
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {isBlocked && (
          <div className="border-b bg-gradient-to-r from-destructive/15 via-background to-background">
            <div className="container max-w-6xl px-4 py-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-destructive/20 p-3 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-destructive">Status: Blocked</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      This task is waiting on upstream dependencies. Resolve the blockers below to
                      unlock progress.
                    </p>
                  </div>
                </div>
                {task.blockedBy && task.blockedBy.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const firstBlocker = task.blockedBy?.find((d) => d.blocker);
                      if (firstBlocker?.blocker) {
                        router.push(
                          `/project/${firstBlocker.blocker.projectId}/task/${firstBlocker.blocker.id}`
                        );
                      }
                    }}
                  >
                    View Blocker
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="container max-w-6xl px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Main Column */}
            <div className="lg:col-span-8 space-y-8">
              {/* Blocked By */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    Blocked By (Upstream)
                  </h3>
                  {task.blockedBy && task.blockedBy.length > 0 && (
                    <Badge variant="destructive">
                      {
                        task.blockedBy.filter((d) => {
                          const status =
                            d.blocker && currentWorkspace
                              ? getTaskStatusById(currentWorkspace.id, d.blocker.statusId)
                              : null;
                          return status?.type !== 'completed';
                        }).length
                      }{' '}
                      Active
                    </Badge>
                  )}
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks to link as a blocker..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && filteredBlockers.length > 0 && (
                    <Card className="absolute top-full left-0 right-0 mt-1 z-20">
                      <ScrollArea className="max-h-60">
                        {filteredBlockers.map((t) => {
                          const status = currentWorkspace
                            ? getTaskStatusById(currentWorkspace.id, t.statusId)
                            : null;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              className="flex w-full items-center justify-between p-3 min-h-[52px] hover:bg-muted cursor-pointer touch-manipulation text-left transition-colors active:bg-muted"
                              onClick={() => handleAddBlocker(t.id)}
                              onTouchEnd={(e) => {
                                e.preventDefault();
                                handleAddBlocker(t.id);
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                  {status?.type === 'completed' ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{t.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {status?.name || 'Unknown'}
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs text-primary font-medium shrink-0 ml-2">
                                Add
                              </span>
                            </button>
                          );
                        })}
                      </ScrollArea>
                    </Card>
                  )}
                </div>

                <div className="space-y-3">
                  {!task.blockedBy || task.blockedBy.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                      <Lock className="mx-auto mb-2 h-8 w-8 opacity-50" />
                      <p className="text-sm">No blockers</p>
                      <p className="mt-1 text-xs">Search above to add tasks that block this one</p>
                    </div>
                  ) : (
                    task.blockedBy.map((dep) => {
                      const blockerStatus =
                        dep.blocker && currentWorkspace
                          ? getTaskStatusById(currentWorkspace.id, dep.blocker.statusId)
                          : null;
                      const isResolved = blockerStatus?.type === 'completed';

                      return (
                        <Card
                          key={dep.id}
                          className={cn(
                            'transition-colors',
                            isResolved
                              ? 'border-green-500/30 hover:border-green-500/60'
                              : 'border-destructive/30 hover:border-destructive/60'
                          )}
                        >
                          <CardContent className="p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div className="flex items-center gap-4">
                                <div
                                  className={cn(
                                    'h-10 w-10 rounded-full flex items-center justify-center',
                                    isResolved ? 'bg-green-500/20' : 'bg-muted'
                                  )}
                                >
                                  {isResolved ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <Clock className="h-5 w-5 text-amber-500 animate-pulse" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-[10px] font-mono">
                                      #{dep.blocker?.id.slice(-6) || '???'}
                                    </Badge>
                                    <Badge
                                      variant={isResolved ? 'default' : 'secondary'}
                                      className={cn(
                                        'text-[10px]',
                                        isResolved && 'bg-green-500/20 text-green-700'
                                      )}
                                    >
                                      {blockerStatus?.name || 'Unknown'}
                                    </Badge>
                                  </div>
                                  <h4
                                    className={cn(
                                      'font-medium',
                                      isResolved && 'line-through text-muted-foreground'
                                    )}
                                  >
                                    {dep.blocker?.title || 'Unknown Task'}
                                  </h4>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    if (dep.blocker) {
                                      router.push(
                                        `/project/${dep.blocker.projectId}/task/${dep.blocker.id}`
                                      );
                                    }
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleRemoveBlocker(dep.blockerId)}
                                  disabled={removeBlocker.isPending}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </section>

              <Separator />

              {/* Downstream Impact */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Key className="h-5 w-5 text-muted-foreground" />
                    Downstream Impact
                  </h3>
                  {task.blocking && task.blocking.length > 0 && (
                    <Badge variant="outline" className="text-primary border-primary/50">
                      Unlocks {task.blocking.length} Task{task.blocking.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                <div className="relative space-y-3 border-l-2 border-border pl-4">
                  {!task.blocking || task.blocking.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground">
                      <p className="text-sm">No tasks depend on this one</p>
                    </div>
                  ) : (
                    task.blocking.map((dep) => (
                      <Card
                        key={dep.id}
                        className="cursor-pointer border-border/70 transition-colors hover:border-primary/50"
                        onClick={() => {
                          if (dep.dependent) {
                            router.push(
                              `/project/${dep.dependent.projectId}/task/${dep.dependent.id}`
                            );
                          }
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Lock className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">
                                  {dep.dependent?.title || 'Unknown'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  #{dep.dependent?.id.slice(-6) || '???'}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-6">
              <Card className="overflow-hidden">
                <div className="border-b px-5 py-4 flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Details
                  </h4>
                  <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                    Edit
                  </Button>
                </div>
                <CardContent className="p-5 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Status</label>
                    <Select value={task.statusId} onValueChange={handleStatusChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {taskStatuses.map((status) => {
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

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Due Date</label>
                    <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium">
                        {task.dueDate ? formatDate(task.dueDate, 'MMM d, yyyy') : 'No due date'}
                      </span>
                    </div>
                  </div>

                  {/* Assignee - only show for workspaces with multiple members */}
                  {hasMultipleMembers && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Assignee
                      </label>
                      <Select
                        value={task.assignedToId || 'unassigned'}
                        onValueChange={handleAssigneeChange}
                      >
                        <SelectTrigger>
                          <SelectValue>
                            {task.assignedToId ? (
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const member = workspaceMembers.find(
                                    (m) => m.userId === task.assignedToId
                                  );
                                  return member ? (
                                    <>
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage src={member.avatar || undefined} />
                                        <AvatarFallback className="text-xs">
                                          {member.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span>{member.name}</span>
                                    </>
                                  ) : (
                                    'Unknown'
                                  );
                                })()}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>Unassigned</span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>Unassigned</span>
                            </div>
                          </SelectItem>
                          {workspaceMembers.map((member) => (
                            <SelectItem key={member.userId} value={member.userId}>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={member.avatar || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {member.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{member.name}</span>
                                {member.userId === user?.id && (
                                  <span className="text-xs text-muted-foreground">(you)</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Project</label>
                    <div
                      className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => router.push(`/project/${projectId}`)}
                    >
                      <Folder className="h-4 w-4" />
                      <span className="text-sm font-medium">{project.name}</span>
                    </div>
                  </div>

                  {task.isRecurring && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Recurrence
                      </label>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="secondary">
                          {task.recurrenceType === 'daily' && 'Daily'}
                          {task.recurrenceType === 'weekly' && 'Weekly'}
                          {task.recurrenceType === 'monthly' && 'Monthly'}
                          {task.recurrenceType === 'yearly' && 'Yearly'}
                        </Badge>
                        {task.streak > 0 && (
                          <span className="flex items-center gap-1 text-amber-500">
                            <Flame className="h-3.5 w-3.5" />
                            {task.streak} streak
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags Section */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {project.tagIds && project.tagIds.length > 0
                        ? project.tagIds.slice(0, 3).map((tagId) => (
                            <Badge key={tagId} variant="secondary" className="text-xs">
                              {tagId.replace('tag-', '')}
                            </Badge>
                          ))
                        : null}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 gap-1 px-2 text-xs text-muted-foreground"
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Activity
                  </h4>
                  <div className="relative space-y-4 border-l border-border pl-4">
                    {isBlocked && (
                      <div className="relative">
                        <div className="absolute -left-[17px] top-1 h-2.5 w-2.5 rounded-full bg-destructive ring-4 ring-card" />
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Task</span> marked as{' '}
                          <span className="text-destructive">Blocked</span>
                        </p>
                        <span className="text-[10px] text-muted-foreground">Recently</span>
                      </div>
                    )}
                    <div className="relative">
                      <div className="absolute -left-[17px] top-1 h-2.5 w-2.5 rounded-full bg-muted-foreground/60 ring-4 ring-card" />
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Task</span> created
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(task.createdAt, 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      <EditTaskModal task={task} open={editModalOpen} onOpenChange={setEditModalOpen} />
    </AppLayout>
  );
}
