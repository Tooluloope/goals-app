'use client';

import { useParams } from 'next/navigation';
import { Loader2, FileText, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { ProjectHeader } from '@/components/project/project-header';
import { ProjectSections } from '@/components/project/project-sections';
import { Button } from '@/components/ui/button';
import { AddTaskModal } from '@/components/shared/add-task-modal';
import { AddReviewModal } from '@/components/shared/add-review-modal';
import { useProject } from '@/hooks/use-projects';
import { useUIStore } from '@/store/ui-store';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data: project, isLoading, error } = useProject(projectId);
  const { openAddTaskModal, openAddReviewModal } = useUIStore();

  if (isLoading) {
    return (
      <AppLayout showHeader={false}>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (error || !project) {
    return (
      <AppLayout showHeader={false}>
        <div className="flex h-full flex-col items-center justify-center">
          <h2 className="text-xl font-semibold">Goal not found</h2>
          <p className="text-muted-foreground mt-2">
            The goal you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showHeader={false}>
      <div className="min-h-full bg-muted/30">
        {/* Header */}
        <ProjectHeader project={project} />

        {/* Quick Actions Bar (Mobile) */}
        <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
          <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto">
            <Button variant="outline" size="sm" onClick={() => openAddTaskModal(project.id)}>
              <Plus className="mr-1 h-4 w-4" />
              Add Task
            </Button>
            <Button variant="outline" size="sm" onClick={() => openAddReviewModal(project.id)}>
              <FileText className="mr-1 h-4 w-4" />
              Log Review
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="container max-w-4xl px-4 py-6">
          {/* Desktop Quick Actions */}
          <div className="hidden md:flex md:items-center md:gap-2 md:mb-6">
            <Button variant="outline" size="sm" onClick={() => openAddTaskModal(project.id)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
            <Button variant="outline" size="sm" onClick={() => openAddReviewModal(project.id)}>
              <FileText className="mr-2 h-4 w-4" />
              Log Review
            </Button>
          </div>

          {/* Sections */}
          <ProjectSections project={project} />
        </div>
      </div>

      {/* Modals */}
      <AddTaskModal />
      <AddReviewModal />
    </AppLayout>
  );
}
