'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TagSelect } from '@/components/ui/tag-select';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { useCreateProject } from '@/hooks/use-projects';
import { useToast } from '@/hooks/use-toast';
import {
  getColorClasses,
  PriorityConfig,
  CadenceConfig,
  ConfidenceConfig,
  AreaConfig,
  StatusConfig,
} from '@/types/config';

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  objective: z.string().min(1, 'Objective is required'),
  areaId: z.string().min(1, 'Area is required'),
  statusId: z.string().min(1, 'Status is required'),
  priorityId: z.string().min(1, 'Priority is required'),
  cadenceId: z.string().min(1, 'Cadence is required'),
  confidenceId: z.string().min(1, 'Confidence is required'),
  startDate: z.string(),
  targetDate: z.string(),
  successMetric: z.string(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export function AddProjectModal() {
  const { addProjectModalOpen, setAddProjectModalOpen } = useUIStore();
  const { currentWorkspace } = useAuthStore();
  const {
    getAreasForWorkspace,
    getStatusesForWorkspace,
    getPrioritiesForWorkspace,
    getCadencesForWorkspace,
    getConfidencesForWorkspace,
    getActiveTags,
  } = useConfigStore();
  const createProject = useCreateProject();
  const { toast } = useToast();

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

  const defaultAreaId = areas[0]?.id || '';
  const defaultStatusId = statuses[0]?.id || '';
  const defaultPriorityId =
    priorities.find((p: PriorityConfig) => p.name === 'Medium')?.id || priorities[0]?.id || '';
  const defaultCadenceId =
    cadences.find((c: CadenceConfig) => c.name === 'Monthly')?.id || cadences[0]?.id || '';
  const defaultConfidenceId =
    confidences.find((c: ConfidenceConfig) => c.name === 'Medium')?.id || confidences[0]?.id || '';

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
      areaId: defaultAreaId,
      statusId: defaultStatusId,
      priorityId: defaultPriorityId,
      cadenceId: defaultCadenceId,
      confidenceId: defaultConfidenceId,
      startDate: today,
      targetDate: endOfYear,
      successMetric: '',
    },
  });

  // Update defaults when config loads
  useEffect(() => {
    if (areas.length > 0 && !watch('areaId')) {
      setValue('areaId', areas[0].id);
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
        areaId: data.areaId,
        statusId: data.statusId,
        priorityId: data.priorityId,
        cadenceId: data.cadenceId,
        confidenceId: data.confidenceId,
        startDate: data.startDate,
        targetDate: data.targetDate,
        successMetric: data.successMetric,
        tagIds: selectedTagIds,
      });

      toast({
        title: 'Goal created',
        description: 'Your new goal has been added.',
        variant: 'success',
      });

      reset();
      setSelectedTagIds([]);
      setAddProjectModalOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create goal. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    reset();
    setSelectedTagIds([]);
    setAddProjectModalOpen(false);
  };

  return (
    <Dialog open={addProjectModalOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
          <DialogDescription>Add a new goal to track in {currentWorkspace?.name}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Goal name *</Label>
              <Input id="name" placeholder="e.g., Learn Spanish" {...register('name')} autoFocus />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="objective">Objective *</Label>
              <Textarea
                id="objective"
                placeholder="What do you want to achieve?"
                {...register('objective')}
              />
              {errors.objective && (
                <p className="text-sm text-destructive">{errors.objective.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Area</Label>
                <Select
                  value={watch('areaId')}
                  onValueChange={(value) => setValue('areaId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((area: AreaConfig) => {
                      const colors = getColorClasses(area.color);
                      return (
                        <SelectItem key={area.id} value={area.id}>
                          <span className={colors.text}>{area.name}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

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
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetDate">Target date</Label>
                <Input id="targetDate" type="date" {...register('targetDate')} />
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

            <div className="space-y-2">
              <Label htmlFor="successMetric">Success metric</Label>
              <Textarea
                id="successMetric"
                placeholder="How will you measure success?"
                {...register('successMetric')}
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
