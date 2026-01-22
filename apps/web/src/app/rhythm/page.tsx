'use client';

import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/app-layout';
import { HabitTracker } from '@/components/rhythm/habit-tracker';
import { DailyJournal } from '@/components/rhythm/daily-journal';
import { useJournalStreak } from '@/hooks/use-journal';
import { useTodayHabits } from '@/hooks/use-habits';
import { Flame, BookOpen } from 'lucide-react';

export default function RhythmPage() {
  const today = new Date();
  const { data: habitsData } = useTodayHabits();
  const { data: streak } = useJournalStreak();

  // Ensure habits is always an array (handle null/undefined)
  const habits = Array.isArray(habitsData) ? habitsData : [];
  const completedHabits = habits.filter((h) => h.completedToday).length;
  const totalHabits = habits.length;
  const progressPercent = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

  return (
    <AppLayout title="Daily Rhythm">
      <div className="container max-w-4xl px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold md:text-3xl">Today&apos;s Rhythm</h1>
          <p className="mt-1 text-muted-foreground">{format(today, 'EEEE, MMMM d, yyyy')}</p>
        </div>

        {/* Stats Row */}
        <div className="mb-6 flex items-center gap-6">
          {streak && streak.currentStreak > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="font-medium">{streak.currentStreak} day streak</span>
            </div>
          )}
          {totalHabits > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {completedHabits}/{totalHabits} habits
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {totalHabits > 0 && (
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium uppercase tracking-wider text-muted-foreground">
                Daily Goals
              </span>
              <span className="font-bold text-primary">
                {completedHabits}/{totalHabits} Complete
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Habit Tracker */}
        <div className="mb-8">
          <HabitTracker />
        </div>

        {/* Daily Journal */}
        <DailyJournal />
      </div>
    </AppLayout>
  );
}
