'use client';

import { useState, useMemo } from 'react';
import { isToday, parseISO, getDay, startOfWeek, addDays, format, isSameDay } from 'date-fns';
import {
  useTodayHabits,
  useHabitsForDate,
  useToggleHabitLog,
  useDeleteHabit,
} from '@/hooks/use-habits';
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
  Flame,
} from 'lucide-react';
import type { HabitWithStats, HabitFrequency, HabitLog } from '@goals/shared';

const WEEKDAY_ABBREV = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Helper to format frequency label
function getFrequencyLabel(frequency: HabitFrequency, frequencyDays: number[]): string {
  switch (frequency) {
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    case 'specific_days':
      if (frequencyDays.length === 0) return 'Daily';
      if (frequencyDays.length === 7) return 'Daily';
      if (frequencyDays.length === 5 && !frequencyDays.includes(0) && !frequencyDays.includes(6)) {
        return 'Weekdays';
      }
      if (frequencyDays.length === 2 && frequencyDays.includes(0) && frequencyDays.includes(6)) {
        return 'Weekends';
      }
      return frequencyDays.map((d) => WEEKDAY_FULL[d]).join('/');
    default:
      return 'Daily';
  }
}

// Helper to check if a date is an expected day for a habit
function isExpectedDay(
  dateStr: string,
  frequency: HabitFrequency,
  frequencyDays: number[]
): boolean {
  const date = parseISO(dateStr);
  const dayOfWeek = getDay(date);

  switch (frequency) {
    case 'daily':
      return true;
    case 'weekly':
      return true; // Weekly habits can be completed any day
    case 'specific_days':
      return frequencyDays.length === 0 || frequencyDays.includes(dayOfWeek);
    default:
      return true;
  }
}

// Helper to get streak unit based on frequency
function getStreakUnit(frequency: HabitFrequency): string {
  switch (frequency) {
    case 'weekly':
      return 'w';
    default:
      return 'd';
  }
}

// Helper to get this week's days and check completion status
function getWeekDaysStatus(
  selectedDate: string,
  frequencyDays: number[],
  logs: HabitLog[] = []
): {
  dayIndex: number;
  date: Date;
  isScheduled: boolean;
  isCompleted: boolean;
  isToday: boolean;
}[] {
  const selected = parseISO(selectedDate);
  const weekStart = startOfWeek(selected, { weekStartsOn: 0 }); // Sunday

  const completedDates = new Set(
    logs.filter((log) => log.completed).map((log) => format(new Date(log.date), 'yyyy-MM-dd'))
  );

  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    return {
      dayIndex: i,
      date,
      isScheduled: frequencyDays.length === 0 || frequencyDays.includes(i),
      isCompleted: completedDates.has(dateStr),
      isToday: isSameDay(date, selected),
    };
  });
}

// Helper to check if weekly habit is done this week
function isWeeklyDone(logs: HabitLog[] = [], selectedDate: string): boolean {
  const selected = parseISO(selectedDate);
  const weekStart = startOfWeek(selected, { weekStartsOn: 0 });
  const weekEnd = addDays(weekStart, 6);

  return logs.some((log) => {
    if (!log.completed) return false;
    const logDate = new Date(log.date);
    return logDate >= weekStart && logDate <= weekEnd;
  });
}

interface HabitTrackerProps {
  selectedDate: string; // 'yyyy-MM-dd' format
}

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

export function HabitTracker({ selectedDate }: HabitTrackerProps) {
  // Use date-specific habits if viewing a past date, otherwise use today's optimized query
  const isViewingToday = isToday(parseISO(selectedDate));
  const { data: todayData, isLoading: todayLoading } = useTodayHabits();
  const { data: dateData, isLoading: dateLoading } = useHabitsForDate(selectedDate);

  // Use today's data if viewing today (has optimistic updates), otherwise use date-specific data
  const habitsData = isViewingToday ? todayData : dateData;
  const isLoading = isViewingToday ? todayLoading : dateLoading;

  // Ensure habits is always an array (handle null/undefined)
  const habits = Array.isArray(habitsData) ? habitsData : [];
  const toggleLog = useToggleHabitLog();
  const deleteHabit = useDeleteHabit();

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = (habitId: string) => {
    // Only allow toggling for today's habits
    if (!isViewingToday) return;
    // Prevent double-toggling while a mutation is in progress for this habit
    if (togglingId === habitId) return;
    setTogglingId(habitId);
    toggleLog.mutate(
      { habitId, date: selectedDate },
      {
        onSettled: () => setTogglingId(null),
      }
    );
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
      {/* Habit Cards - Responsive Grid on desktop, Horizontal Scroll on mobile */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent sm:overflow-x-visible">
        <div className="flex gap-3 min-w-min sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:min-w-0">
          {habits.map((habit) => {
            const isExpected = isExpectedDay(
              selectedDate,
              habit.frequency as HabitFrequency,
              habit.frequencyDays
            );
            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                selectedDate={selectedDate}
                onToggle={() => handleToggle(habit.id)}
                onDelete={() => handleDeleteHabit(habit.id)}
                colorClasses={getColorClasses(habit.color, habit.completedToday)}
                isToggling={togglingId === habit.id}
                isReadOnly={!isViewingToday}
                isExpectedToday={isExpected}
              />
            );
          })}

          {/* Add Habit Button - Only show when viewing today */}
          {isViewingToday && (
            <AddHabitModal
              trigger={
                <button className="flex h-28 w-24 sm:h-28 sm:w-full flex-shrink-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card/50 text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground">
                  <Plus className="h-7 w-7" />
                  <span className="text-xs font-medium">Add</span>
                </button>
              }
            />
          )}
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
  selectedDate,
  onToggle,
  onDelete,
  colorClasses,
  isToggling,
  isReadOnly,
  isExpectedToday,
}: {
  habit: HabitWithStats;
  selectedDate: string;
  onToggle: () => void;
  onDelete: () => void;
  colorClasses: string;
  isToggling: boolean;
  isReadOnly: boolean;
  isExpectedToday: boolean;
}) {
  const IconComponent = HABIT_ICONS[habit.icon] || Target;
  const frequency = habit.frequency as HabitFrequency;
  const streakUnit = getStreakUnit(frequency);
  const isNotExpected = !isExpectedToday && !habit.completedToday;

  // Calculate week status for specific_days habits
  const weekDays = useMemo(
    () =>
      frequency === 'specific_days'
        ? getWeekDaysStatus(selectedDate, habit.frequencyDays, habit.logs)
        : [],
    [frequency, selectedDate, habit.frequencyDays, habit.logs]
  );

  // For specific_days: count completed vs scheduled this week
  const scheduledThisWeek = weekDays.filter((d) => d.isScheduled).length;
  const completedThisWeek = weekDays.filter((d) => d.isScheduled && d.isCompleted).length;

  // For weekly habits: check if done this week
  const weeklyDone = frequency === 'weekly' ? isWeeklyDone(habit.logs, selectedDate) : false;

  // Render different card based on frequency
  if (frequency === 'specific_days' && habit.frequencyDays.length > 0) {
    return (
      <SpecificDaysCard
        habit={habit}
        weekDays={weekDays}
        completedThisWeek={completedThisWeek}
        scheduledThisWeek={scheduledThisWeek}
        streakUnit={streakUnit}
        onToggle={onToggle}
        onDelete={onDelete}
        colorClasses={colorClasses}
        isToggling={isToggling}
        isReadOnly={isReadOnly}
        isExpectedToday={isExpectedToday}
      />
    );
  }

  if (frequency === 'weekly') {
    return (
      <WeeklyCard
        habit={habit}
        weeklyDone={weeklyDone}
        streakUnit={streakUnit}
        onToggle={onToggle}
        onDelete={onDelete}
        colorClasses={colorClasses}
        isToggling={isToggling}
        isReadOnly={isReadOnly}
      />
    );
  }

  // Daily habit card (default)
  return (
    <div className="group relative flex-shrink-0 sm:flex-shrink">
      <button
        onClick={onToggle}
        disabled={isToggling || isReadOnly}
        className={cn(
          'relative flex h-28 w-24 sm:h-28 sm:w-full flex-col items-center justify-center gap-2 rounded-xl transition-all',
          !isReadOnly && 'active:scale-95 touch-manipulation',
          colorClasses,
          isToggling && 'opacity-70 scale-95',
          isReadOnly && 'cursor-default',
          isNotExpected && 'opacity-50'
        )}
      >
        <div className="relative">
          {isToggling ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : (
            <>
              <IconComponent className="h-7 w-7" />
              {habit.completedToday && (
                <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-green-600 shadow-sm">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </div>
              )}
            </>
          )}
        </div>
        <span className="text-xs font-semibold max-w-full truncate px-1">{habit.name}</span>

        {/* Streak indicator with flame */}
        {habit.currentStreak > 0 && !isToggling && (
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 text-[10px] opacity-75">
            <Flame className="h-3 w-3" />
            {habit.currentStreak}
            {streakUnit}
          </div>
        )}
      </button>
      {!isReadOnly && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-70 transition-opacity hover:opacity-100 md:hidden md:group-hover:flex md:opacity-100"
        >
          <Trash2 className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

// Card for specific_days frequency with 7-day chip row
function SpecificDaysCard({
  habit,
  weekDays,
  completedThisWeek,
  scheduledThisWeek,
  streakUnit,
  onToggle,
  onDelete,
  colorClasses,
  isToggling,
  isReadOnly,
  isExpectedToday,
}: {
  habit: HabitWithStats;
  weekDays: ReturnType<typeof getWeekDaysStatus>;
  completedThisWeek: number;
  scheduledThisWeek: number;
  streakUnit: string;
  onToggle: () => void;
  onDelete: () => void;
  colorClasses: string;
  isToggling: boolean;
  isReadOnly: boolean;
  isExpectedToday: boolean;
}) {
  const IconComponent = HABIT_ICONS[habit.icon] || Target;
  const isNotExpected = !isExpectedToday && !habit.completedToday;
  const allDone = completedThisWeek >= scheduledThisWeek;

  return (
    <div className="group relative flex-shrink-0 sm:flex-shrink">
      <button
        onClick={onToggle}
        disabled={isToggling || isReadOnly}
        className={cn(
          'relative flex h-32 w-28 sm:h-32 sm:w-full flex-col items-center justify-between gap-1 rounded-xl p-2 transition-all',
          !isReadOnly && 'active:scale-95 touch-manipulation',
          colorClasses,
          isToggling && 'opacity-70 scale-95',
          isReadOnly && 'cursor-default',
          isNotExpected && 'opacity-50'
        )}
      >
        {/* Icon and name */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative">
            {isToggling ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <IconComponent className="h-6 w-6" />
                {habit.completedToday && (
                  <div className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/90 text-green-600 shadow-sm">
                    <Check className="h-2 w-2" strokeWidth={3} />
                  </div>
                )}
              </>
            )}
          </div>
          <span className="text-[10px] font-semibold max-w-full truncate">{habit.name}</span>
        </div>

        {/* Week progress text */}
        <div className="text-[9px] opacity-80 font-medium">
          {allDone ? '✓ Done' : `${completedThisWeek}/${scheduledThisWeek}`}
        </div>

        {/* 7-day chip row */}
        <div className="flex gap-0.5">
          {weekDays.map((day) => (
            <div
              key={day.dayIndex}
              className={cn(
                'flex h-4 w-4 items-center justify-center rounded text-[8px] font-medium',
                day.isToday && 'ring-1 ring-white/50',
                !day.isScheduled && 'opacity-30',
                day.isScheduled && day.isCompleted && 'bg-white/30',
                day.isScheduled && !day.isCompleted && 'bg-black/10'
              )}
            >
              {day.isCompleted ? (
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              ) : (
                WEEKDAY_ABBREV[day.dayIndex]
              )}
            </div>
          ))}
        </div>

        {/* Streak indicator */}
        {habit.currentStreak > 0 && !isToggling && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 text-[9px] opacity-75">
            <Flame className="h-2.5 w-2.5" />
            {habit.currentStreak}
            {streakUnit}
          </div>
        )}
      </button>
      {!isReadOnly && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-70 transition-opacity hover:opacity-100 md:hidden md:group-hover:flex md:opacity-100"
        >
          <Trash2 className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

// Card for weekly frequency
function WeeklyCard({
  habit,
  weeklyDone,
  streakUnit,
  onToggle,
  onDelete,
  colorClasses,
  isToggling,
  isReadOnly,
}: {
  habit: HabitWithStats;
  weeklyDone: boolean;
  streakUnit: string;
  onToggle: () => void;
  onDelete: () => void;
  colorClasses: string;
  isToggling: boolean;
  isReadOnly: boolean;
}) {
  const IconComponent = HABIT_ICONS[habit.icon] || Target;

  return (
    <div className="group relative flex-shrink-0 sm:flex-shrink">
      <button
        onClick={onToggle}
        disabled={isToggling || isReadOnly}
        className={cn(
          'relative flex h-28 w-24 sm:h-28 sm:w-full flex-col items-center justify-center gap-1.5 rounded-xl transition-all',
          !isReadOnly && 'active:scale-95 touch-manipulation',
          colorClasses,
          isToggling && 'opacity-70 scale-95',
          isReadOnly && 'cursor-default'
        )}
      >
        {/* Weekly badge */}
        <div className="absolute top-1.5 left-1.5 text-[8px] opacity-70 font-semibold px-1 py-0.5 rounded bg-black/10">
          Weekly
        </div>

        <div className="relative">
          {isToggling ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : (
            <>
              <IconComponent className="h-7 w-7" />
              {habit.completedToday && (
                <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/90 text-green-600 shadow-sm">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </div>
              )}
            </>
          )}
        </div>
        <span className="text-xs font-semibold max-w-full truncate px-1">{habit.name}</span>

        {/* Week status */}
        <div className="text-[9px] font-medium opacity-80">
          {weeklyDone ? '✓ This week' : 'Not yet'}
        </div>

        {/* Streak indicator */}
        {habit.currentStreak > 0 && !isToggling && (
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 text-[10px] opacity-75">
            <Flame className="h-3 w-3" />
            {habit.currentStreak}
            {streakUnit}
          </div>
        )}
      </button>
      {!isReadOnly && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-70 transition-opacity hover:opacity-100 md:hidden md:group-hover:flex md:opacity-100"
        >
          <Trash2 className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}
