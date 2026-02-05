import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { getDay, startOfWeek, subDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

import type { Habit, HabitLog } from '@goals/database';
import type {
  CreateHabitDto,
  HabitFrequency,
  HabitWithStats,
  LinkHabitToProjectDto,
  ProjectHabitProgress,
  ToggleHabitLogDto,
  UpdateHabitDto,
} from '@goals/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { UsageService } from '../usage/usage.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

// Streak milestones that trigger celebration emails
const STREAK_MILESTONES = [7, 30, 100, 365] as const;
type _StreakMilestone = (typeof STREAK_MILESTONES)[number];

// Helper to get date string from a DB date (stored as UTC midnight)
function getDbDateStr(date: Date): string {
  return date.toISOString().substring(0, 10);
}

// Helper to get today's date string in a specific timezone
function getTodayInTimezone(timezone: string): string {
  return formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
}

// Helper to check if a date is an expected day for a habit based on its frequency
function isExpectedDay(
  dateStr: string,
  frequency: HabitFrequency,
  frequencyDays: number[]
): boolean {
  const date = new Date(dateStr + 'T00:00:00.000Z');
  const dayOfWeek = getDay(date); // 0 = Sunday, 6 = Saturday

  switch (frequency) {
    case 'daily':
      return true;
    case 'weekly':
      // For weekly habits, any day is valid for completion once per week
      return true;
    case 'specific_days':
      // Only expected on specified days
      return frequencyDays.includes(dayOfWeek);
    default:
      return true;
  }
}

// Helper to get week key for a date (used for weekly habit tracking)
function getWeekKey(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00.000Z');
  const weekStart = startOfWeek(date, { weekStartsOn: 0 }); // Sunday
  return getDbDateStr(weekStart);
}

@Injectable()
export class HabitsService {
  private readonly logger = new Logger(HabitsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private usageService: UsageService,
    private workspacesService: WorkspacesService
  ) {}

  // Get user's timezone from database, default to UTC
  private async getUserTimezone(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    return user?.timezone || 'UTC';
  }

  async create(data: CreateHabitDto, userId: string): Promise<Habit> {
    // Verify user has access to the workspace
    await this.workspacesService.verifyAccess(data.workspaceId, userId);

    // Check if user can create more habits (quota enforcement for FREE tier)
    await this.usageService.enforceQuota(userId, 'habits');

    // Get the max order for workspace's habits
    const maxOrder = await this.prisma.habit.aggregate({
      where: { workspaceId: data.workspaceId },
      _max: { order: true },
    });

    const habit = await this.prisma.habit.create({
      data: {
        workspaceId: data.workspaceId,
        userId,
        projectId: data.projectId,
        weight: data.weight,
        name: data.name,
        icon: data.icon,
        color: data.color || 'primary',
        order: data.order ?? (maxOrder._max.order ?? -1) + 1,
        frequency: data.frequency || 'daily',
        frequencyDays: data.frequencyDays || [],
        reminderEnabled: data.reminderEnabled || false,
        reminderTime: data.reminderTime,
        goalArea: data.goalArea,
      },
    });

    // Increment usage counter
    await this.usageService.incrementUsage(userId, 'habits');

    return habit;
  }

  async update(id: string, data: UpdateHabitDto, userId: string): Promise<Habit> {
    const habit = await this.findById(id);

    // Verify user has access to the habit's workspace
    await this.workspacesService.verifyAccess(habit.workspaceId, userId);

    return this.prisma.habit.update({
      where: { id },
      data: {
        projectId: data.projectId,
        weight: data.weight,
        name: data.name,
        icon: data.icon,
        color: data.color,
        order: data.order,
        isArchived: data.isArchived,
        frequency: data.frequency,
        frequencyDays: data.frequencyDays,
        reminderEnabled: data.reminderEnabled,
        reminderTime: data.reminderTime,
        goalArea: data.goalArea,
      },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const habit = await this.findById(id);

    // Verify user has access to the habit's workspace
    await this.workspacesService.verifyAccess(habit.workspaceId, userId);

    await this.prisma.habit.delete({ where: { id } });

    // Decrement usage counter
    await this.usageService.decrementUsage(userId, 'habits');
  }

  async findById(id: string): Promise<Habit> {
    const habit = await this.prisma.habit.findUnique({
      where: { id },
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    return habit;
  }

  async findAll(
    userId: string,
    includeArchived = false,
    clientDate?: string
  ): Promise<HabitWithStats[]> {
    // Get user's stored timezone (or use clientDate for backward compatibility)
    const userTimezone = await this.getUserTimezone(userId);

    const habits = await this.prisma.habit.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      orderBy: { order: 'asc' },
      include: {
        logs: {
          where: {
            date: {
              gte: subDays(new Date(), 30),
            },
          },
          orderBy: { date: 'desc' },
        },
      },
    });

    // Use user's stored timezone to calculate "today"
    // clientDate is kept for backward compatibility but stored timezone takes precedence
    const todayStr = clientDate || getTodayInTimezone(userTimezone);

    return habits.map((habit) => {
      const completedToday = habit.logs.some(
        (log) => getDbDateStr(log.date) === todayStr && log.completed
      );

      const { currentStreak, longestStreak } = this.calculateStreaks(
        habit.logs,
        todayStr,
        habit.frequency as HabitFrequency,
        habit.frequencyDays
      );
      const completionRate = this.calculateCompletionRate(
        habit.logs,
        habit.frequency as HabitFrequency,
        habit.frequencyDays
      );

      return {
        ...habit,
        currentStreak,
        longestStreak,
        completedToday,
        completionRate,
      };
    });
  }

  async toggleLog(habitId: string, data: ToggleHabitLogDto, userId: string): Promise<HabitLog> {
    const habit = await this.findById(habitId);

    // Verify user has access to the habit's workspace
    await this.workspacesService.verifyAccess(habit.workspaceId, userId);

    // Parse date as UTC midnight to avoid server timezone issues
    // Frontend sends date as "YYYY-MM-DD", we store it as UTC midnight
    const date = new Date(data.date + 'T00:00:00.000Z');

    // Check if log exists for this date
    const existingLog = await this.prisma.habitLog.findUnique({
      where: {
        habitId_date: {
          habitId,
          date,
        },
      },
    });

    let result: HabitLog;
    let justCompleted = false;

    if (existingLog) {
      // Toggle the completed status
      result = await this.prisma.habitLog.update({
        where: { id: existingLog.id },
        data: { completed: !existingLog.completed },
      });
      justCompleted = !existingLog.completed; // Was incomplete, now complete
    } else {
      // Create new log
      result = await this.prisma.habitLog.create({
        data: {
          habitId,
          date,
          completed: true,
        },
      });
      justCompleted = true;
    }

    // Check for streak milestones if habit was just completed
    if (justCompleted) {
      this.checkAndSendStreakMilestoneEmail(habitId, userId, data.date).catch((err) => {
        this.logger.error(`Failed to check streak milestone: ${err.message}`);
      });
    }

    return result;
  }

  private async checkAndSendStreakMilestoneEmail(
    habitId: string,
    userId: string,
    dateStr: string
  ): Promise<void> {
    // Get habit with logs to calculate streak
    const habit = await this.prisma.habit.findUnique({
      where: { id: habitId },
      include: {
        logs: {
          where: { date: { gte: subDays(new Date(), 400) } }, // Get enough logs for 365-day streak
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!habit) return;

    // Get user info for email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, settings: true },
    });

    if (!user) return;

    // Check email preferences
    const settings = user.settings as Record<string, any> | null;
    const emailPrefs = settings?.emailPreferences;
    if (emailPrefs?.streakMilestones === false) {
      return; // User has opted out of streak milestone emails
    }

    // Calculate current streak
    const { currentStreak } = this.calculateStreaks(
      habit.logs,
      dateStr,
      habit.frequency as HabitFrequency,
      habit.frequencyDays
    );

    // Check if current streak matches a milestone
    const milestone = STREAK_MILESTONES.find((m) => currentStreak === m);
    if (milestone) {
      await this.emailService.sendStreakMilestoneEmail(
        user.email,
        user.name,
        habit.name,
        currentStreak,
        String(milestone) as '7' | '30' | '100' | '365'
      );
      this.logger.log(
        `Sent streak milestone email to ${user.email} for ${habit.name} (${milestone} days)`
      );
    }
  }

  async getLogsForDateRange(
    habitId: string,
    startDate: string,
    endDate: string,
    userId: string
  ): Promise<HabitLog[]> {
    const habit = await this.findById(habitId);

    // Verify user has access to the habit's workspace
    await this.workspacesService.verifyAccess(habit.workspaceId, userId);

    return this.prisma.habitLog.findMany({
      where: {
        habitId,
        date: {
          gte: new Date(startDate + 'T00:00:00.000Z'),
          lte: new Date(endDate + 'T00:00:00.000Z'),
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getAllLogsForDate(userId: string, date: string): Promise<HabitLog[]> {
    const parsedDate = new Date(date + 'T00:00:00.000Z');

    return this.prisma.habitLog.findMany({
      where: {
        habit: { userId },
        date: parsedDate,
        completed: true,
      },
      include: {
        habit: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
    });
  }

  async reorderHabits(userId: string, habitIds: string[]): Promise<void> {
    const updates = habitIds.map((id, index) =>
      this.prisma.habit.updateMany({
        where: { id, userId },
        data: { order: index },
      })
    );

    await this.prisma.$transaction(updates);
  }

  async findAllForWorkspace(
    workspaceId: string,
    userId: string,
    includeArchived = false,
    clientDate?: string
  ): Promise<HabitWithStats[]> {
    // Verify user has access to the workspace
    await this.workspacesService.verifyAccess(workspaceId, userId);

    // Get user's stored timezone
    const userTimezone = await this.getUserTimezone(userId);

    const habits = await this.prisma.habit.findMany({
      where: {
        workspaceId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      orderBy: { order: 'asc' },
      include: {
        logs: {
          where: {
            date: {
              gte: subDays(new Date(), 30),
            },
          },
          orderBy: { date: 'desc' },
        },
      },
    });

    const todayStr = clientDate || getTodayInTimezone(userTimezone);

    return habits.map((habit) => {
      const completedToday = habit.logs.some(
        (log) => getDbDateStr(log.date) === todayStr && log.completed
      );

      const { currentStreak, longestStreak } = this.calculateStreaks(
        habit.logs,
        todayStr,
        habit.frequency as HabitFrequency,
        habit.frequencyDays
      );
      const completionRate = this.calculateCompletionRate(
        habit.logs,
        habit.frequency as HabitFrequency,
        habit.frequencyDays
      );

      return {
        ...habit,
        currentStreak,
        longestStreak,
        completedToday,
        completionRate,
      };
    });
  }

  async linkToProject(
    habitId: string,
    data: LinkHabitToProjectDto,
    userId: string
  ): Promise<Habit> {
    const habit = await this.findById(habitId);

    // Verify user has access to the habit's workspace
    await this.workspacesService.verifyAccess(habit.workspaceId, userId);

    // If linking to a project, verify the project exists and belongs to the same workspace
    if (data.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: data.projectId },
        select: { workspaceId: true },
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      if (project.workspaceId !== habit.workspaceId) {
        throw new NotFoundException('Project must be in the same workspace as the habit');
      }
    }

    return this.prisma.habit.update({
      where: { id: habitId },
      data: {
        projectId: data.projectId,
        weight: data.weight,
      },
    });
  }

  async calculateProjectProgress(projectId: string, userId: string): Promise<ProjectHabitProgress> {
    // Get project with linked habits
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        habits: {
          where: { isArchived: false },
          include: {
            logs: {
              where: {
                date: { gte: subDays(new Date(), 30) },
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify user has access to the project's workspace
    await this.workspacesService.verifyAccess(project.workspaceId, userId);

    if (project.habits.length === 0) {
      return { progress: 0, habits: [] };
    }

    // Calculate completion rate for each habit
    const habitStats = project.habits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      weight: habit.weight,
      completionRate: this.calculateCompletionRate(
        habit.logs,
        habit.frequency as HabitFrequency,
        habit.frequencyDays
      ),
    }));

    // Calculate weighted progress
    // If no weights are set, use equal weighting
    const hasWeights = habitStats.some((h) => h.weight !== null);

    let progress: number;
    if (hasWeights) {
      const totalWeight = habitStats.reduce((sum, h) => sum + (h.weight ?? 0), 0);
      if (totalWeight === 0) {
        // All weights are null or 0, use equal weighting
        progress = habitStats.reduce((sum, h) => sum + h.completionRate, 0) / habitStats.length;
      } else {
        progress = habitStats.reduce((sum, h) => {
          const weight = h.weight ?? 0;
          return sum + (h.completionRate * weight) / totalWeight;
        }, 0);
      }
    } else {
      // Equal weighting
      progress = habitStats.reduce((sum, h) => sum + h.completionRate, 0) / habitStats.length;
    }

    return { progress: Math.round(progress), habits: habitStats };
  }

  private calculateStreaks(
    logs: HabitLog[],
    todayStr: string,
    frequency: HabitFrequency,
    frequencyDays: number[]
  ): { currentStreak: number; longestStreak: number } {
    if (logs.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const completedLogs = logs.filter((log) => log.completed);
    if (completedLogs.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Get unique completed dates as YYYY-MM-DD strings, sorted descending
    const completedDates = [...new Set(completedLogs.map((log) => getDbDateStr(log.date)))].sort(
      (a, b) => b.localeCompare(a)
    );

    // For weekly habits, count consecutive weeks with at least one completion
    if (frequency === 'weekly') {
      return this.calculateWeeklyStreaks(completedDates, todayStr);
    }

    // For specific_days, only count expected days
    if (frequency === 'specific_days') {
      return this.calculateSpecificDaysStreaks(completedDates, todayStr, frequencyDays);
    }

    // Default: daily habits - consecutive calendar days
    return this.calculateDailyStreaks(completedDates, todayStr);
  }

  private calculateDailyStreaks(
    completedDates: string[],
    todayStr: string
  ): { currentStreak: number; longestStreak: number } {
    const todayDate = new Date(todayStr + 'T00:00:00.000Z');
    const yesterdayDate = new Date(todayDate.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = getDbDateStr(yesterdayDate);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let previousDateStr: string | null = null;
    let currentStreakFinalized = false;

    for (const dateStr of completedDates) {
      if (previousDateStr === null) {
        if (dateStr === todayStr || dateStr === yesterdayStr) {
          currentStreak = 1;
          tempStreak = 1;
        } else {
          tempStreak = 1;
          currentStreakFinalized = true;
        }
      } else {
        const prevDate = new Date(previousDateStr + 'T00:00:00.000Z');
        const currDate = new Date(dateStr + 'T00:00:00.000Z');
        const daysDiff = Math.round(
          (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 1) {
          tempStreak++;
          if (!currentStreakFinalized && currentStreak > 0) {
            currentStreak++;
          }
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
          currentStreakFinalized = true;
        }
      }
      previousDateStr = dateStr;
    }

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
    return { currentStreak, longestStreak };
  }

  private calculateWeeklyStreaks(
    completedDates: string[],
    todayStr: string
  ): { currentStreak: number; longestStreak: number } {
    // Get unique weeks with completions
    const completedWeeks = [...new Set(completedDates.map((d) => getWeekKey(d)))].sort((a, b) =>
      b.localeCompare(a)
    );

    if (completedWeeks.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const currentWeek = getWeekKey(todayStr);
    const todayDate = new Date(todayStr + 'T00:00:00.000Z');
    const lastWeekDate = new Date(todayDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeek = getWeekKey(getDbDateStr(lastWeekDate));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let previousWeek: string | null = null;
    let currentStreakFinalized = false;

    for (const week of completedWeeks) {
      if (previousWeek === null) {
        if (week === currentWeek || week === lastWeek) {
          currentStreak = 1;
          tempStreak = 1;
        } else {
          tempStreak = 1;
          currentStreakFinalized = true;
        }
      } else {
        const prevWeekDate = new Date(previousWeek + 'T00:00:00.000Z');
        const currWeekDate = new Date(week + 'T00:00:00.000Z');
        const weeksDiff = Math.round(
          (prevWeekDate.getTime() - currWeekDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
        );

        if (weeksDiff === 1) {
          tempStreak++;
          if (!currentStreakFinalized && currentStreak > 0) {
            currentStreak++;
          }
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
          currentStreakFinalized = true;
        }
      }
      previousWeek = week;
    }

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
    return { currentStreak, longestStreak };
  }

  private calculateSpecificDaysStreaks(
    completedDates: string[],
    todayStr: string,
    frequencyDays: number[]
  ): { currentStreak: number; longestStreak: number } {
    if (frequencyDays.length === 0) {
      // No specific days set, treat as daily
      return this.calculateDailyStreaks(completedDates, todayStr);
    }

    // Build list of expected days going back 30 days
    const expectedDays: string[] = [];
    const todayDate = new Date(todayStr + 'T00:00:00.000Z');

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(todayDate.getTime() - i * 24 * 60 * 60 * 1000);
      const checkDateStr = getDbDateStr(checkDate);
      if (isExpectedDay(checkDateStr, 'specific_days', frequencyDays)) {
        expectedDays.push(checkDateStr);
      }
    }

    if (expectedDays.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Check consecutive expected days
    const completedSet = new Set(completedDates);
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let currentStreakFinalized = false;

    // expectedDays is already sorted descending (most recent first)
    for (const expectedDay of expectedDays) {
      const wasCompleted = completedSet.has(expectedDay);

      if (wasCompleted) {
        tempStreak++;
        if (!currentStreakFinalized) {
          currentStreak++;
        }
      } else {
        // Missed an expected day - streak broken
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
        currentStreakFinalized = true;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
    return { currentStreak, longestStreak };
  }

  private calculateCompletionRate(
    logs: HabitLog[],
    frequency: HabitFrequency,
    frequencyDays: number[]
  ): number {
    if (logs.length === 0) return 0;

    const completedDates = new Set(
      logs.filter((log) => log.completed).map((log) => getDbDateStr(log.date))
    );

    // Calculate how many expected days in last 30 days
    const today = new Date();
    let expectedDays = 0;
    let completedExpectedDays = 0;

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const checkDateStr = getDbDateStr(checkDate);

      if (frequency === 'weekly') {
        // For weekly, count 4-5 weeks and check if each week has a completion
        // Simplified: count once per week
        if (getDay(checkDate) === 0) {
          // Count Sundays as week markers
          expectedDays++;
          // Check if any day in that week was completed
          const weekKey = getWeekKey(checkDateStr);
          const weekHasCompletion = [...completedDates].some((d) => getWeekKey(d) === weekKey);
          if (weekHasCompletion) completedExpectedDays++;
        }
      } else if (frequency === 'specific_days') {
        if (isExpectedDay(checkDateStr, frequency, frequencyDays)) {
          expectedDays++;
          if (completedDates.has(checkDateStr)) {
            completedExpectedDays++;
          }
        }
      } else {
        // Daily
        expectedDays++;
        if (completedDates.has(checkDateStr)) {
          completedExpectedDays++;
        }
      }
    }

    if (expectedDays === 0) return 0;
    return Math.round((completedExpectedDays / expectedDays) * 100);
  }
}
