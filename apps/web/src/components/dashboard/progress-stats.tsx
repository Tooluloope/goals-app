'use client';

import { useMemo } from 'react';
import { format, subDays, eachDayOfInterval, startOfDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHabits } from '@/hooks/use-habits';
import { useJournalStreak } from '@/hooks/use-journal';
import { useWeeklyReviewStats } from '@/hooks/use-reviews';
import { cn } from '@/lib/utils';
import { TrendingUp, Flame, BookOpen, Target, Calendar, CheckCircle2, Loader2 } from 'lucide-react';

export function ProgressStats() {
  const { data: habitsData, isLoading: habitsLoading } = useHabits();
  const { data: journalStreak, isLoading: journalLoading } = useJournalStreak();
  const { data: weeklyStats, isLoading: weeklyLoading } = useWeeklyReviewStats();

  const habits = useMemo(() => (Array.isArray(habitsData) ? habitsData : []), [habitsData]);

  // Calculate habit stats
  const habitStats = useMemo(() => {
    if (habits.length === 0) {
      return {
        todayCompleted: 0,
        todayTotal: 0,
        avgCompletionRate: 0,
        currentStreak: 0,
        weeklyData: [],
      };
    }

    const todayCompleted = habits.filter((h) => h.completedToday).length;
    const todayTotal = habits.length;
    const avgCompletionRate = Math.round(
      habits.reduce((sum, h) => sum + (h.completionRate || 0), 0) / habits.length
    );
    const currentStreak = Math.max(...habits.map((h) => h.currentStreak || 0));

    // Calculate weekly data for chart
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    const weeklyData = last7Days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayStart = startOfDay(day);

      let completed = 0;
      habits.forEach((habit) => {
        const logs = habit.logs || [];
        const hasLog = logs.some(
          (log) => log.completed && startOfDay(new Date(log.date)).getTime() === dayStart.getTime()
        );
        if (hasLog) completed++;
      });

      return {
        day: format(day, 'EEE'),
        date: dateStr,
        completed,
        total: habits.length,
        percentage: habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0,
      };
    });

    return {
      todayCompleted,
      todayTotal,
      avgCompletionRate,
      currentStreak,
      weeklyData,
    };
  }, [habits]);

  // Only block on essential data (habits/journal), let weekly stats load independently
  const isLoading = habitsLoading || journalLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {/* Today's Habits */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {habitStats.todayCompleted}/{habitStats.todayTotal}
                </p>
                <p className="text-xs text-muted-foreground">Today's Habits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Habit Streak */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-orange-500/10 p-2">
                <Flame className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{habitStats.currentStreak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Journal Streak */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-blue-500/10 p-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{journalStreak?.currentStreak || 0}</p>
                <p className="text-xs text-muted-foreground">Journal Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Reviews - loads independently */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-green-500/10 p-2">
                <Calendar className="h-4 w-4 text-green-500" />
              </div>
              <div>
                {weeklyLoading ? (
                  <>
                    <div className="h-8 w-8 animate-pulse rounded bg-muted" />
                    <p className="text-xs text-muted-foreground">Review Streak</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold">{weeklyStats?.currentStreak || 0}</p>
                    <p className="text-xs text-muted-foreground">Review Streak</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress Chart */}
      {habits.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Weekly Habit Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-32">
              {habitStats.weeklyData.map((day, index) => (
                <div key={day.date} className="flex flex-col items-center gap-1 flex-1">
                  {/* Bar */}
                  <div className="w-full flex flex-col items-center justify-end h-20">
                    <div
                      className={cn(
                        'w-full max-w-8 rounded-t-sm transition-all',
                        day.percentage > 0 ? 'bg-primary' : 'bg-muted'
                      )}
                      style={{ height: `${Math.max(day.percentage, 4)}%` }}
                    />
                  </div>
                  {/* Percentage */}
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {day.percentage}%
                  </span>
                  {/* Day label */}
                  <span
                    className={cn(
                      'text-xs',
                      index === habitStats.weeklyData.length - 1
                        ? 'font-semibold text-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    {day.day}
                  </span>
                </div>
              ))}
            </div>

            {/* Average indicator */}
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">7-day average</span>
              <span className="font-semibold">
                {Math.round(
                  habitStats.weeklyData.reduce((sum, d) => sum + d.percentage, 0) /
                    habitStats.weeklyData.length
                )}
                %
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {habits.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Target className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">No habits tracked yet</p>
            <p className="text-sm text-muted-foreground/70">Add habits to see your progress here</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
