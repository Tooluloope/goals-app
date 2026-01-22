'use client';

import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjects } from '@/hooks/use-projects';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { getColorClasses } from '@/types/config';
import { Project, Task } from '@/types';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'task' | 'deadline';
  project: Project;
  task?: Task;
}

export default function CalendarPage() {
  const router = useRouter();
  const { data: projects, isLoading } = useProjects();
  const { selectedCalendarDate, setSelectedCalendarDate } = useUIStore();
  const { currentWorkspace } = useAuthStore();
  const { getTaskStatusesForWorkspace, getAreaById } = useConfigStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const taskStatuses = currentWorkspace ? getTaskStatusesForWorkspace(currentWorkspace.id) : [];
  const doneTaskStatusIds = taskStatuses.filter(s => s.name === 'Done').map(s => s.id);

  // Generate calendar events from projects
  const events = useMemo(() => {
    if (!projects) return [];

    const allEvents: CalendarEvent[] = [];

    projects.forEach((project) => {
      // Add project deadline
      allEvents.push({
        id: `deadline-${project.id}`,
        title: `${project.name} deadline`,
        date: project.targetDate,
        type: 'deadline',
        project,
      });

      // Add tasks with due dates
      project.tasks
        .filter((task) => task.dueDate && !doneTaskStatusIds.includes(task.statusId))
        .forEach((task) => {
          allEvents.push({
            id: `task-${task.id}`,
            title: task.title,
            date: task.dueDate!,
            type: 'task',
            project,
            task,
          });
        });
    });

    return allEvents;
  }, [projects, doneTaskStatusIds]);

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(parseISO(event.date), day));
  };

  // Get events for selected date
  const selectedDateEvents = getEventsForDay(selectedCalendarDate);

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (isLoading) {
    return (
      <AppLayout title="Calendar">
        <div className="p-4 space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Calendar">
      <div className="container max-w-4xl px-4 py-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {format(currentMonth, 'MMMM yyyy')}
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentMonth(new Date());
                setSelectedCalendarDate(new Date());
              }}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card className="mb-6">
          <CardContent className="p-4">
            {/* Week Days Header */}
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedCalendarDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedCalendarDate(day)}
                    className={cn(
                      'relative aspect-square p-1 rounded-lg text-sm transition-colors',
                      !isCurrentMonth && 'text-muted-foreground/50',
                      isToday && 'bg-primary/10 font-semibold',
                      isSelected && 'bg-primary text-primary-foreground',
                      !isSelected && 'hover:bg-muted'
                    )}
                  >
                    <span className="block">{format(day, 'd')}</span>
                    {/* Event Indicators */}
                    {dayEvents.length > 0 && (
                      <div className="flex justify-center gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map((event, i) => (
                          <span
                            key={i}
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              event.type === 'deadline'
                                ? 'bg-red-500'
                                : 'bg-blue-500',
                              isSelected && 'bg-primary-foreground'
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarIcon className="h-5 w-5" />
              {format(selectedCalendarDate, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No events on this day</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-3">
                  {selectedDateEvents.map((event) => {
                    const area = currentWorkspace ? getAreaById(currentWorkspace.id, event.project.areaId) : null;
                    const colors = area ? getColorClasses(area.color) : { bg: 'bg-slate-100', text: 'text-slate-700' };
                    return (
                      <button
                        key={event.id}
                        onClick={() => router.push(`/project/${event.project.id}`)}
                        className="w-full text-left rounded-xl border p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'mt-0.5 h-3 w-3 rounded-full shrink-0',
                              event.type === 'deadline'
                                ? 'bg-red-500'
                                : 'bg-blue-500'
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium leading-tight">
                              {event.title}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className={cn('text-xs', colors.bg, colors.text)}
                              >
                                {area?.name || 'Unknown'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {event.project.name}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant={
                              event.type === 'deadline' ? 'destructive' : 'secondary'
                            }
                            className="shrink-0"
                          >
                            {event.type === 'deadline' ? 'Deadline' : 'Task'}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
