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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUpload, ImageThumbnail } from '@/components/shared/image-upload';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { useCreateTask, useProject } from '@/hooks/use-projects';
import { useToast } from '@/hooks/use-toast';
import { getColorClasses } from '@/types/config';
import { LocalImageAttachment } from '@/types';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  statusId: z.string().min(1, 'Status is required'),
  dueDate: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

export function AddTaskModal() {
  const { addTaskModalOpen, addTaskProjectId, closeAddTaskModal } = useUIStore();
  const { currentWorkspace } = useAuthStore();
  const { getTaskStatusesForWorkspace } = useConfigStore();
  const { data: project } = useProject(addTaskProjectId || '');
  const createTask = useCreateTask();
  const { toast } = useToast();
  const [images, setImages] = useState<LocalImageAttachment[]>([]);

  const taskStatuses = currentWorkspace ? getTaskStatusesForWorkspace(currentWorkspace.id) : [];
  const defaultStatusId =
    taskStatuses.find((s) => s.name === 'Next Action')?.id || taskStatuses[0]?.id || '';

  const handleAddImages = (newImages: LocalImageAttachment[]) => {
    setImages((prev) => [...prev, ...newImages].slice(0, 5));
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      statusId: defaultStatusId,
      dueDate: '',
    },
  });

  // Update default status when config loads
  useEffect(() => {
    if (taskStatuses.length > 0 && !watch('statusId')) {
      const nextAction = taskStatuses.find((s) => s.name === 'Next Action');
      setValue('statusId', nextAction?.id || taskStatuses[0].id);
    }
  }, [taskStatuses, setValue, watch]);

  const onSubmit = async (data: TaskFormData) => {
    if (!addTaskProjectId) return;

    try {
      await createTask.mutateAsync({
        projectId: addTaskProjectId,
        title: data.title,
        statusId: data.statusId,
        dueDate: data.dueDate || undefined,
        images: images.length > 0 ? (images as any) : undefined,
      });

      toast({
        title: 'Task created',
        description: 'Your new task has been added.',
        variant: 'success',
      });

      reset();
      setImages([]);
      closeAddTaskModal();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create task. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    reset();
    setImages([]);
    closeAddTaskModal();
  };

  return (
    <Dialog open={addTaskModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
          <DialogDescription>{project && `Adding task to "${project.name}"`}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task title</Label>
              <Input
                id="title"
                placeholder="What needs to be done?"
                {...register('title')}
                autoFocus
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('statusId')}
                onValueChange={(value) => setValue('statusId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {taskStatuses.map((status) => {
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

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date (optional)</Label>
              <Input id="dueDate" type="date" {...register('dueDate')} />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Attach images (optional)</Label>
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {images.map((image, index) => (
                    <ImageThumbnail
                      key={image.id}
                      image={image}
                      onRemove={() => handleRemoveImage(index)}
                      className="h-14 w-14"
                    />
                  ))}
                </div>
              )}
              {images.length < 5 && (
                <ImageUpload
                  onImagesAdd={handleAddImages}
                  maxFiles={5 - images.length}
                  maxSizeMB={5}
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || createTask.isPending}>
              {isSubmitting || createTask.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Task'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
