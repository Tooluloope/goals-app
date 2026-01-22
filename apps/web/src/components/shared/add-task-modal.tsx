'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Repeat, ChevronDown, ChevronUp } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
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
import { LocalImageAttachment, RecurrenceType } from '@/types';
import { cn } from '@/lib/utils';

const WEEKDAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  statusId: z.string().min(1, 'Status is required'),
  dueDate: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceType: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom']).optional(),
  recurrenceInterval: z.number().min(1).optional(),
  recurrenceDays: z.array(z.number()).optional(),
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
  const [showRecurrence, setShowRecurrence] = useState(false);

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
      isRecurring: false,
      recurrenceType: 'none',
      recurrenceInterval: 1,
      recurrenceDays: [],
    },
  });

  const isRecurring = watch('isRecurring');
  const recurrenceType = watch('recurrenceType');
  const recurrenceDays = watch('recurrenceDays') || [];

  const toggleWeekday = (day: number) => {
    const current = recurrenceDays;
    const newDays = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    setValue('recurrenceDays', newDays);
  };

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
        isRecurring: data.isRecurring,
        recurrenceType: data.isRecurring ? data.recurrenceType : 'none',
        recurrenceInterval: data.recurrenceInterval || 1,
        recurrenceDays: data.recurrenceType === 'weekly' ? data.recurrenceDays : [],
      });

      const taskType = data.isRecurring ? 'Recurring task' : 'Task';
      toast({
        title: `${taskType} created`,
        description: data.isRecurring
          ? `Your recurring task has been added. It will repeat ${data.recurrenceType}.`
          : 'Your new task has been added.',
        variant: 'success',
      });

      reset();
      setImages([]);
      setShowRecurrence(false);
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
    setShowRecurrence(false);
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

            {/* Recurrence Toggle */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowRecurrence(!showRecurrence)}
                className="flex w-full items-center justify-between rounded-lg border bg-muted/50 px-3 py-2 text-sm hover:bg-muted"
              >
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4" />
                  <span>Repeat</span>
                  {isRecurring && recurrenceType !== 'none' && (
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      {recurrenceType === 'daily' && 'Daily'}
                      {recurrenceType === 'weekly' && 'Weekly'}
                      {recurrenceType === 'monthly' && 'Monthly'}
                      {recurrenceType === 'yearly' && 'Yearly'}
                    </span>
                  )}
                </div>
                {showRecurrence ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showRecurrence && (
                <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isRecurring"
                      checked={isRecurring}
                      onCheckedChange={(checked) => {
                        setValue('isRecurring', !!checked);
                        if (!checked) {
                          setValue('recurrenceType', 'none');
                        } else {
                          setValue('recurrenceType', 'daily');
                        }
                      }}
                    />
                    <Label htmlFor="isRecurring" className="text-sm font-normal">
                      Make this a recurring task
                    </Label>
                  </div>

                  {isRecurring && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Repeat every</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            max={99}
                            className="w-16"
                            {...register('recurrenceInterval', { valueAsNumber: true })}
                          />
                          <Select
                            value={recurrenceType}
                            onValueChange={(value) =>
                              setValue('recurrenceType', value as RecurrenceType)
                            }
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Day(s)</SelectItem>
                              <SelectItem value="weekly">Week(s)</SelectItem>
                              <SelectItem value="monthly">Month(s)</SelectItem>
                              <SelectItem value="yearly">Year(s)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {recurrenceType === 'weekly' && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">On these days</Label>
                          <div className="flex flex-wrap gap-1">
                            {WEEKDAYS.map((day) => (
                              <button
                                key={day.value}
                                type="button"
                                onClick={() => toggleWeekday(day.value)}
                                className={cn(
                                  'h-8 w-8 rounded-full text-xs font-medium transition-colors',
                                  recurrenceDays.includes(day.value)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted hover:bg-muted/80'
                                )}
                              >
                                {day.label.charAt(0)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
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
