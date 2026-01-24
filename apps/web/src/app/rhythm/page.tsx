'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDays, format, isFuture, isToday, parseISO, subDays } from 'date-fns';
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, Flame, Sparkles } from 'lucide-react';

import { AppLayout } from '@/components/layout/app-layout';
import { DailyJournalRhythm2 } from '@/components/rhythm/daily-journal-rhythm2';
import { HabitTracker } from '@/components/rhythm/habit-tracker';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useJournalStreak } from '@/hooks/use-journal';
import { useHabitsForDate, useTodayHabits } from '@/hooks/use-habits';
import { useDailyText } from '@/hooks/use-ai';

export default function Rhythm2Page() {
  const router = useRouter();
  const { currentWorkspace } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Redirect to Family Hub if in family workspace (this is a personal-only page)
  useEffect(() => {
    if (currentWorkspace?.type === 'family') {
      router.replace('/family');
    }
  }, [currentWorkspace, router]);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const isViewingToday = isToday(selectedDate);

  const { data: habitsData } = useHabitsForDate(selectedDateStr);
  const { data: todayHabitsData } = useTodayHabits();
  const { data: streak } = useJournalStreak();
  const { data: dailyText, isLoading: isDailyTextLoading } = useDailyText();

  const habits = Array.isArray(habitsData) ? habitsData : [];
  const todayHabits = Array.isArray(todayHabitsData) ? todayHabitsData : [];
  const displayHabits = isViewingToday ? todayHabits : habits;

  const completedHabits = displayHabits.filter((h) => h.completedToday).length;
  const totalHabits = displayHabits.length;
  const progressPercent = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => {
    const nextDay = addDays(selectedDate, 1);
    if (!isFuture(nextDay)) setSelectedDate(nextDay);
  };
  const goToToday = () => setSelectedDate(new Date());

  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    for (let i = -3; i <= 3; i++) {
      dates.push(addDays(selectedDate, i));
    }
    return dates;
  }, [selectedDate]);

  const progressRingStyle = {
    background: `conic-gradient(hsl(var(--primary)) ${progressPercent}%, hsl(var(--muted)) 0)`,
  };

  return (
    <AppLayout title="Rhythm">
      <div className="relative overflow-hidden animate-fade-in">
        <div className="pointer-events-none absolute -left-32 top-10 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 -top-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="container max-w-6xl px-4 py-5 sm:py-6 md:py-10">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6">
            <section className="order-2 space-y-6 lg:order-1">
              <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-background via-background to-muted/40 p-4 shadow-sm sm:p-6 md:p-8 animate-slide-up">
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      Rhythm Check-in
                    </div>
                    <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
                      {isViewingToday ? "Today's Flow" : 'Daily Rhythm'}
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={goToPreviousDay}
                      className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>

                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'min-w-[100px] sm:min-w-[132px] justify-center gap-2 border-border bg-background/80 font-medium',
                            isViewingToday &&
                              'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15'
                          )}
                        >
                          <CalendarDays className="h-4 w-4" />
                          {isViewingToday ? 'Today' : format(selectedDate, 'MMM d')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <div className="space-y-4 p-4">
                          <div className="flex gap-2">
                            <Button
                              variant={isViewingToday ? 'default' : 'outline'}
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                goToToday();
                                setCalendarOpen(false);
                              }}
                            >
                              Today
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                setSelectedDate(subDays(new Date(), 1));
                                setCalendarOpen(false);
                              }}
                            >
                              Yesterday
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              This Week
                            </p>
                            <div className="grid grid-cols-7 gap-1">
                              {weekDates.map((date) => {
                                const dateStr = format(date, 'yyyy-MM-dd');
                                const isSelected = dateStr === selectedDateStr;
                                const isDateToday = isToday(date);
                                const isFutureDate = isFuture(date);

                                return (
                                  <button
                                    key={dateStr}
                                    onClick={() => {
                                      if (!isFutureDate) {
                                        setSelectedDate(date);
                                        setCalendarOpen(false);
                                      }
                                    }}
                                    disabled={isFutureDate}
                                    className={cn(
                                      'flex flex-col items-center justify-center rounded-xl p-2 text-sm transition-colors',
                                      isSelected && 'bg-primary text-primary-foreground',
                                      !isSelected && isDateToday && 'bg-primary/10 font-semibold',
                                      !isSelected &&
                                        !isDateToday &&
                                        !isFutureDate &&
                                        'hover:bg-muted',
                                      isFutureDate && 'cursor-not-allowed opacity-40'
                                    )}
                                  >
                                    <span className="text-[10px] uppercase">
                                      {format(date, 'EEE')}
                                    </span>
                                    <span className="text-lg font-semibold">
                                      {format(date, 'd')}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Jump to Date
                            </p>
                            <input
                              type="date"
                              value={selectedDateStr}
                              max={format(new Date(), 'yyyy-MM-dd')}
                              onChange={(e) => {
                                const date = parseISO(e.target.value);
                                if (!isNaN(date.getTime()) && !isFuture(date)) {
                                  setSelectedDate(date);
                                  setCalendarOpen(false);
                                }
                              }}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={goToNextDay}
                      disabled={isViewingToday}
                      className="h-9 w-9 sm:h-10 sm:w-10 shrink-0"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3">
                  {streak && streak.currentStreak > 0 && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-600">
                      <Flame className="h-4 w-4" />
                      {streak.currentStreak} day streak
                    </div>
                  )}
                  {totalHabits > 0 && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <BookOpen className="h-4 w-4" />
                      {completedHabits}/{totalHabits} habits complete
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border bg-card p-4 shadow-sm sm:p-5 md:p-6 animate-slide-up">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Daily Momentum
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">Habit Pulse</h2>
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {progressPercent.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="mt-5">
                  <HabitTracker selectedDate={selectedDateStr} />
                </div>
              </div>

              <div className="animate-slide-up">
                <DailyJournalRhythm2 selectedDate={selectedDateStr} />
              </div>
            </section>

            <aside className="order-1 space-y-5 sm:space-y-6 lg:order-2">
              <div className="rounded-3xl border bg-card p-4 shadow-sm sm:p-6 animate-slide-up">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Today at a glance
                </p>
                <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
                  <div
                    className="relative flex h-28 w-28 items-center justify-center rounded-full self-center sm:self-auto"
                    style={progressRingStyle}
                  >
                    <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-background">
                      <span className="text-xl font-semibold">{completedHabits}</span>
                      <span className="text-[11px] uppercase text-muted-foreground">
                        of {totalHabits}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Habit completion</p>
                    <p className="text-xs text-muted-foreground">
                      {isViewingToday
                        ? "Stay steady with today's rhythm."
                        : 'Review how that day went.'}
                    </p>
                    <div className="text-xs font-semibold text-primary">
                      {progressPercent.toFixed(0)}% complete
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border bg-card p-4 shadow-sm sm:p-6 animate-slide-up">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Week rhythm
                </p>
                <div className="mt-4 grid grid-cols-7 gap-2">
                  {weekDates.map((date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const isSelected = dateStr === selectedDateStr;
                    const isDateToday = isToday(date);
                    const isFutureDate = isFuture(date);

                    return (
                      <button
                        key={`rail-${dateStr}`}
                        onClick={() => {
                          if (!isFutureDate) setSelectedDate(date);
                        }}
                        disabled={isFutureDate}
                        className={cn(
                          'flex flex-col items-center justify-center rounded-2xl border px-2 py-3 text-xs transition-all',
                          isSelected && 'border-primary bg-primary text-primary-foreground',
                          !isSelected && isDateToday && 'border-primary/40 bg-primary/10',
                          !isSelected && !isDateToday && !isFutureDate && 'hover:border-primary/40',
                          isFutureDate && 'cursor-not-allowed opacity-40'
                        )}
                      >
                        <span className="text-[10px] uppercase">{format(date, 'EEE')}</span>
                        <span className="text-base font-semibold">{format(date, 'd')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-background p-4 shadow-sm sm:p-6 animate-slide-up">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Daily Inspiration
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  {isDailyTextLoading ? (
                    <div className="space-y-2">
                      <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {dailyText?.text ||
                        'Every day is a fresh start. Make today count with small, consistent actions toward your goals.'}
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
