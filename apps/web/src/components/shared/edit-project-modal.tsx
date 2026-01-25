'use client';

import { useEffect, useState } from 'react';
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
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { useUpdateProject } from '@/hooks/use-projects';
import { useToast } from '@/hooks/use-toast';
import { getColorClasses } from '@/types/config';
import { Project } from '@/types';

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
  failureCriteria: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface EditProjectModalProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProjectModal({ project, open, onOpenChange }: EditProjectModalProps) {
  const { currentWorkspace } = useAuthStore();
  const {
    getAreasForWorkspace,
    getStatusesForWorkspace,
    getPrioritiesForWorkspace,
    getCadencesForWorkspace,
    getConfidencesForWorkspace,
    getActiveTags,
  } = useConfigStore();
  const updateProject = useUpdateProject();
  const { toast } = useToast();

  const areas = currentWorkspace ? getAreasForWorkspace(currentWorkspace.id) : [];
  const statuses = currentWorkspace ? getStatusesForWorkspace(currentWorkspace.id) : [];
  const priorities = currentWorkspace ? getPrioritiesForWorkspace(currentWorkspace.id) : [];
  const cadences = currentWorkspace ? getCadencesForWorkspace(currentWorkspace.id) : [];
  const confidences = currentWorkspace ? getConfidencesForWorkspace(currentWorkspace.id) : [];
  const tags = currentWorkspace ? getActiveTags(currentWorkspace.id) : [];

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(project.tagIds || []);

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };

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
      name: project.name,
      objective: project.objective,
      areaId: project.areaId,
      statusId: project.statusId,
      priorityId: project.priorityId,
      cadenceId: project.cadenceId,
      confidenceId: project.confidenceId,
      startDate: formatDate(project.startDate),
      targetDate: formatDate(project.targetDate),
      successMetric: project.successMetric || '',
      failureCriteria: project.failureCriteria || '',
    },
  });

  // Reset form when project changes
  useEffect(() => {
    reset({
      name: project.name,
      objective: project.objective,
      areaId: project.areaId,
      statusId: project.statusId,
      priorityId: project.priorityId,
      cadenceId: project.cadenceId,
      confidenceId: project.confidenceId,
      startDate: formatDate(project.startDate),
      targetDate: formatDate(project.targetDate),
      successMetric: project.successMetric || '',
      failureCriteria: project.failureCriteria || '',
    });
    setSelectedTagIds(project.tagIds || []);
  }, [project, reset]);

  const onSubmit = async (data: ProjectFormData) => {
    try {
      await updateProject.mutateAsync({
        projectId: project.id,
        updates: {
          name: data.name,
          objective: data.objective,
          areaId: data.areaId,
          statusId: data.statusId,
          priorityId: data.priorityId,
          cadenceId: data.cadenceId,
          confidenceId: data.confidenceId,
          startDate: new Date(data.startDate),
          targetDate: new Date(data.targetDate),
          successMetric: data.successMetric,
          failureCriteria: data.failureCriteria || undefined,
          tagIds: selectedTagIds,
        },
      });

      toast({
        title: 'Goal updated',
        description: 'Your changes have been saved.',
        variant: 'success',
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update goal. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    reset();
    setSelectedTagIds(project.tagIds || []);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Goal</DialogTitle>
          <DialogDescription>Update your goal details</DialogDescription>
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
                    {areas.map((area) => {
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
                    {priorities.map((priority) => {
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
                    {cadences.map((cadence) => (
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
                  {confidences.map((confidence) => {
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
              <RichTextEditor
                placeholder="How will you measure success?"
                value={watch('successMetric') || ''}
                onChange={(value) => setValue('successMetric', value)}
                minHeight="100px"
                showToolbar={true}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="failureCriteria">Failure criteria (optional)</Label>
              <RichTextEditor
                placeholder="What would indicate failure?"
                value={watch('failureCriteria') || ''}
                onChange={(value) => setValue('failureCriteria', value)}
                minHeight="100px"
                showToolbar={true}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || updateProject.isPending}>
              {isSubmitting || updateProject.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
