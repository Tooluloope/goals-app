'use client';

import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { DependencyGraph } from '@/components/shared/dependency-graph';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useProjects } from '@/hooks/use-projects';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getColorClasses } from '@/types/config';

export default function DependenciesPage() {
  const router = useRouter();
  const { data: projects, isLoading } = useProjects();
  const { currentWorkspace } = useAuthStore();
  const { getStatusById } = useConfigStore();

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
      <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
        {/* Main Graph Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header with Breadcrumbs */}
          <div className="border-b px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>{currentWorkspace?.name || 'Workspace'}</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium flex items-center gap-1">
                <GitBranch className="h-4 w-4 text-primary" />
                Dependency Graph
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold md:text-xl">Dependency Graph</h1>
                <p className="text-sm text-muted-foreground">
                  Visualize how your goals depend on each other
                </p>
              </div>
              {/* Toolbar */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Zoom In">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Zoom Out">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-4 bg-border mx-1" />
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Fit to Screen">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="border-b px-4 py-3">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xl font-bold">{stats.totalDependencies}</p>
                      <p className="text-xs text-muted-foreground">Total Dependencies</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-xl font-bold">{stats.blockedProjects}</p>
                      <p className="text-xs text-muted-foreground">Blocked Goals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Unlock className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xl font-bold">{stats.blockingProjects}</p>
                      <p className="text-xs text-muted-foreground">Blocking Goals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-xl font-bold">{stats.totalProjects}</p>
                      <p className="text-xs text-muted-foreground">Total Goals</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Graph Container */}
          <div className="flex-1 relative">
            {/* Grid Background Pattern */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundSize: '40px 40px',
                backgroundImage:
                  'linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)',
              }}
            />
            <DependencyGraph projects={projects || []} className="h-full" />

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur border rounded-xl p-4 shadow-lg">
              <div className="text-xs font-semibold text-muted-foreground uppercase mb-3 tracking-wider">
                Graph Legend
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                  <span className="text-sm">Active / In Progress</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full border border-orange-500 bg-orange-500/20" />
                  <span className="text-sm text-muted-foreground">Blocked</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">Completed</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                  <span className="text-sm text-muted-foreground">Future / Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Active Blockers */}
        <aside className="hidden lg:flex w-80 border-l flex-col bg-card">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Lock className="h-4 w-4 text-orange-500" />
              Active Blockers
              {blockedProjects.length > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {blockedProjects.length}
                </Badge>
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Goals preventing progress on other goals
            </p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {blockedProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Unlock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No active blockers</p>
                  <p className="text-xs mt-1">All your goals are unblocked!</p>
                </div>
              ) : (
                blockedProjects.map((project) => (
                  <Card
                    key={project.id}
                    className="cursor-pointer hover:border-orange-500/50 transition-colors border-orange-500/30"
                    onClick={() => router.push(`/project/${project.id}`)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold uppercase text-orange-500 border-orange-500/50"
                        >
                          Blocked
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: notification toggle
                          }}
                        >
                          <Bell className="h-3 w-3" />
                        </Button>
                      </div>
                      <h4 className="font-medium text-sm leading-tight hover:text-primary transition-colors">
                        {project.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Blocked by:{' '}
                        <span className="text-foreground">
                          {project.activeBlockers?.map((b) => b.blocker?.name).join(', ') ||
                            'Unknown'}
                        </span>
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1 text-xs text-orange-500">
                          <AlertTriangle className="h-3 w-3" />
                          {project.activeBlockers?.length || 0} blocker
                          {(project.activeBlockers?.length || 0) !== 1 ? 's' : ''}
                        </div>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (project.activeBlockers?.[0]?.blocker) {
                              router.push(`/project/${project.activeBlockers[0].blocker.id}`);
                            }
                          }}
                        >
                          View Blocker
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <Button variant="outline" className="w-full gap-2">
              <GitBranch className="h-4 w-4" />
              View All Dependencies
            </Button>
          </div>
        </aside>
      </div>
    </AppLayout>
  );
}
