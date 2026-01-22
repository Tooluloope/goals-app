'use client';

import { useState } from 'react';
import { useCreateHabit } from '@/hooks/use-habits';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  Plus,
  BookOpen,
  Dumbbell,
  Droplets,
  Brain,
  Moon,
  Heart,
  Pencil,
  Coffee,
  Music,
  Target,
  Loader2,
  Clock,
} from 'lucide-react';
import type { HabitFrequency } from '@goals/shared';

const HABIT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  book: BookOpen,
  dumbbell: Dumbbell,
  droplets: Droplets,
  brain: Brain,
  moon: Moon,
  heart: Heart,
  pencil: Pencil,
  coffee: Coffee,
  music: Music,
  target: Target,
};

const ICON_OPTIONS = Object.keys(HABIT_ICONS);

const COLOR_OPTIONS = [
  { name: 'primary', class: 'bg-primary' },
  { name: 'blue', class: 'bg-blue-500' },
  { name: 'green', class: 'bg-green-500' },
  { name: 'orange', class: 'bg-orange-500' },
  { name: 'pink', class: 'bg-pink-500' },
  { name: 'purple', class: 'bg-purple-500' },
];

const FREQUENCY_OPTIONS: { value: HabitFrequency; label: string; description: string }[] = [
  { value: 'daily', label: 'Daily', description: 'Every day' },
  { value: 'weekly', label: 'Weekly', description: 'Once a week' },
  { value: 'specific_days', label: 'Specific Days', description: 'Choose days' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'S', fullLabel: 'Sunday' },
  { value: 1, label: 'M', fullLabel: 'Monday' },
  { value: 2, label: 'T', fullLabel: 'Tuesday' },
  { value: 3, label: 'W', fullLabel: 'Wednesday' },
  { value: 4, label: 'T', fullLabel: 'Thursday' },
  { value: 5, label: 'F', fullLabel: 'Friday' },
  { value: 6, label: 'S', fullLabel: 'Saturday' },
];

const GOAL_AREAS = [
  'Health & Fitness',
  'Learning',
  'Productivity',
  'Mindfulness',
  'Relationships',
  'Finance',
  'Creativity',
  'Other',
];

interface AddHabitModalProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function AddHabitModal({ trigger, onSuccess }: AddHabitModalProps) {
  const createHabit = useCreateHabit();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'target',
    color: 'primary',
    frequency: 'daily' as HabitFrequency,
    frequencyDays: [] as number[],
    reminderEnabled: false,
    reminderTime: '09:00',
    goalArea: '',
  });

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    await createHabit.mutateAsync({
      name: formData.name.trim(),
      icon: formData.icon,
      color: formData.color,
      frequency: formData.frequency,
      frequencyDays: formData.frequency === 'specific_days' ? formData.frequencyDays : [],
      reminderEnabled: formData.reminderEnabled,
      reminderTime: formData.reminderEnabled ? formData.reminderTime : undefined,
      goalArea: formData.goalArea || undefined,
    });

    // Reset form
    setFormData({
      name: '',
      icon: 'target',
      color: 'primary',
      frequency: 'daily',
      frequencyDays: [],
      reminderEnabled: false,
      reminderTime: '09:00',
      goalArea: '',
    });
    setIsOpen(false);
    onSuccess?.();
  };

  const toggleDay = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      frequencyDays: prev.frequencyDays.includes(day)
        ? prev.frequencyDays.filter((d) => d !== day)
        : [...prev.frequencyDays, day].sort(),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Habit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Habit</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-4">
          {/* Habit Name */}
          <div className="space-y-2">
            <Label htmlFor="habit-name">Habit Name</Label>
            <Input
              id="habit-name"
              placeholder="e.g., Read for 30 minutes"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((icon) => {
                const IconComponent = HABIT_ICONS[icon];
                return (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all',
                      formData.icon === icon
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <IconComponent className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>Theme Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.name })}
                  className={cn(
                    'h-8 w-8 rounded-full transition-all',
                    color.class,
                    formData.color === color.name
                      ? 'ring-2 ring-offset-2 ring-offset-background'
                      : 'opacity-60 hover:opacity-100'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Frequency Selection */}
          <div className="space-y-2">
            <Label>Frequency</Label>
            <div className="grid grid-cols-3 gap-2">
              {FREQUENCY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, frequency: option.value })}
                  className={cn(
                    'flex flex-col items-center rounded-lg border-2 p-3 text-center transition-all',
                    formData.frequency === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="text-[10px] text-muted-foreground">{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Day Selection (for specific_days frequency) */}
          {formData.frequency === 'specific_days' && (
            <div className="space-y-2">
              <Label>Select Days</Label>
              <div className="flex justify-between gap-1">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    title={day.fullLabel}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-all',
                      formData.frequencyDays.includes(day.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border hover:border-primary/50'
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              {formData.frequencyDays.length === 0 && (
                <p className="text-xs text-muted-foreground">Select at least one day</p>
              )}
            </div>
          )}

          {/* Goal Area */}
          <div className="space-y-2">
            <Label>Goal Area (Optional)</Label>
            <div className="flex flex-wrap gap-2">
              {GOAL_AREAS.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      goalArea: formData.goalArea === area ? '' : area,
                    })
                  }
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-all',
                    formData.goalArea === area
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {/* Reminder Toggle */}
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="reminder-toggle" className="cursor-pointer">
                  Daily Reminder
                </Label>
              </div>
              <Switch
                id="reminder-toggle"
                checked={formData.reminderEnabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, reminderEnabled: checked })
                }
              />
            </div>
            {formData.reminderEnabled && (
              <div className="flex items-center gap-2">
                <Label htmlFor="reminder-time" className="text-sm text-muted-foreground">
                  Remind me at:
                </Label>
                <Input
                  id="reminder-time"
                  type="time"
                  value={formData.reminderTime}
                  onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                  className="w-32"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={
              !formData.name.trim() ||
              createHabit.isPending ||
              (formData.frequency === 'specific_days' && formData.frequencyDays.length === 0)
            }
          >
            {createHabit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Habit'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
