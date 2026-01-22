'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  useTodayHabits,
  useToggleHabitLog,
  useCreateHabit,
  useDeleteHabit,
} from '@/hooks/use-habits';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Plus,
  Check,
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
  Trash2,
  Loader2,
} from 'lucide-react';
import type { HabitWithStats } from '@goals/shared';

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
  { name: 'primary', class: 'bg-primary', hover: 'hover:bg-primary/80' },
  { name: 'blue', class: 'bg-blue-500', hover: 'hover:bg-blue-400' },
  { name: 'green', class: 'bg-green-500', hover: 'hover:bg-green-400' },
  { name: 'orange', class: 'bg-orange-500', hover: 'hover:bg-orange-400' },
  { name: 'pink', class: 'bg-pink-500', hover: 'hover:bg-pink-400' },
  { name: 'purple', class: 'bg-purple-500', hover: 'hover:bg-purple-400' },
];

export function HabitTracker() {
  const { data: habitsData, isLoading } = useTodayHabits();
  // Ensure habits is always an array (handle null/undefined)
  const habits = Array.isArray(habitsData) ? habitsData : [];
  const toggleLog = useToggleHabitLog();
  const createHabit = useCreateHabit();
  const deleteHabit = useDeleteHabit();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', icon: 'target', color: 'primary' });

  const today = format(new Date(), 'yyyy-MM-dd');

  const handleToggle = (habitId: string) => {
    toggleLog.mutate({ habitId, date: today });
  };

  const handleAddHabit = async () => {
    if (!newHabit.name.trim()) return;

    await createHabit.mutateAsync({
      name: newHabit.name.trim(),
      icon: newHabit.icon,
      color: newHabit.color,
    });

    setNewHabit({ name: '', icon: 'target', color: 'primary' });
    setIsAddDialogOpen(false);
  };

  const handleDeleteHabit = (habitId: string) => {
    if (confirm('Are you sure you want to delete this habit?')) {
      deleteHabit.mutate(habitId);
    }
  };

  const getColorClasses = (colorName: string, isCompleted: boolean) => {
    const color = COLOR_OPTIONS.find((c) => c.name === colorName) || COLOR_OPTIONS[0];
    if (isCompleted) {
      return `${color.class} text-white shadow-lg`;
    }
    return 'bg-card border-2 border-border hover:border-primary/50 text-muted-foreground hover:text-foreground';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Habit Cards - Horizontal Scroll */}
      <div className="-mx-4 overflow-x-auto px-4 pb-4">
        <div className="flex gap-4">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggle={() => handleToggle(habit.id)}
              onDelete={() => handleDeleteHabit(habit.id)}
              colorClasses={getColorClasses(habit.color, habit.completedToday)}
            />
          ))}

          {/* Add Habit Button */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <button className="flex h-32 w-28 flex-shrink-0 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card/50 text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground">
                <Plus className="h-8 w-8" />
                <span className="text-sm font-medium">Add</span>
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Habit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="habit-name">Name</Label>
                  <Input
                    id="habit-name"
                    placeholder="e.g., Read, Meditate, Exercise"
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Icon</Label>
                  <div className="flex flex-wrap gap-2">
                    {ICON_OPTIONS.map((icon) => {
                      const IconComponent = HABIT_ICONS[icon];
                      return (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setNewHabit({ ...newHabit, icon })}
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all',
                            newHabit.icon === icon
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

                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setNewHabit({ ...newHabit, color: color.name })}
                        className={cn(
                          'h-8 w-8 rounded-full transition-all',
                          color.class,
                          newHabit.color === color.name
                            ? 'ring-2 ring-offset-2 ring-offset-background'
                            : 'opacity-60 hover:opacity-100'
                        )}
                      />
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleAddHabit}
                  disabled={!newHabit.name.trim() || createHabit.isPending}
                >
                  {createHabit.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Add Habit'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {habits.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Target className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No habits yet</p>
            <p className="text-sm text-muted-foreground/70">
              Add your first habit to start tracking your daily rhythm
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function HabitCard({
  habit,
  onToggle,
  onDelete,
  colorClasses,
}: {
  habit: HabitWithStats;
  onToggle: () => void;
  onDelete: () => void;
  colorClasses: string;
}) {
  const IconComponent = HABIT_ICONS[habit.icon] || Target;

  return (
    <div className="group relative">
      <button
        onClick={onToggle}
        className={cn(
          'relative flex h-32 w-28 flex-shrink-0 flex-col items-center justify-center gap-3 rounded-xl transition-all',
          colorClasses
        )}
      >
        <IconComponent className="h-8 w-8" />
        <span className="text-sm font-semibold">{habit.name}</span>
        {habit.completedToday && (
          <div className="absolute right-2 top-2">
            <Check className="h-4 w-4" />
          </div>
        )}
        {habit.currentStreak > 0 && (
          <div className="absolute bottom-2 right-2 text-xs opacity-75">{habit.currentStreak}d</div>
        )}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground group-hover:flex"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
