'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Repeat, ChevronDown, ChevronUp, User } from 'lucide-react';
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
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { useUpdateTask } from '@/hooks/use-tasks';
import { useWorkspaceMembers } from '@/hooks/use-workspace-members';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getColorClasses } from '@/types/config';
import { Task, RecurrenceType } from '@/types';
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
  assignedToId: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceType: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom']).optional(),
  recurrenceInterval: z.number().min(1).optional(),
  recurrenceDays: z.array(z.number()).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface EditTaskModalProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskModal({ task, open, onOpenChange }: EditTaskModalProps) {
  const { currentWorkspace, user } = useAuthStore();
  const { getTaskStatusesForWorkspace } = useConfigStore();
  const { data: workspaceMembers = [] } = useWorkspaceMembers(currentWorkspace?.id);
  const updateTask = useUpdateTask();
  const { toast } = useToast();
  const [showRecurrence, setShowRecurrence] = useState(task.isRecurring);

  const taskStatuses = currentWorkspace ? getTaskStatusesForWorkspace(currentWorkspace.id) : [];
  const hasMultipleMembers = workspaceMembers.length > 1;

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
      title: task.title,
      statusId: task.statusId,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      assignedToId: task.assignedToId || '',
      isRecurring: task.isRecurring,
      recurrenceType: task.recurrenceType || 'none',
      recurrenceInterval: task.recurrenceInterval || 1,
      recurrenceDays: task.recurrenceDays || [],
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

  // Reset form when task changes
  useEffect(() => {
    reset({
      title: task.title,
      statusId: task.statusId,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      assignedToId: task.assignedToId || '',
      isRecurring: task.isRecurring,
      recurrenceType: task.recurrenceType || 'none',
      recurrenceInterval: task.recurrenceInterval || 1,
      recurrenceDays: task.recurrenceDays || [],
    });
    setShowRecurrence(task.isRecurring);
  }, [task, reset]);

  const onSubmit = async (data: TaskFormData) => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: {
          title: data.title,
          statusId: data.statusId,
          dueDate: data.dueDate || undefined,
          assignedToId: data.assignedToId || null,
          isRecurring: data.isRecurring,
          recurrenceType: data.isRecurring ? data.recurrenceType : 'none',
          recurrenceInterval: data.recurrenceInterval || 1,
          recurrenceDays: data.recurrenceType === 'weekly' ? data.recurrenceDays : [],
        },
      });

      toast({
        title: 'Task updated',
        description: 'Your changes have been saved.',
        variant: 'success',
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update your task details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
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

            {/* Assignee Selector - only show for workspaces with multiple members */}
            {hasMultipleMembers && (
              <div className="space-y-2">
                <Label htmlFor="assignee">Assign to (optional)</Label>
                <Select
                  value={watch('assignedToId') || ''}
                  onValueChange={(value) =>
                    setValue('assignedToId', value === 'unassigned' ? '' : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned">
                      {watch('assignedToId') ? (
                        <div className="flex items-center gap-2">
                          {(() => {
                            const member = workspaceMembers.find(
                              (m) => m.userId === watch('assignedToId')
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || updateTask.isPending}>
              {isSubmitting || updateTask.isPending ? (
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
