'use client';

import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { DependencyGraph } from '@/components/shared/dependency-graph';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useProjects } from '@/hooks/use-projects';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  GitBranch,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Bell,
  ChevronRight,
  AlertTriangle,
  History,
  Send,
} from 'lucide-react';

export default function DependenciesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showDebug = searchParams.get('debug') === '1';
  const { data: projects, isLoading } = useProjects();
  const { currentWorkspace } = useAuthStore();
  const { getStatusById, getPriorityById } = useConfigStore();
  const { toast } = useToast();
  const [autoSurface, setAutoSurface] = useState(true);

  // Get blocked projects (those with active blockers)
  const blockedProjects = useMemo(() => {
    if (!projects || !currentWorkspace) return [];

    return projects
      .filter((p) => {
        if (!p.blockedBy || p.blockedBy.length === 0) return false;
        // Check if any blocker is still active (not completed)
        return p.blockedBy.some((dep) => {
          if (!dep.blocker) return true;
          const status = getStatusById(currentWorkspace.id, dep.blocker.statusId);
          return status?.type !== 'completed';
        });
      })
      .map((p) => {
        const activeBlockers = p.blockedBy?.filter((dep) => {
          if (!dep.blocker) return true;
          const status = getStatusById(currentWorkspace.id, dep.blocker.statusId);
          return status?.type !== 'completed';
        });
        return { ...p, activeBlockers };
      });
  }, [projects, currentWorkspace, getStatusById]);

  // Calculate dependency stats
  const stats = useMemo(() => {
    if (!projects) {
      return { totalProjects: 0, blockedProjects: 0, blockingProjects: 0, totalDependencies: 0 };
    }
    return {
      totalProjects: projects.length,
      blockedProjects: blockedProjects.length,
      blockingProjects: projects.filter((p) => p.blocking && p.blocking.length > 0).length,
      totalDependencies: projects.reduce((acc, p) => acc + (p.blockedBy?.length || 0), 0),
    };
  }, [projects, blockedProjects]);

  if (isLoading) {
    return (
      <AppLayout title="Dependencies">
        <div className="flex h-full flex-col">
          <div className="border-b px-4 py-3">
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="flex-1 p-4">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dependencies">
      <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] bg-background">
        {/* Main Graph Area */}
        <div className="relative flex-1 overflow-hidden">
          {/* Atmospheric background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.18),transparent_45%),radial-gradient(circle_at_80%_0%,hsl(var(--primary)/0.12),transparent_40%)]" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundSize: '40px 40px',
              backgroundImage:
                'linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)',
            }}
          />

          {/* Overlay controls */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 pt-4 md:px-6 md:pt-6">
            <div className="flex flex-col gap-4">
              {/* Breadcrumbs */}
              <div className="pointer-events-auto flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{currentWorkspace?.name || 'Workspace'}</span>
                <ChevronRight className="h-4 w-4" />
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <GitBranch className="h-4 w-4 text-primary" />
                  Dependency Graph
                </span>
              </div>

              {/* Title + Toolbar */}
              <div className="pointer-events-auto flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="text-xl font-semibold md:text-2xl">Dependency Graph</h1>
                  <p className="text-sm text-muted-foreground">
                    Visualize how your goals depend on each other
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-xl border bg-card/90 p-1 shadow-lg backdrop-blur">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Zoom In">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Zoom Out">
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <div className="mx-1 h-4 w-px bg-border" />
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Fit to Screen">
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 bg-card/90">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="pointer-events-auto grid grid-cols-2 gap-3 md:grid-cols-4">
                <Card className="border-border/60 bg-card/90 shadow-lg">
                  <CardContent className="flex items-center gap-3 p-3">
                    <GitBranch className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-lg font-semibold leading-none">
                        {stats.totalDependencies}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Dependencies</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/60 bg-card/90 shadow-lg">
                  <CardContent className="flex items-center gap-3 p-3">
                    <Lock className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-lg font-semibold leading-none">{stats.blockedProjects}</p>
                      <p className="text-xs text-muted-foreground">Blocked Goals</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/60 bg-card/90 shadow-lg">
                  <CardContent className="flex items-center gap-3 p-3">
                    <Unlock className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-lg font-semibold leading-none">{stats.blockingProjects}</p>
                      <p className="text-xs text-muted-foreground">Blocking Goals</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/60 bg-card/90 shadow-lg">
                  <CardContent className="flex items-center gap-3 p-3">
                    <GitBranch className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-lg font-semibold leading-none">{stats.totalProjects}</p>
                      <p className="text-xs text-muted-foreground">Total Goals</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {showDebug && (
            <div className="pointer-events-auto absolute right-4 top-24 z-30 w-[320px] rounded-xl border bg-card/95 p-3 text-xs shadow-xl backdrop-blur md:right-6">
              <div className="mb-2 font-semibold text-foreground">Graph Debug</div>
              <div className="space-y-1 text-muted-foreground">
                <div>Total projects: {projects?.length ?? 0}</div>
                <div>
                  With blockedBy:{' '}
                  {projects?.filter((p) => (p.blockedBy?.length ?? 0) > 0).length ?? 0}
                </div>
                <div>
                  With blocking:{' '}
                  {projects?.filter((p) => (p.blocking?.length ?? 0) > 0).length ?? 0}
                </div>
              </div>
              <div className="mt-3 max-h-40 overflow-auto rounded-md border border-border/60 bg-background/40 p-2">
                {(projects ?? [])
                  .filter((p) => (p.blockedBy?.length ?? 0) > 0)
                  .slice(0, 6)
                  .map((p) => (
                    <div key={p.id} className="mb-2 last:mb-0">
                      <div className="font-medium text-foreground">{p.name}</div>
                      <div className="text-muted-foreground">
                        blockedBy:{' '}
                        {p.blockedBy?.map((d) => d.blockerId || d.blocker?.id).join(', ') || '—'}
                      </div>
                    </div>
                  ))}
                {(projects ?? []).filter((p) => (p.blockedBy?.length ?? 0) > 0).length === 0 && (
                  <div className="text-muted-foreground">No blockedBy data in project list.</div>
                )}
              </div>
            </div>
          )}

          {/* Graph */}
          <div className="absolute inset-0 z-10">
            <DependencyGraph projects={projects || []} className="h-full" debug={showDebug} />
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-20 rounded-xl border bg-card/95 p-4 shadow-xl backdrop-blur">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Graph Legend
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                <span className="text-sm">Active / In Progress</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full border border-orange-500 bg-orange-500/20" />
                <span className="text-sm text-muted-foreground">Blocked</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">Completed</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/60" />
                <span className="text-sm text-muted-foreground">Future / Pending</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Active Blockers */}
        <aside className="hidden w-80 flex-col border-l bg-card lg:flex">
          <div className="border-b p-5">
            <h3 className="flex items-center gap-2 font-semibold">
              <Lock className="h-4 w-4 text-orange-500" />
              Active Blockers
              {blockedProjects.length > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {blockedProjects.length}
                </Badge>
              )}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Goals preventing progress on other goals
            </p>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-3 p-4">
              {/* Auto-surface Toggle */}
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Auto-surface</span>
                  <span className="text-[10px] text-muted-foreground">Notify when unblocked</span>
                </div>
                <Switch checked={autoSurface} onCheckedChange={setAutoSurface} />
              </div>

              {blockedProjects.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
                  <Unlock className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p className="text-sm font-medium">No active blockers</p>
                  <p className="mt-1 text-xs">All your goals are unblocked!</p>
                </div>
              ) : (
                blockedProjects.map((project) => {
                  // Get priority for visual indication
                  const priority = currentWorkspace
                    ? getPriorityById(currentWorkspace.id, project.priorityId)
                    : null;
                  const priorityColors: Record<string, string> = {
                    red: 'bg-red-500/10 text-red-500',
                    amber: 'bg-amber-500/10 text-amber-500',
                    slate: 'bg-slate-500/10 text-slate-400',
                  };
                  const priorityColor =
                    priorityColors[priority?.color || 'slate'] || priorityColors.slate;
                  const priorityLabels: Record<number, string> = {
                    1: 'Critical',
                    2: 'High',
                    3: 'Medium',
                  };
                  const priorityLabel = priorityLabels[priority?.level || 3] || 'Medium';

                  return (
                    <Card
                      key={project.id}
                      className={cn(
                        'cursor-pointer transition-colors',
                        priority?.level === 1
                          ? 'border-red-500/30 hover:border-red-500/60'
                          : 'border-border hover:border-muted-foreground/50'
                      )}
                      onClick={() => router.push(`/project/${project.id}`)}
                    >
                      <CardContent className="p-3">
                        <div className="mb-2 flex items-start justify-between">
                          <Badge
                            variant="secondary"
                            className={cn('text-[10px] font-bold uppercase', priorityColor)}
                          >
                            {priorityLabel}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast({
                                title: 'Notifications enabled',
                                description: `You'll be notified when "${project.name}" is unblocked`,
                              });
                            }}
                          >
                            <Bell className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <h4 className="text-sm font-medium leading-tight transition-colors hover:text-primary">
                          {project.name}
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Blocked by:{' '}
                          <span className="text-foreground">
                            {project.activeBlockers?.map((b) => b.blocker?.name).join(', ') ||
                              'Unknown'}
                          </span>
                        </p>
                        <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                          <div className="flex items-center gap-1 text-xs text-orange-500">
                            <AlertTriangle className="h-3 w-3" />
                            {project.activeBlockers?.length || 0} blocker
                            {(project.activeBlockers?.length || 0) !== 1 ? 's' : ''}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto gap-1 p-0 text-xs text-primary hover:text-primary/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast({
                                title: 'Reminder sent',
                                description: 'A ping has been sent to the assignee',
                              });
                            }}
                          >
                            <Send className="h-3 w-3" />
                            Ping
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>

          <div className="space-y-2 border-t bg-muted/30 p-4">
            <Button variant="outline" className="w-full gap-2">
              <History className="h-4 w-4" />
              View Blocker History
            </Button>
          </div>
        </aside>
      </div>
    </AppLayout>
  );
}
