'use client';

import { format } from 'date-fns';
import { useTodayHabits, useToggleHabitLog, useDeleteHabit } from '@/hooks/use-habits';
import { Card, CardContent } from '@/components/ui/card';
import { AddHabitModal } from '@/components/habits/add-habit-modal';
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
  const deleteHabit = useDeleteHabit();

  const today = format(new Date(), 'yyyy-MM-dd');

  const handleToggle = (habitId: string) => {
    toggleLog.mutate({ habitId, date: today });
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
          <AddHabitModal
            trigger={
              <button className="flex h-32 w-28 flex-shrink-0 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card/50 text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground">
                <Plus className="h-8 w-8" />
                <span className="text-sm font-medium">Add</span>
              </button>
            }
          />
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
