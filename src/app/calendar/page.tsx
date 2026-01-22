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
  isToday,
  isBefore,
  isAfter,
  addDays,
  differenceInDays,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  Flag,
  ListTodo,
  Star,
  Sparkles,
} from 'lucide-react';
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
import { cn, isReviewDue } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type EventType = 'task' | 'deadline' | 'review' | 'start';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: EventType;
  project: Project;
  task?: Task;
  urgency?: 'normal' | 'warning' | 'critical';
}

const EVENT_COLORS: Record<EventType, { bg: string; bgDark: string; text: string; textDark: string; border: string; dot: string }> = {
  deadline: { bg: 'bg-red-100', bgDark: 'dark:bg-red-500/20', text: 'text-red-700', textDark: 'dark:text-red-300', border: 'border-red-500', dot: 'bg-red-500' },
  task: { bg: 'bg-blue-100', bgDark: 'dark:bg-blue-500/20', text: 'text-blue-700', textDark: 'dark:text-blue-300', border: 'border-blue-500', dot: 'bg-blue-500' },
  review: { bg: 'bg-amber-100', bgDark: 'dark:bg-amber-500/20', text: 'text-amber-700', textDark: 'dark:text-amber-300', border: 'border-amber-500', dot: 'bg-amber-500' },
  start: { bg: 'bg-green-100', bgDark: 'dark:bg-green-500/20', text: 'text-green-700', textDark: 'dark:text-green-300', border: 'border-green-500', dot: 'bg-green-500' },
};

export default function CalendarPage() {
  const router = useRouter();
  const { data: projects, isLoading } = useProjects();
  const { selectedCalendarDate, setSelectedCalendarDate, setAddProjectModalOpen, openAddTaskModal } = useUIStore();
  const { currentWorkspace } = useAuthStore();
  const { getTaskStatusesForWorkspace, getAreaById, getCadencesForWorkspace, getStatusesForWorkspace } = useConfigStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const taskStatuses = currentWorkspace ? getTaskStatusesForWorkspace(currentWorkspace.id) : [];
  const statuses = currentWorkspace ? getStatusesForWorkspace(currentWorkspace.id) : [];
  const cadences = currentWorkspace ? getCadencesForWorkspace(currentWorkspace.id) : [];
  const doneTaskStatusIds = taskStatuses.filter(s => s.name === 'Done').map(s => s.id);
  const activeStatusIds = statuses.filter(s => s.type === 'active').map(s => s.id);

  // Generate calendar events from projects
  const events = useMemo(() => {
    if (!projects) return [];

    const allEvents: CalendarEvent[] = [];
    const today = new Date();

    projects.forEach((project) => {
      // Only show events for active projects
      if (!activeStatusIds.includes(project.statusId)) return;

      // Add project deadline
      const deadlineDate = parseISO(project.targetDate);
      const daysUntilDeadline = differenceInDays(deadlineDate, today);
      allEvents.push({
        id: `deadline-${project.id}`,
        title: `${project.name} due`,
        date: project.targetDate,
        type: 'deadline',
        project,
        urgency: daysUntilDeadline <= 3 ? 'critical' : daysUntilDeadline <= 7 ? 'warning' : 'normal',
      });

      // Add project start date (if in future or recent past)
      const startDate = parseISO(project.startDate);
      if (differenceInDays(today, startDate) <= 30) {
        allEvents.push({
          id: `start-${project.id}`,
          title: `${project.name} starts`,
          date: project.startDate,
          type: 'start',
          project,
        });
      }

      // Add review due indicator (add to today if review is due)
      if (isReviewDue(project, cadences)) {
        allEvents.push({
          id: `review-${project.id}`,
          title: `Review: ${project.name}`,
          date: format(today, 'yyyy-MM-dd'),
          type: 'review',
          project,
          urgency: 'warning',
        });
      }

      // Add tasks with due dates
      project.tasks
        .filter((task) => task.dueDate && !doneTaskStatusIds.includes(task.statusId))
        .forEach((task) => {
          const taskDueDate = parseISO(task.dueDate!);
          const daysUntilTask = differenceInDays(taskDueDate, today);
          allEvents.push({
            id: `task-${task.id}`,
            title: task.title,
            date: task.dueDate!,
            type: 'task',
            project,
            task,
            urgency: daysUntilTask < 0 ? 'critical' : daysUntilTask <= 2 ? 'warning' : 'normal',
          });
        });
    });

    return allEvents;
  }, [projects, doneTaskStatusIds, activeStatusIds, cadences]);

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(parseISO(event.date), day));
  };

  // Get events for selected date
  const selectedDateEvents = getEventsForDay(selectedCalendarDate);

  // Get upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const nextWeek = addDays(today, 14);
    return events
      .filter((event) => {
        const eventDate = parseISO(event.date);
        return isAfter(eventDate, today) && isBefore(eventDate, nextWeek);
      })
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
      .slice(0, 5);
  }, [events]);

  // Month stats
  const monthStats = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthEvents = events.filter((event) => {
      const eventDate = parseISO(event.date);
      return isAfter(eventDate, monthStart) && isBefore(eventDate, monthEnd);
    });

    return {
      totalEvents: monthEvents.length,
      deadlines: monthEvents.filter((e) => e.type === 'deadline').length,
      tasks: monthEvents.filter((e) => e.type === 'task').length,
      reviews: monthEvents.filter((e) => e.type === 'review').length,
    };
  }, [events, currentMonth]);

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get priority event for selected date (first critical or warning event)
  const priorityEvent = selectedDateEvents.find(e => e.urgency === 'critical' || e.urgency === 'warning') || selectedDateEvents[0];
  const otherEvents = selectedDateEvents.filter(e => e !== priorityEvent);

  if (isLoading) {
    return (
      <AppLayout title="Calendar">
        <div className="min-h-screen bg-background">
          <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white">
            <div className="container mx-auto px-4 py-8">
              <Skeleton className="h-8 w-48 bg-white/20" />
              <Skeleton className="mt-2 h-6 w-64 bg-white/20" />
            </div>
          </div>
          <div className="container mx-auto px-4 py-6">
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Calendar">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Gradient Header */}
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white shrink-0">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                  <CalendarIcon className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{format(currentMonth, 'MMMM yyyy')}</h1>
                  <p className="text-indigo-200 text-sm font-medium">
                    {monthStats.totalEvents} events this month
                  </p>
                </div>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm text-white"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm text-white"
                  onClick={() => {
                    setCurrentMonth(new Date());
                    setSelectedCalendarDate(new Date());
                  }}
                >
                  Today
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-sm text-white"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Month Stats - Glass Panels */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:bg-white/15 transition-all cursor-pointer group">
                <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                  <Flag className="h-4 w-4" />
                  Deadlines
                </div>
                <p className="mt-1 text-3xl font-bold group-hover:scale-105 transition-transform origin-left">{monthStats.deadlines}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:bg-white/15 transition-all cursor-pointer group">
                <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                  <CheckCircle2 className="h-4 w-4" />
                  Tasks
                </div>
                <p className="mt-1 text-3xl font-bold group-hover:scale-105 transition-transform origin-left">{monthStats.tasks}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:bg-white/15 transition-all cursor-pointer group">
                <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                  <Clock className="h-4 w-4" />
                  Reviews
                </div>
                <p className="mt-1 text-3xl font-bold group-hover:scale-105 transition-transform origin-left">{monthStats.reviews}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:bg-white/15 transition-all cursor-pointer group">
                <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="h-4 w-4" />
                  Total
                </div>
                <p className="mt-1 text-3xl font-bold group-hover:scale-105 transition-transform origin-left">{monthStats.totalEvents}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full max-w-[1600px] mx-auto w-full flex flex-col lg:flex-row">
            {/* Calendar Grid */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 lg:pr-4">
              <div className="bg-card rounded-2xl shadow-sm border overflow-hidden min-h-[500px] flex flex-col">
                {/* Week Days Header */}
                <div className="grid grid-cols-7 border-b bg-muted/50">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 flex-1 bg-muted/30 gap-px">
                  {days.map((day, index) => {
                    const dayEvents = getEventsForDay(day);
                    const isDayToday = isToday(day);
                    const isSelected = isSameDay(day, selectedCalendarDate);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const hasCritical = dayEvents.some((e) => e.urgency === 'critical');

                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedCalendarDate(day)}
                        className={cn(
                          'relative min-h-[80px] sm:min-h-[100px] p-2 lg:p-3 text-left transition-all bg-card hover:bg-muted/50 group',
                          !isCurrentMonth && 'opacity-40',
                          isSelected && 'bg-primary/5 ring-2 ring-inset ring-primary',
                        )}
                      >
                        {/* Day Number */}
                        <div className="flex items-start justify-between">
                          <span
                            className={cn(
                              'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                              isDayToday && 'bg-primary text-primary-foreground shadow-md',
                              !isDayToday && !isSelected && 'text-foreground group-hover:text-primary',
                              isSelected && !isDayToday && 'bg-slate-800 text-white'
                            )}
                          >
                            {format(day, 'd')}
                          </span>
                          {hasCritical && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>

                        {/* Event Pills with left border */}
                        {dayEvents.length > 0 && (
                          <div className="mt-2 space-y-1 overflow-hidden">
                            {dayEvents.slice(0, 2).map((event) => {
                              const colors = EVENT_COLORS[event.type];
                              return (
                                <div
                                  key={event.id}
                                  className={cn(
                                    'truncate rounded px-2 py-1 text-[10px] sm:text-xs font-medium border-l-2',
                                    colors.bg,
                                    colors.bgDark,
                                    colors.text,
                                    colors.textDark,
                                    colors.border
                                  )}
                                >
                                  {event.title}
                                </div>
                              );
                            })}
                            {dayEvents.length > 2 && (
                              <div className="text-[10px] text-muted-foreground px-1">
                                +{dayEvents.length - 2} more
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-full lg:w-[400px] flex flex-col gap-4 p-4 lg:p-6 lg:pl-2 shrink-0 overflow-y-auto">
              {/* Selected Date Events */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    {format(selectedCalendarDate, 'EEEE, MMM d')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDateEvents.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No events scheduled</p>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-2"
                        onClick={() => setAddProjectModalOpen(true)}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Add a goal
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Priority Event Card */}
                      {priorityEvent && (
                        <div
                          className={cn(
                            'relative rounded-lg p-4 border overflow-hidden cursor-pointer transition-all hover:shadow-md',
                            priorityEvent.urgency === 'critical' && 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30',
                            priorityEvent.urgency === 'warning' && 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30',
                            priorityEvent.urgency === 'normal' && 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30'
                          )}
                          onClick={() => router.push(`/project/${priorityEvent.project.id}`)}
                        >
                          <div className="absolute top-0 right-0 p-3 opacity-10">
                            <Star className="h-16 w-16" />
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn('w-2 h-2 rounded-full', EVENT_COLORS[priorityEvent.type].dot)} />
                            <span className={cn(
                              'text-xs font-bold uppercase tracking-wider',
                              priorityEvent.urgency === 'critical' && 'text-red-700 dark:text-red-400',
                              priorityEvent.urgency === 'warning' && 'text-amber-700 dark:text-amber-400',
                              priorityEvent.urgency === 'normal' && 'text-blue-700 dark:text-blue-400'
                            )}>
                              {priorityEvent.urgency === 'critical' ? 'Critical' : priorityEvent.urgency === 'warning' ? 'Priority' : 'Scheduled'} {priorityEvent.type}
                            </span>
                          </div>
                          <h4 className="text-lg font-bold mb-1">{priorityEvent.title}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {(() => {
                              const area = currentWorkspace ? getAreaById(currentWorkspace.id, priorityEvent.project.areaId) : null;
                              return area && (
                                <span className="bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded text-xs">
                                  {area.name}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Other Events */}
                      {otherEvents.map((event) => {
                        const eventColors = EVENT_COLORS[event.type];
                        const area = currentWorkspace ? getAreaById(currentWorkspace.id, event.project.areaId) : null;

                        return (
                          <button
                            key={event.id}
                            onClick={() => router.push(`/project/${event.project.id}`)}
                            className="flex items-center justify-between w-full p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'p-2 rounded-lg',
                                eventColors.bg,
                                eventColors.bgDark
                              )}>
                                {event.type === 'task' && <ListTodo className={cn('h-4 w-4', eventColors.text, eventColors.textDark)} />}
                                {event.type === 'deadline' && <Flag className={cn('h-4 w-4', eventColors.text, eventColors.textDark)} />}
                                {event.type === 'review' && <Clock className={cn('h-4 w-4', eventColors.text, eventColors.textDark)} />}
                                {event.type === 'start' && <Target className={cn('h-4 w-4', eventColors.text, eventColors.textDark)} />}
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-semibold">{event.title}</p>
                                <p className="text-xs text-muted-foreground">{area?.name || 'Unknown'}</p>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Events - Timeline Style */}
              {upcomingEvents.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="h-5 w-5 text-orange-400" />
                      Coming Up
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative pl-4 border-l border-border space-y-6">
                      {upcomingEvents.map((event) => {
                        const eventColors = EVENT_COLORS[event.type];
                        const daysUntil = differenceInDays(parseISO(event.date), new Date());

                        return (
                          <button
                            key={event.id}
                            onClick={() => {
                              setSelectedCalendarDate(parseISO(event.date));
                              router.push(`/project/${event.project.id}`);
                            }}
                            className="relative w-full text-left group"
                          >
                            <div className={cn(
                              'absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-background',
                              eventColors.dot
                            )} />
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">
                                  {format(parseISO(event.date), 'd MMM')}
                                </span>
                                <span className="text-[10px] font-semibold bg-muted px-1.5 py-0.5 rounded">
                                  {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                                </span>
                              </div>
                              <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                                {event.title}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <div className="bg-muted/50 rounded-xl p-5 shadow-inner">
                <h3 className="font-bold text-sm uppercase tracking-wide mb-3 opacity-70">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                    onClick={() => setAddProjectModalOpen(true)}
                  >
                    <Target className="mr-3 h-4 w-4 text-primary" />
                    New Goal
                  </Button>
                  {projects && projects.length > 0 && (
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                      onClick={() => {
                        const activeProjects = projects.filter((p) =>
                          activeStatusIds.includes(p.statusId)
                        );
                        if (activeProjects.length > 0) {
                          openAddTaskModal(activeProjects[0].id);
                        }
                      }}
                    >
                      <CheckCircle2 className="mr-3 h-4 w-4 text-green-500" />
                      Add Task
                    </Button>
                  )}
                </div>
              </div>

              {/* Legend */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-bold mb-3">Event Types</p>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    {Object.entries(EVENT_COLORS).map(([type, colors]) => (
                      <div key={type} className="flex items-center gap-2">
                        <div className={cn('h-2.5 w-2.5 rounded-full', colors.dot)} />
                        <span className="text-xs text-muted-foreground capitalize">
                          {type === 'start' ? 'Start Date' : type}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-20 md:bottom-8 right-6 z-50">
          <Button
            size="lg"
            className="h-14 w-14 rounded-full bg-gradient-to-r from-primary to-indigo-600 hover:from-indigo-500 hover:to-indigo-700 shadow-lg hover:shadow-primary/30 hover:scale-110 active:scale-95 transition-all"
            onClick={() => setAddProjectModalOpen(true)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
