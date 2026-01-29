'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Users,
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Kanban,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { AiInsightsPanel } from '@/components/ai/ai-insights-panel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { useWorkspaceMembers } from '@/hooks/use-workspace-members';
import { useProjects } from '@/hooks/use-projects';
import { useConfigStore } from '@/store/config-store';
import { cn } from '@/lib/utils';
import type { Task } from '@goals/shared';

export default function FamilyHubPage() {
  const { currentWorkspace } = useAuthStore();
  const { setAddProjectModalOpen } = useUIStore();
  const { getStatusById, getTaskStatusesForWorkspace } = useConfigStore();
  const { data: members = [] } = useWorkspaceMembers(currentWorkspace?.id);
  const { data: projects = [] } = useProjects();

  const workspaceId = currentWorkspace?.id || '';

  // Flatten all tasks from projects
  const allTasks = useMemo(() => {
    return projects.flatMap((p) => p.tasks || []);
  }, [projects]);

  const doneTaskStatusIds = useMemo(() => {
    if (!workspaceId) return new Set<string>();
    const statuses = getTaskStatusesForWorkspace(workspaceId);
    return new Set(
      statuses
        .filter((status) => {
          const name = status.name?.toLowerCase();
          return name === 'done' || name === 'completed';
        })
        .map((status) => status.id)
    );
  }, [getTaskStatusesForWorkspace, workspaceId]);

  // Get active (non-archived) projects
  const activeProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const status = getStatusById(workspaceId, p.statusId);
        return status?.name?.toLowerCase() !== 'archived';
      })
      .slice(0, 6);
  }, [projects, getStatusById, workspaceId]);

  // Get upcoming tasks (due soon, not completed)
  const upcomingTasks = useMemo(
    () =>
      allTasks
        .filter((t: Task) => !doneTaskStatusIds.has(t.statusId) && t.dueDate)
        .sort((a: Task, b: Task) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
        .slice(0, 5),
    [allTasks, doneTaskStatusIds]
  );

  // Calculate stats per member
  const memberStats = useMemo(() => {
    return members.map((member) => {
      const memberProjects = projects.filter((p) => p.ownerId === member.userId);
      const memberTasks = allTasks.filter((t: Task) => t.assignedToId === member.userId);
      const completedTasks = memberTasks.filter((t: Task) =>
        doneTaskStatusIds.has(t.statusId)
      ).length;
      return {
        ...member,
        projectCount: memberProjects.length,
        taskCount: memberTasks.length,
        completedTasks,
      };
    });
  }, [members, projects, allTasks, doneTaskStatusIds]);

  // Overall family progress
  const familyProgress = useMemo(() => {
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t: Task) => doneTaskStatusIds.has(t.statusId)).length;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }, [allTasks, doneTaskStatusIds]);

  const completedTasksCount = useMemo(
    () => allTasks.filter((t: Task) => doneTaskStatusIds.has(t.statusId)).length,
    [allTasks, doneTaskStatusIds]
  );

  const getMemberInfo = (userId: string) => {
    return members.find((m) => m.userId === userId);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AppLayout title="Family Hub">
      <div className="container mx-auto max-w-6xl px-4 py-6 pb-24 md:pb-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{currentWorkspace?.name || 'Family'} Hub</h1>
              <p className="text-sm text-muted-foreground">
                {members.length} member{members.length !== 1 ? 's' : ''} working together
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{members.length}</p>
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeProjects.length}</p>
                  <p className="text-xs text-muted-foreground">Active Goals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedTasksCount}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                  <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allTasks.length - completedTasksCount}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Family Members */}
          <div className="md:col-span-1 space-y-6">
            {/* Family Progress */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Family Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Overall completion</span>
                    <span className="font-medium">{familyProgress}%</span>
                  </div>
                  <Progress value={familyProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Family Members */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Family Members</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {memberStats.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.projectCount} goals, {member.completedTasks}/{member.taskCount}{' '}
                        tasks
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Goals */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Family Goals</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setAddProjectModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeProjects.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No family goals yet</p>
                    <p className="text-xs">Create your first shared goal</p>
                  </div>
                ) : (
                  activeProjects.map((project) => {
                    const owner = getMemberInfo(project.ownerId || '');
                    const projectTasks = project.tasks || [];
                    const completedCount = projectTasks.filter((t: Task) =>
                      doneTaskStatusIds.has(t.statusId)
                    ).length;
                    const progress =
                      projectTasks.length > 0
                        ? Math.round((completedCount / projectTasks.length) * 100)
                        : 0;

                    return (
                      <Link
                        key={project.id}
                        href={`/project/${project.id}`}
                        className="block p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium text-sm line-clamp-1">{project.name}</h4>
                          {owner && (
                            <Avatar className="h-5 w-5 flex-shrink-0">
                              <AvatarImage src={owner.avatar || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {getInitials(owner.name)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground">{progress}%</span>
                        </div>
                      </Link>
                    );
                  })
                )}

                {activeProjects.length > 0 && (
                  <Link href="/projects">
                    <Button variant="ghost" size="sm" className="w-full mt-2">
                      View all goals
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tasks */}
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Upcoming Tasks</CardTitle>
                <Link href="/board">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Kanban className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcomingTasks.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No upcoming tasks</p>
                    <p className="text-xs">All caught up!</p>
                  </div>
                ) : (
                  upcomingTasks.map((task: Task) => {
                    const assignee = getMemberInfo(task.assignedToId || '');
                    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                    const isOverdue = dueDate && dueDate < new Date();

                    return (
                      <Link
                        key={task.id}
                        href={`/project/${task.projectId}/task/${task.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div
                          className={cn(
                            'h-2 w-2 rounded-full flex-shrink-0',
                            isOverdue ? 'bg-red-500' : 'bg-primary'
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          {dueDate && (
                            <p
                              className={cn(
                                'text-xs',
                                isOverdue ? 'text-red-500' : 'text-muted-foreground'
                              )}
                            >
                              <Calendar className="inline h-3 w-3 mr-1" />
                              {format(dueDate, 'MMM d')}
                            </p>
                          )}
                        </div>
                        {assignee && (
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarImage src={assignee.avatar || undefined} />
                            <AvatarFallback className="text-[10px]">
                              {getInitials(assignee.name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </Link>
                    );
                  })
                )}

                {upcomingTasks.length > 0 && (
                  <Link href="/board">
                    <Button variant="ghost" size="sm" className="w-full mt-2">
                      View board
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setAddProjectModalOpen(true)}
                >
                  <Target className="mr-2 h-4 w-4" />
                  New Goal
                </Button>
                <Link href="/board">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Kanban className="mr-2 h-4 w-4" />
                    Board
                  </Button>
                </Link>
                <Link href="/calendar">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" />
                    Calendar
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Members
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Insights */}
        <div className="mt-6">
          <AiInsightsPanel />
        </div>
      </div>
    </AppLayout>
  );
}
