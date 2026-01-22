'use client';

import { useState } from 'react';
import { Loader2, X, Lock, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BlockerSelect } from '@/components/shared/blocker-select';
import { Project } from '@/types';
import { useProjects } from '@/hooks/use-projects';
import { useAddProjectBlocker, useRemoveProjectBlocker } from '@/hooks/use-dependencies';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { getColorClasses } from '@/types/config';
import { cn } from '@/lib/utils';

interface ManageBlockersModalProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageBlockersModal({ project, open, onOpenChange }: ManageBlockersModalProps) {
  const { data: allProjects } = useProjects();
  const addBlocker = useAddProjectBlocker();
  const removeBlocker = useRemoveProjectBlocker();
  const { toast } = useToast();
  const { currentWorkspace } = useAuthStore();
  const { getStatusById } = useConfigStore();

  const [selectedBlockerIds, setSelectedBlockerIds] = useState<string[]>([]);

  // Get current blockers
  const currentBlockerIds = project.blockedBy?.map((dep) => dep.blockerId) || [];

  // Filter out projects that are already blockers and the current project
  const availableProjects =
    allProjects?.filter((p) => p.id !== project.id && !currentBlockerIds.includes(p.id)) || [];

  const handleAddBlockers = async () => {
    if (selectedBlockerIds.length === 0) return;

    try {
      for (const blockerId of selectedBlockerIds) {
        await addBlocker.mutateAsync({
          projectId: project.id,
          blockerId,
        });
      }
      toast({
        title: 'Blockers added',
        description: `Added ${selectedBlockerIds.length} blocker${selectedBlockerIds.length > 1 ? 's' : ''} to this goal`,
        variant: 'success',
      });
      setSelectedBlockerIds([]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add blockers',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveBlocker = async (blockerId: string) => {
    try {
      await removeBlocker.mutateAsync({
        projectId: project.id,
        blockerId,
      });
      toast({
        title: 'Blocker removed',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove blocker',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Manage Blockers
          </DialogTitle>
          <DialogDescription>Add or remove goals that block "{project.name}"</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Blockers */}
          <div>
            <h4 className="text-sm font-medium mb-3">Current Blockers</h4>
            {project.blockedBy && project.blockedBy.length > 0 ? (
              <div className="space-y-2">
                {project.blockedBy.map((dep) => {
                  const status =
                    dep.blocker && currentWorkspace
                      ? getStatusById(currentWorkspace.id, dep.blocker.statusId)
                      : null;
                  const colors = getColorClasses(status?.color || 'slate');
                  const isCompleted = status?.type === 'completed';

                  return (
                    <div
                      key={dep.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Lock
                          className={cn(
                            'h-4 w-4',
                            isCompleted ? 'text-green-500' : 'text-orange-500'
                          )}
                        />
                        <div>
                          <p
                            className={cn(
                              'font-medium',
                              isCompleted && 'line-through text-muted-foreground'
                            )}
                          >
                            {dep.blocker?.name || 'Unknown'}
                          </p>
                          <span
                            className={cn(
                              'text-xs rounded-full px-2 py-0.5',
                              colors.bg,
                              colors.text
                            )}
                          >
                            {status?.name || 'Unknown'}
                          </span>
                        </div>
                      </div>
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
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No blockers yet</p>
            )}
          </div>

          {/* Add New Blockers */}
          <div>
            <h4 className="text-sm font-medium mb-3">Add Blockers</h4>
            <div className="space-y-3">
              <BlockerSelect
                type="project"
                items={availableProjects}
                selectedIds={selectedBlockerIds}
                excludeId={project.id}
                onSelectionChange={setSelectedBlockerIds}
                placeholder="Select goals that block this one..."
              />
              {selectedBlockerIds.length > 0 && (
                <Button
                  onClick={handleAddBlockers}
                  disabled={addBlocker.isPending}
                  className="w-full"
                >
                  {addBlocker.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add {selectedBlockerIds.length} Blocker
                      {selectedBlockerIds.length > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
