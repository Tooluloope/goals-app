'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { DependencyGraph } from '@/components/shared/dependency-graph';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjects } from '@/hooks/use-projects';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GitBranch, Lock, Unlock } from 'lucide-react';

export default function DependenciesPage() {
  const { data: projects, isLoading } = useProjects();

  // Calculate dependency stats
  const stats = projects
    ? {
        totalProjects: projects.length,
        blockedProjects: projects.filter((p) => p.blockedBy && p.blockedBy.length > 0).length,
        blockingProjects: projects.filter((p) => p.blocking && p.blocking.length > 0).length,
        totalDependencies: projects.reduce((acc, p) => acc + (p.blockedBy?.length || 0), 0),
      }
    : { totalProjects: 0, blockedProjects: 0, blockingProjects: 0, totalDependencies: 0 };

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
      <div className="flex h-[calc(100vh-8rem)] flex-col md:h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="border-b px-4 py-3">
          <h1 className="text-lg font-semibold md:text-xl">Dependency Graph</h1>
          <p className="text-sm text-muted-foreground">
            Visualize how your goals depend on each other
          </p>
        </div>

        {/* Stats */}
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

        {/* Graph */}
        <div className="flex-1 p-4">
          <DependencyGraph projects={projects || []} className="rounded-lg border bg-white" />
        </div>

        {/* Legend */}
        <div className="border-t px-4 py-2">
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-6 bg-orange-500" />
              <span>Active blocker</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-6 bg-green-500" style={{ borderStyle: 'dashed' }} />
              <span>Resolved blocker</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded border-2 border-green-300 bg-green-50" />
              <span>Completed goal</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
