'use client';

import { useState } from 'react';
import { format, isToday, addDays, subDays, isFuture, parseISO } from 'date-fns';
import { AppLayout } from '@/components/layout/app-layout';
import { HabitTracker } from '@/components/rhythm/habit-tracker';
import { DailyJournal } from '@/components/rhythm/daily-journal';
import { useJournalStreak } from '@/hooks/use-journal';
import { useHabitsForDate, useTodayHabits } from '@/hooks/use-habits';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Flame, BookOpen, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

export default function RhythmPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const isViewingToday = isToday(selectedDate);

  // Fetch habits for the selected date
  const { data: habitsData } = useHabitsForDate(selectedDateStr);
  const { data: todayHabitsData } = useTodayHabits();
  const { data: streak } = useJournalStreak();

  // Use the date-specific habits data
  const habits = Array.isArray(habitsData) ? habitsData : [];
  const todayHabits = Array.isArray(todayHabitsData) ? todayHabitsData : [];

  // For progress, use today's habits if viewing today, else selected date
  const displayHabits = isViewingToday ? todayHabits : habits;
  const completedHabits = displayHabits.filter((h) => h.completedToday).length;
  const totalHabits = displayHabits.length;
  const progressPercent = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

  // Navigation handlers
  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => {
    const nextDay = addDays(selectedDate, 1);
    if (!isFuture(nextDay)) setSelectedDate(nextDay);
  };
  const goToToday = () => setSelectedDate(new Date());

  // Generate dates for the mini calendar (current week)
  const generateWeekDates = () => {
    const dates: Date[] = [];
    // Show 7 days centered around selected date
    for (let i = -3; i <= 3; i++) {
      dates.push(addDays(selectedDate, i));
    }
    return dates;
  };

  const weekDates = generateWeekDates();

  return (
    <AppLayout title="Daily Rhythm">
      <div className="container max-w-4xl px-4 py-6 md:py-8">
        {/* Header with Date Picker */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              {isViewingToday ? "Today's Rhythm" : 'Daily Rhythm'}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          {/* Date Picker - Top Right */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousDay}
              className="h-9 w-9 shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'min-w-[120px] justify-center gap-2 font-medium',
                    isViewingToday && 'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                >
                  <CalendarDays className="h-4 w-4" />
                  {isViewingToday ? 'Today' : format(selectedDate, 'MMM d')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-4 space-y-4">
                  {/* Quick Actions */}
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

                  {/* Week View */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
                              'flex flex-col items-center justify-center rounded-lg p-2 text-sm transition-colors',
                              isSelected && 'bg-primary text-primary-foreground',
                              !isSelected && isDateToday && 'bg-primary/10 font-semibold',
                              !isSelected && !isDateToday && !isFutureDate && 'hover:bg-muted',
                              isFutureDate && 'opacity-40 cursor-not-allowed'
                            )}
                          >
                            <span className="text-[10px] uppercase">{format(date, 'EEE')}</span>
                            <span className="text-lg font-semibold">{format(date, 'd')}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Date Input */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
              className="h-9 w-9 shrink-0"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
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
          <HabitTracker selectedDate={selectedDateStr} />
        </div>

        {/* Daily Journal */}
        <DailyJournal selectedDate={selectedDateStr} />
      </div>
    </AppLayout>
  );
}
