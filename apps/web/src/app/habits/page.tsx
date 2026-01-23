'use client';

import { useState, useMemo, useEffect } from 'react';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { AppLayout } from '@/components/layout/app-layout';
import { useHabits, useToggleHabitLog, useDeleteHabit } from '@/hooks/use-habits';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddHabitModal } from '@/components/habits/add-habit-modal';
import { cn } from '@/lib/utils';
import {
  Plus,
  TrendingUp,
  Flame,
  Target,
  BookOpen,
  Dumbbell,
  Droplets,
  Brain,
  Moon,
  Heart,
  Pencil,
  Coffee,
  Music,
  Trash2,
  Loader2,
  Check,
  BarChart3,
  Calendar,
  ChevronRight,
  Clock,
  Repeat,
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
  { name: 'primary', class: 'bg-primary', text: 'text-primary', hover: 'hover:bg-primary/80' },
  { name: 'blue', class: 'bg-blue-500', text: 'text-blue-500', hover: 'hover:bg-blue-400' },
  { name: 'green', class: 'bg-green-500', text: 'text-green-500', hover: 'hover:bg-green-400' },
  { name: 'orange', class: 'bg-orange-500', text: 'text-orange-500', hover: 'hover:bg-orange-400' },
  { name: 'pink', class: 'bg-pink-500', text: 'text-pink-500', hover: 'hover:bg-pink-400' },
  { name: 'purple', class: 'bg-purple-500', text: 'text-purple-500', hover: 'hover:bg-purple-400' },
];

function getColorClass(colorName: string) {
  return COLOR_OPTIONS.find((c) => c.name === colorName) || COLOR_OPTIONS[0];
}

export default function HabitManagerPage() {
  const { data: habitsData, isLoading } = useHabits();
  const habits = Array.isArray(habitsData) ? habitsData : [];
  const deleteHabit = useDeleteHabit();
  const toggleLog = useToggleHabitLog();

  // Store only the ID, derive the habit from the array to stay in sync with cache updates
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const selectedHabit = useMemo(
    () => habits.find((h) => h.id === selectedHabitId) || null,
    [habits, selectedHabitId]
  );

  // Auto-select first habit when habits load and none is selected
  useEffect(() => {
    if (habits.length > 0 && !selectedHabitId) {
      setSelectedHabitId(habits[0].id);
    }
  }, [habits, selectedHabitId]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    if (habits.length === 0) {
      return { avgCompletionRate: 0, bestStreak: 0, activeHabits: 0 };
    }

    const avgCompletionRate = Math.round(
      habits.reduce((sum, h) => sum + (h.completionRate || 0), 0) / habits.length
    );
    const bestStreak = Math.max(...habits.map((h) => h.longestStreak || 0));
    const activeHabits = habits.filter((h) => !h.isArchived).length;

    return { avgCompletionRate, bestStreak, activeHabits };
  }, [habits]);

  const handleDeleteHabit = (habitId: string) => {
    if (confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
      deleteHabit.mutate(habitId);
      if (selectedHabitId === habitId) {
        setSelectedHabitId(null);
      }
    }
  };

  const handleToggle = (habitId: string, date: string) => {
    toggleLog.mutate({ habitId, date });
  };

  if (isLoading) {
    return (
      <AppLayout title="Habit Manager">
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Habit Manager">
      <div className="container max-w-6xl px-4 py-6 md:py-8 overflow-x-hidden">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Habit Manager</h1>
            <p className="mt-1 text-muted-foreground">Track your habits and build consistency</p>
          </div>
          <AddHabitModal />
        </div>

        {/* Quick Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-green-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{overallStats.avgCompletionRate}%</p>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-orange-500/10 p-3">
                <Flame className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-3xl font-bold">{overallStats.bestStreak}</p>
                <p className="text-sm text-muted-foreground">Best Streak (days)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{overallStats.activeHabits}</p>
                <p className="text-sm text-muted-foreground">Active Habits</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Habits List */}
          <div className="space-y-4 lg:col-span-2">
            <h2 className="text-lg font-semibold">Your Habits</h2>
            {habits.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Target className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No habits yet</p>
                  <p className="text-sm text-muted-foreground/70">
                    Create your first habit to start tracking
                  </p>
                  <AddHabitModal
                    trigger={
                      <Button variant="outline" className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Habit
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {habits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    isSelected={selectedHabitId === habit.id}
                    onSelect={() => setSelectedHabitId(habit.id)}
                    onDelete={() => handleDeleteHabit(habit.id)}
                    onToggle={(date) => handleToggle(habit.id, date)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Habit Detail Panel */}
          <div className="lg:col-span-1">
            {selectedHabit ? (
              <HabitDetailPanel habit={selectedHabit} onToggle={handleToggle} />
            ) : (
              <Card className="sticky top-20">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <BarChart3 className="mb-4 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Select a habit to see details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function HabitCard({
  habit,
  isSelected,
  onSelect,
  onDelete,
  onToggle,
}: {
  habit: HabitWithStats;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggle: (date: string) => void;
}) {
  const IconComponent = HABIT_ICONS[habit.icon] || Target;
  const color = getColorClass(habit.color);
  const today = format(new Date(), 'yyyy-MM-dd');

  // Generate last 30 days for heatmap
  const last30Days = useMemo(() => {
    const end = startOfDay(new Date());
    const start = subDays(end, 29);
    return eachDayOfInterval({ start, end });
  }, []);

  // Create a map of completed dates
  const completedDates = useMemo(() => {
    const logs = habit.logs || [];
    const map = new Set<string>();
    logs.forEach((log) => {
      if (log.completed) {
        // Extract date part directly to avoid timezone issues
        // At runtime, dates from JSON are strings, so we cast and extract the date portion
        const dateValue = log.date as unknown as string | Date;
        const dateStr =
          typeof dateValue === 'string'
            ? dateValue.substring(0, 10)
            : format(dateValue, 'yyyy-MM-dd');
        map.add(dateStr);
      }
    });
    return map;
  }, [habit.logs]);

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all hover:shadow-md overflow-hidden',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={cn('rounded-lg p-2 shrink-0', `${color.class}/10`)}>
              <IconComponent className={cn('h-6 w-6', color.text)} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate">{habit.name}</h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  {habit.currentStreak}d streak
                </span>
                <span>{habit.completionRate}% rate</span>
                {habit.frequency !== 'daily' && (
                  <span className="flex items-center gap-1">
                    <Repeat className="h-3 w-3" />
                    {habit.frequency === 'weekly' ? 'Weekly' : 'Custom'}
                  </span>
                )}
                {habit.reminderEnabled && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {habit.reminderTime}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle(today);
              }}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full transition-all',
                habit.completedToday
                  ? `${color.class} text-white`
                  : 'border-2 border-border hover:border-primary/50'
              )}
            >
              {habit.completedToday && <Check className="h-4 w-4" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive',
                isSelected ? 'opacity-100' : 'md:opacity-0 md:group-hover:opacity-100'
              )}
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Mini Heatmap */}
        <div className="mt-4 overflow-hidden">
          <div className="flex gap-px">
            {last30Days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isCompleted = completedDates.has(dateStr);
              const isToday = dateStr === today;

              return (
                <div
                  key={dateStr}
                  className={cn(
                    'h-3 min-w-0 flex-1 rounded-sm transition-colors',
                    isCompleted ? color.class : 'bg-muted',
                    isToday && !isCompleted && 'ring-1 ring-inset ring-primary/50'
                  )}
                  title={`${format(day, 'MMM d')}: ${isCompleted ? 'Completed' : 'Not completed'}`}
                />
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HabitDetailPanel({
  habit,
  onToggle,
}: {
  habit: HabitWithStats;
  onToggle: (habitId: string, date: string) => void;
}) {
  const IconComponent = HABIT_ICONS[habit.icon] || Target;
  const color = getColorClass(habit.color);

  // Generate last 30 days
  const last30Days = useMemo(() => {
    const end = startOfDay(new Date());
    const start = subDays(end, 29);
    return eachDayOfInterval({ start, end });
  }, []);

  // Create a map of completed dates
  const completedDates = useMemo(() => {
    const logs = habit.logs || [];
    const map = new Set<string>();
    logs.forEach((log) => {
      if (log.completed) {
        // Extract date part directly to avoid timezone issues
        // At runtime, dates from JSON are strings, so we cast and extract the date portion
        const dateValue = log.date as unknown as string | Date;
        const dateStr =
          typeof dateValue === 'string'
            ? dateValue.substring(0, 10)
            : format(dateValue, 'yyyy-MM-dd');
        map.add(dateStr);
      }
    });
    return map;
  }, [habit.logs]);

  // Group days by week for calendar view
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    let currentWeek: Date[] = [];

    last30Days.forEach((day) => {
      currentWeek.push(day);
      if (day.getDay() === 6) {
        // Saturday
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [last30Days]);

  return (
    <Card className="sticky top-20 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn('rounded-lg p-3 shrink-0', `${color.class}/10`)}>
            <IconComponent className={cn('h-8 w-8', color.text)} />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{habit.name}</CardTitle>
            <CardDescription>Habit performance</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 overflow-hidden">
        {/* Habit Settings */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs">
            <Repeat className="h-3 w-3" />
            {habit.frequency === 'daily'
              ? 'Daily'
              : habit.frequency === 'weekly'
                ? 'Weekly'
                : `${habit.frequencyDays?.length || 0} days/week`}
          </div>
          {habit.reminderEnabled && habit.reminderTime && (
            <div className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs">
              <Clock className="h-3 w-3" />
              {habit.reminderTime}
            </div>
          )}
          {habit.goalArea && (
            <div className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
              {habit.goalArea}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold">{habit.currentStreak}</p>
            <p className="text-xs text-muted-foreground">Current Streak</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold">{habit.longestStreak}</p>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold">{habit.completionRate}%</p>
            <p className="text-xs text-muted-foreground">30-Day Rate</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold">{completedDates.size}</p>
            <p className="text-xs text-muted-foreground">Days Completed</p>
          </div>
        </div>

        {/* Calendar View */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            Last 30 Days
          </h4>
          <div className="space-y-1">
            {/* Day labels */}
            <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
              <span>S</span>
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
            </div>
            {/* Calendar grid */}
            <div className="space-y-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1">
                  {/* Add empty cells for days before the week starts */}
                  {weekIndex === 0 &&
                    Array(week[0].getDay())
                      .fill(null)
                      .map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
                  {week.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isCompleted = completedDates.has(dateStr);
                    const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

                    return (
                      <button
                        key={dateStr}
                        onClick={() => onToggle(habit.id, dateStr)}
                        className={cn(
                          'aspect-square rounded-md text-xs font-medium transition-all hover:scale-110',
                          isCompleted ? `${color.class} text-white` : 'bg-muted hover:bg-muted/80',
                          isToday && !isCompleted && 'ring-2 ring-primary/50'
                        )}
                        title={`${format(day, 'MMM d')}: ${isCompleted ? 'Completed' : 'Not completed'}`}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className={cn('h-3 w-3 rounded', color.class)} />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-muted" />
            <span>Not completed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
