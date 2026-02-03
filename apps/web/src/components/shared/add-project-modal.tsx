'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagSelect } from '@/components/ui/tag-select';
import { AreaSelect } from '@/components/ui/area-select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { useCreateProject } from '@/hooks/use-projects';
import { useWorkspaceMembers } from '@/hooks/use-workspace-members';
import { useToast } from '@/hooks/use-toast';
import {
  getColorClasses,
  PriorityConfig,
  CadenceConfig,
  ConfidenceConfig,
  StatusConfig,
} from '@/types/config';

const projectSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    objective: z.string().min(1, 'Objective is required'),
    areaIds: z.array(z.string()).min(1, 'At least one area is required'),
    statusId: z.string().min(1, 'Status is required'),
    priorityId: z.string().min(1, 'Priority is required'),
    cadenceId: z.string().min(1, 'Cadence is required'),
    confidenceId: z.string().min(1, 'Confidence is required'),
    startDate: z.string().min(1, 'Start date is required'),
    targetDate: z.string().min(1, 'Target date is required'),
    successMetric: z.string(),
    ownerId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.targetDate) return true;
      return data.targetDate > data.startDate;
    },
    {
      message: 'Target date must be after start date',
      path: ['targetDate'],
    }
  );

type ProjectFormData = z.infer<typeof projectSchema>;

export function AddProjectModal() {
  const { addProjectModalOpen, setAddProjectModalOpen } = useUIStore();
  const { currentWorkspace, user } = useAuthStore();
  const {
    getAreasForWorkspace,
    getStatusesForWorkspace,
    getPrioritiesForWorkspace,
    getCadencesForWorkspace,
    getConfidencesForWorkspace,
    getActiveTags,
  } = useConfigStore();
  const createProject = useCreateProject();
  const { data: workspaceMembers = [] } = useWorkspaceMembers(currentWorkspace?.id);
  const { toast } = useToast();

  // Check if workspace has multiple members (show owner selector only then)
  const hasMultipleMembers = workspaceMembers.length > 1;

  const areas = useMemo(
    () => (currentWorkspace ? getAreasForWorkspace(currentWorkspace.id) : []),
    [currentWorkspace, getAreasForWorkspace]
  );
  const statuses = useMemo(
    () => (currentWorkspace ? getStatusesForWorkspace(currentWorkspace.id) : []),
    [currentWorkspace, getStatusesForWorkspace]
  );
  const priorities = useMemo(
    () => (currentWorkspace ? getPrioritiesForWorkspace(currentWorkspace.id) : []),
    [currentWorkspace, getPrioritiesForWorkspace]
  );
  const cadences = useMemo(
    () => (currentWorkspace ? getCadencesForWorkspace(currentWorkspace.id) : []),
    [currentWorkspace, getCadencesForWorkspace]
  );
  const confidences = useMemo(
    () => (currentWorkspace ? getConfidencesForWorkspace(currentWorkspace.id) : []),
    [currentWorkspace, getConfidencesForWorkspace]
  );
  const tags = useMemo(
    () => (currentWorkspace ? getActiveTags(currentWorkspace.id) : []),
    [currentWorkspace, getActiveTags]
  );

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const today = new Date().toISOString().split('T')[0];
  const endOfYear = `${new Date().getFullYear()}-12-31`;

  const defaultStatusId = statuses[0]?.id || '';
  const defaultPriorityId =
    priorities.find((p: PriorityConfig) => p.name === 'Medium')?.id || priorities[0]?.id || '';
  const defaultCadenceId =
    cadences.find((c: CadenceConfig) => c.name === 'Monthly')?.id || cadences[0]?.id || '';
  const defaultConfidenceId =
    confidences.find((c: ConfidenceConfig) => c.name === 'Medium')?.id || confidences[0]?.id || '';

  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      objective: '',
      areaIds: [],
      statusId: defaultStatusId,
      priorityId: defaultPriorityId,
      cadenceId: defaultCadenceId,
      confidenceId: defaultConfidenceId,
      startDate: today,
      targetDate: endOfYear,
      successMetric: '',
      ownerId: '',
    },
  });

  // Sync selectedAreaIds with form
  useEffect(() => {
    setValue('areaIds', selectedAreaIds);
  }, [selectedAreaIds, setValue]);

  // Update defaults when config loads
  useEffect(() => {
    if (areas.length > 0) {
      setSelectedAreaIds((prev) => (prev.length === 0 ? [areas[0].id] : prev));
    }
    if (statuses.length > 0 && !watch('statusId')) {
      setValue('statusId', statuses[0].id);
    }
    if (priorities.length > 0 && !watch('priorityId')) {
      const medium = priorities.find((p: PriorityConfig) => p.name === 'Medium');
      setValue('priorityId', medium?.id || priorities[0].id);
    }
    if (cadences.length > 0 && !watch('cadenceId')) {
      const monthly = cadences.find((c: CadenceConfig) => c.name === 'Monthly');
      setValue('cadenceId', monthly?.id || cadences[0].id);
    }
    if (confidences.length > 0 && !watch('confidenceId')) {
      const medium = confidences.find((c: ConfidenceConfig) => c.name === 'Medium');
      setValue('confidenceId', medium?.id || confidences[0].id);
    }
  }, [areas, statuses, priorities, cadences, confidences, setValue, watch]);

  const onSubmit = async (data: ProjectFormData) => {
    if (!currentWorkspace) return;

    try {
      await createProject.mutateAsync({
        workspaceId: currentWorkspace.id,
        name: data.name,
        objective: data.objective,
        areaIds: selectedAreaIds,
        statusId: data.statusId,
        priorityId: data.priorityId,
        cadenceId: data.cadenceId,
        confidenceId: data.confidenceId,
        startDate: data.startDate,
        targetDate: data.targetDate,
        successMetric: data.successMetric,
        tagIds: selectedTagIds,
        ownerId: data.ownerId || undefined,
      });

      toast({
        title: 'Goal created',
        description: 'Your new goal has been added.',
        variant: 'success',
      });

      reset();
      setSelectedAreaIds([]);
      setSelectedTagIds([]);
      setAddProjectModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create goal. Please try again.';
      const isLimitError = message.toLowerCase().includes('limit');
      toast({
        title: isLimitError ? 'Upgrade required' : 'Error',
        description: message,
        variant: isLimitError ? 'default' : 'destructive',
      });
    }
  };

  const handleClose = () => {
    reset();
    setSelectedAreaIds([]);
    setSelectedTagIds([]);
    setAddProjectModalOpen(false);
  };

  return (
    <Dialog open={addProjectModalOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-h-[90vh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
          <DialogDescription>Add a new goal to track in {currentWorkspace?.name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4 pb-6">
            <div className="space-y-2">
              <Label htmlFor="name">Goal name *</Label>
              <Input id="name" placeholder="e.g., Learn Spanish" {...register('name')} autoFocus />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="objective">Objective *</Label>
              <RichTextEditor
                placeholder="What do you want to achieve?"
                value={watch('objective') || ''}
                onChange={(value) => setValue('objective', value)}
                minHeight="100px"
                showToolbar={true}
              />
              {errors.objective && (
                <p className="text-sm text-destructive">{errors.objective.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Areas</Label>
              <AreaSelect
                areas={areas}
                selectedAreaIds={selectedAreaIds}
                onSelectionChange={setSelectedAreaIds}
                placeholder="Select areas..."
              />
              {errors.areaIds && (
                <p className="text-sm text-destructive">{errors.areaIds.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={watch('statusId')}
                  onValueChange={(value) => setValue('statusId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status: StatusConfig) => {
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={watch('priorityId')}
                  onValueChange={(value) => setValue('priorityId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority: PriorityConfig) => {
                      const colors = getColorClasses(priority.color);
                      return (
                        <SelectItem key={priority.id} value={priority.id}>
                          <span className={colors.text}>{priority.name}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Review Cadence</Label>
                <Select
                  value={watch('cadenceId')}
                  onValueChange={(value) => setValue('cadenceId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cadence" />
                  </SelectTrigger>
                  <SelectContent>
                    {cadences.map((cadence: CadenceConfig) => (
                      <SelectItem key={cadence.id} value={cadence.id}>
                        {cadence.name} ({cadence.days} days)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start date</Label>
                <Input id="startDate" type="date" {...register('startDate')} />
                {errors.startDate && (
                  <p className="text-sm text-destructive">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetDate">Target date</Label>
                <Input id="targetDate" type="date" {...register('targetDate')} />
                {errors.targetDate && (
                  <p className="text-sm text-destructive">{errors.targetDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Confidence</Label>
              <Select
                value={watch('confidenceId')}
                onValueChange={(value) => setValue('confidenceId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select confidence" />
                </SelectTrigger>
                <SelectContent>
                  {confidences.map((confidence: ConfidenceConfig) => {
                    const colors = getColorClasses(confidence.color);
                    return (
                      <SelectItem key={confidence.id} value={confidence.id}>
                        <span className={colors.text}>{confidence.name}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <TagSelect
                tags={tags}
                selectedTagIds={selectedTagIds}
                onSelectionChange={setSelectedTagIds}
                placeholder="Select tags..."
              />
            </div>

            {/* Owner Selector - only show for workspaces with multiple members */}
            {hasMultipleMembers && (
              <div className="space-y-2">
                <Label htmlFor="owner">Owner (optional)</Label>
                <Select
                  value={watch('ownerId') || ''}
                  onValueChange={(value) =>
                    setValue('ownerId', value === 'unassigned' ? '' : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned">
                      {watch('ownerId') ? (
                        <div className="flex items-center gap-2">
                          {(() => {
                            const member = workspaceMembers.find(
                              (m) => m.userId === watch('ownerId')
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
                              'Unassigned'
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
              <Label htmlFor="successMetric">Success metric</Label>
              <RichTextEditor
                placeholder="How will you measure success?"
                value={watch('successMetric') || ''}
                onChange={(value) => setValue('successMetric', value)}
                minHeight="100px"
                showToolbar={true}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || createProject.isPending}>
              {isSubmitting || createProject.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Goal'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
