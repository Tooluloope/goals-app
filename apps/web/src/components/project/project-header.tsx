'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MoreHorizontal,
  Trash2,
  Edit,
  Lock,
  Unlock,
  GitBranch,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Project } from '@/types';
import { getColorClasses } from '@/types/config';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { calculateProjectProgress, formatDate, cn } from '@/lib/utils';
import { triggerCelebration } from '@/lib/confetti';
import { useUpdateProjectStatus, useUpdateProject, useDeleteProject } from '@/hooks/use-projects';
import { useWorkspaceMembers } from '@/hooks/use-workspace-members';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { ManageBlockersModal } from '@/components/shared/manage-blockers-modal';
import { EditProjectModal } from '@/components/shared/edit-project-modal';

interface ProjectHeaderProps {
  project: Project;
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const router = useRouter();
  const updateStatus = useUpdateProjectStatus();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const { toast } = useToast();
  const { currentWorkspace, user } = useAuthStore();
  const { data: workspaceMembers = [] } = useWorkspaceMembers(currentWorkspace?.id);
  const [blockersModalOpen, setBlockersModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const {
    getStatusesForWorkspace,
    getStatusById,
    getAreaById,
    getPriorityById,
    getCadenceById,
    getConfidenceById,
    getTaskStatusesForWorkspace,
  } = useConfigStore();

  const hasMultipleMembers = workspaceMembers.length > 1;

  const statuses = currentWorkspace ? getStatusesForWorkspace(currentWorkspace.id) : [];
  const taskStatuses = currentWorkspace ? getTaskStatusesForWorkspace(currentWorkspace.id) : [];
  const completedTaskStatusIds = taskStatuses.filter((s) => s.name === 'Done').map((s) => s.id);

  const currentStatus = currentWorkspace
    ? getStatusById(currentWorkspace.id, project.statusId)
    : null;
  // Get all areas for the project
  const areas =
    currentWorkspace && project.areaIds
      ? project.areaIds.map((id) => getAreaById(currentWorkspace.id, id)).filter(Boolean)
      : [];
  const primaryArea = areas[0] || null;
  const priority = currentWorkspace
    ? getPriorityById(currentWorkspace.id, project.priorityId)
    : null;
  const cadence = currentWorkspace ? getCadenceById(currentWorkspace.id, project.cadenceId) : null;
  const confidence = currentWorkspace
    ? getConfidenceById(currentWorkspace.id, project.confidenceId)
    : null;

  const progress = calculateProjectProgress(project, completedTaskStatusIds);
  const primaryAreaColors = primaryArea
    ? getColorClasses(primaryArea.color)
    : { bg: 'bg-slate-100', text: 'text-slate-700' };
  const priorityColors = priority
    ? getColorClasses(priority.color)
    : { bg: 'bg-slate-50', text: 'text-slate-600' };

  const handleStatusChange = async (newStatusId: string) => {
    const newStatus = statuses.find((s) => s.id === newStatusId);
    await updateStatus.mutateAsync({ projectId: project.id, statusId: newStatusId });

    // Trigger celebration if project is marked as completed
    if (newStatus?.type === 'completed') {
      triggerCelebration();
      toast({
        title: 'Goal Completed!',
        description: `Congratulations! "${project.name}" has been achieved!`,
        variant: 'success',
      });
    } else {
      toast({
        title: 'Status updated',
        description: `Goal moved to ${newStatus?.name || 'new status'}`,
        variant: 'success',
      });
    }
  };

  const handleOwnerChange = async (newOwnerId: string) => {
    try {
      await updateProject.mutateAsync({
        projectId: project.id,
        updates: { ownerId: newOwnerId === 'unassigned' ? null : newOwnerId },
      });
      toast({
        title: 'Owner updated',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update owner',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this goal?')) {
      await deleteProject.mutateAsync(project.id);
      toast({
        title: 'Goal deleted',
        variant: 'success',
      });
      router.push('/board');
    }
  };

  return (
    <div className="border-b bg-background">
      <div className="container max-w-4xl px-4 py-4">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Title Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-tight md:text-3xl">{project.name}</h1>

            {/* Badges */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {areas.length > 0 ? (
                <>
                  <Badge className={cn(primaryAreaColors.bg, primaryAreaColors.text)}>
                    {primaryArea!.name}
                  </Badge>
                  {areas.length > 1 && (
                    <Badge variant="outline" className="text-muted-foreground">
                      +{areas.length - 1} area{areas.length > 2 ? 's' : ''}
                    </Badge>
                  )}
                </>
              ) : (
                <Badge className={cn(primaryAreaColors.bg, primaryAreaColors.text)}>
                  Unknown Area
                </Badge>
              )}
              <Badge className={cn(priorityColors.bg, priorityColors.text)}>
                {priority?.name || 'Unknown'} Priority
              </Badge>
              <Badge variant="outline">{cadence?.name || 'Unknown'} Review</Badge>
              <Badge variant="outline">{confidence?.name || 'Unknown'} Confidence</Badge>
            </div>
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
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBlockersModalOpen(true)}>
                <GitBranch className="mr-2 h-4 w-4" />
                Manage Blockers
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Goal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Blockers Section */}
        {project.blockedBy && project.blockedBy.length > 0 && (
          <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-orange-700">
              <Lock className="h-4 w-4" />
              Blocked by {project.blockedBy.length}{' '}
              {project.blockedBy.length === 1 ? 'project' : 'projects'}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {project.blockedBy.map((dep) => {
                const blockerStatus =
                  dep.blocker && currentWorkspace
                    ? getStatusById(currentWorkspace.id, dep.blocker.statusId)
                    : null;
                const isResolved = blockerStatus?.type === 'completed';
                return (
                  <button
                    key={dep.id}
                    onClick={() => dep.blocker && router.push(`/project/${dep.blocker.id}`)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors hover:opacity-80',
                      isResolved
                        ? 'bg-green-100 text-green-700 line-through'
                        : 'bg-orange-100 text-orange-700'
                    )}
                  >
                    {isResolved ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    {dep.blocker?.name || 'Unknown'}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Blocking Other Projects */}
        {project.blocking && project.blocking.length > 0 && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
              <Lock className="h-4 w-4" />
              Blocking {project.blocking.length}{' '}
              {project.blocking.length === 1 ? 'project' : 'projects'}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {project.blocking.map((dep) => (
                <button
                  key={dep.id}
                  onClick={() => dep.dependent && router.push(`/project/${dep.dependent.id}`)}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 transition-colors hover:opacity-80"
                >
                  {dep.dependent?.name || 'Unknown'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status Selector */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Select value={project.statusId} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => {
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

          {/* Owner Selector - only show for workspaces with multiple members */}
          {hasMultipleMembers && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Owner:</span>
              <Select value={project.ownerId || 'unassigned'} onValueChange={handleOwnerChange}>
                <SelectTrigger className="w-40">
                  <SelectValue>
                    {project.ownerId ? (
                      <div className="flex items-center gap-2">
                        {(() => {
                          const member = workspaceMembers.find((m) => m.userId === project.ownerId);
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
        </div>

        {/* Progress Bar */}
        {progress.total > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {progress.completed}/{progress.total} ({progress.percentage}%)
              </span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        )}

        {/* Timeline */}
        <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">Start:</span>{' '}
            {formatDate(project.startDate, 'MMM d, yyyy')}
          </div>
          <div>
            <span className="font-medium text-foreground">Target:</span>{' '}
            {formatDate(project.targetDate, 'MMM d, yyyy')}
          </div>
          {project.lastReviewDate && (
            <div>
              <span className="font-medium text-foreground">Last Review:</span>{' '}
              {formatDate(project.lastReviewDate, 'MMM d, yyyy')}
            </div>
          )}
        </div>
      </div>

      {/* Manage Blockers Modal */}
      <ManageBlockersModal
        project={project}
        open={blockersModalOpen}
        onOpenChange={setBlockersModalOpen}
      />

      {/* Edit Project Modal */}
      <EditProjectModal project={project} open={editModalOpen} onOpenChange={setEditModalOpen} />
    </div>
  );
}
