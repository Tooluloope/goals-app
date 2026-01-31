import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
  subWeeks,
} from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';

interface EmailPreferences {
  habitReminders?: boolean;
  taskDueReminders?: boolean;
  weeklySummary?: boolean;
  monthlySummary?: boolean;
  staleProjectAlerts?: boolean;
  reviewDueReminders?: boolean;
  streakMilestones?: boolean;
  aiInsights?: boolean;
  inactivityReminders?: boolean;
}

interface UserWithPrefs {
  id: string;
  email: string;
  name: string;
  timezone: string;
  emailPreferences: EmailPreferences;
}

// Common IANA timezones to check (covers most users)
const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'America/Sao_Paulo',
  'America/Mexico_City',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Amsterdam',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
  'Africa/Lagos',
  'Africa/Johannesburg',
  'Africa/Cairo',
];

// Status IDs that indicate completed tasks
const COMPLETED_TASK_STATUS_IDS = ['completed', 'done'];

// Cadence IDs that map to days between reviews
const CADENCE_DAYS: Record<string, number> = {
  'cadence-weekly': 7,
  'cadence-biweekly': 14,
  'cadence-monthly': 30,
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  // ============================================================
  // TIMEZONE HELPERS
  // ============================================================

  /**
   * Get list of timezones where the current local hour matches the target hour.
   * This is DST-aware since formatInTimeZone handles DST transitions.
   */
  private getTimezonesAtHour(targetHour: number): string[] {
    const now = new Date();
    return COMMON_TIMEZONES.filter((tz) => {
      try {
        const localHour = parseInt(formatInTimeZone(now, tz, 'H'), 10);
        return localHour === targetHour;
      } catch {
        return false;
      }
    });
  }

  /**
   * Get timezones where it's currently a specific hour on a specific day of week.
   * dayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
   */
  private getTimezonesAtHourAndDay(targetHour: number, targetDay: number): string[] {
    const now = new Date();
    return COMMON_TIMEZONES.filter((tz) => {
      try {
        const localHour = parseInt(formatInTimeZone(now, tz, 'H'), 10);
        const localDay = parseInt(formatInTimeZone(now, tz, 'i'), 10); // 'i' = ISO day (1=Mon, 7=Sun)
        // Convert ISO day to JS day (0=Sun, 6=Sat)
        const jsDay = localDay === 7 ? 0 : localDay;
        return localHour === targetHour && jsDay === targetDay;
      } catch {
        return false;
      }
    });
  }

  /**
   * Get timezones where it's currently a specific hour on a specific day of month.
   */
  private getTimezonesAtHourAndDayOfMonth(targetHour: number, targetDayOfMonth: number): string[] {
    const now = new Date();
    return COMMON_TIMEZONES.filter((tz) => {
      try {
        const localHour = parseInt(formatInTimeZone(now, tz, 'H'), 10);
        const localDayOfMonth = parseInt(formatInTimeZone(now, tz, 'd'), 10);
        return localHour === targetHour && localDayOfMonth === targetDayOfMonth;
      } catch {
        return false;
      }
    });
  }

  /**
   * Query users in specific timezones with a specific email preference enabled.
   * Filters at DB level for efficiency.
   */
  private async getUsersInTimezones(
    timezones: string[],
    prefKey: keyof EmailPreferences,
    defaultValue = true
  ): Promise<UserWithPrefs[]> {
    if (timezones.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: {
        timezone: { in: timezones },
      },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        settings: true,
      },
    });

    return users
      .map((user) => {
        const settings = user.settings as Record<string, unknown> | null;
        const emailPrefs = (settings?.emailPreferences || {}) as EmailPreferences;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          timezone: user.timezone,
          emailPreferences: emailPrefs,
        };
      })
      .filter((user) => {
        return user.emailPreferences[prefKey] ?? defaultValue;
      });
  }

  /**
   * Get users with a specific email preference (no timezone filter).
   * Used for non-time-sensitive emails.
   */
  private async getUsersWithEmailPref(
    prefKey: keyof EmailPreferences,
    defaultValue = true
  ): Promise<UserWithPrefs[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        settings: true,
      },
    });

    return users
      .map((user) => {
        const settings = user.settings as Record<string, unknown> | null;
        const emailPrefs = (settings?.emailPreferences || {}) as EmailPreferences;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          timezone: user.timezone,
          emailPreferences: emailPrefs,
        };
      })
      .filter((user) => {
        return user.emailPreferences[prefKey] ?? defaultValue;
      });
  }

  // ============================================================
  // HOURLY: Habit Reminders (8 AM local time)
  // ============================================================
  @Cron('0 * * * *') // Every hour on the hour
  async sendHabitReminders() {
    const matchingTimezones = this.getTimezonesAtHour(8); // 8 AM local
    if (matchingTimezones.length === 0) return;

    this.logger.log(`Running habit reminders for timezones: ${matchingTimezones.join(', ')}`);

    try {
      const users = await this.getUsersInTimezones(matchingTimezones, 'habitReminders');

      for (const user of users) {
        try {
          const todayStr = formatInTimeZone(new Date(), user.timezone || 'UTC', 'yyyy-MM-dd');

          // Get user's active habits that haven't been completed today
          const habits = await this.prisma.habit.findMany({
            where: {
              userId: user.id,
              isArchived: false,
              reminderEnabled: true,
            },
            include: {
              logs: {
                where: { date: new Date(todayStr + 'T00:00:00.000Z') },
              },
            },
          });

          const incompleteHabits = habits.filter((h) => !h.logs.some((log) => log.completed));

          if (incompleteHabits.length > 0) {
            const habitWithStreak = incompleteHabits[0];
            const streakLogs = await this.prisma.habitLog.findMany({
              where: { habitId: habitWithStreak.id, completed: true },
              orderBy: { date: 'desc' },
              take: 30,
            });

            let streak = 0;
            const yesterday = subDays(new Date(todayStr + 'T00:00:00.000Z'), 1);
            for (const log of streakLogs) {
              const logDate = log.date.toISOString().substring(0, 10);
              const expectedDate = subDays(yesterday, streak).toISOString().substring(0, 10);
              if (logDate === expectedDate) {
                streak++;
              } else {
                break;
              }
            }

            await this.emailService.sendHabitReminderEmail(
              user.email,
              user.name,
              habitWithStreak.name,
              streak
            );
          }
        } catch (err) {
          this.logger.error(`Failed to send habit reminder to ${user.email}: ${err}`);
        }
      }

      this.logger.log(`Habit reminders completed for ${users.length} users`);
    } catch (err) {
      this.logger.error(`Habit reminders job failed: ${err}`);
    }
  }

  // ============================================================
  // HOURLY: Journal Nudge (8 PM local time)
  // ============================================================
  @Cron('0 * * * *') // Every hour on the hour
  async sendJournalNudges() {
    const matchingTimezones = this.getTimezonesAtHour(20); // 8 PM local
    if (matchingTimezones.length === 0) return;

    this.logger.log(`Running journal nudges for timezones: ${matchingTimezones.join(', ')}`);

    try {
      const users = await this.getUsersInTimezones(matchingTimezones, 'habitReminders');

      for (const user of users) {
        try {
          const todayStr = formatInTimeZone(new Date(), user.timezone || 'UTC', 'yyyy-MM-dd');

          const todayEntry = await this.prisma.journalEntry.findFirst({
            where: {
              userId: user.id,
              date: new Date(todayStr + 'T00:00:00.000Z'),
            },
          });

          if (!todayEntry) {
            await this.emailService.sendJournalNudgeEmail(user.email, user.name);
          }
        } catch (err) {
          this.logger.error(`Failed to send journal nudge to ${user.email}: ${err}`);
        }
      }

      this.logger.log(`Journal nudges completed for ${users.length} users`);
    } catch (err) {
      this.logger.error(`Journal nudge job failed: ${err}`);
    }
  }

  // ============================================================
  // HOURLY: Task Due Reminders (9 AM local time)
  // ============================================================
  @Cron('0 * * * *') // Every hour on the hour
  async sendTaskDueReminders() {
    const matchingTimezones = this.getTimezonesAtHour(9); // 9 AM local
    if (matchingTimezones.length === 0) return;

    this.logger.log(`Running task due reminders for timezones: ${matchingTimezones.join(', ')}`);

    try {
      const users = await this.getUsersInTimezones(matchingTimezones, 'taskDueReminders');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      for (const user of users) {
        try {
          const tasksDueSoon = await this.prisma.task.findMany({
            where: {
              project: {
                workspace: {
                  members: { some: { userId: user.id } },
                },
              },
              statusId: { notIn: COMPLETED_TASK_STATUS_IDS },
              dueDate: {
                lte: tomorrow,
                gte: new Date(),
              },
            },
            include: {
              project: { select: { name: true } },
            },
            take: 5,
          });

          for (const task of tasksDueSoon) {
            await this.emailService.sendTaskDueReminderEmail(
              user.email,
              user.name,
              task.title,
              task.project.name
            );
          }
        } catch (err) {
          this.logger.error(`Failed to send task due reminder to ${user.email}: ${err}`);
        }
      }

      this.logger.log(`Task due reminders completed for ${users.length} users`);
    } catch (err) {
      this.logger.error(`Task due reminders job failed: ${err}`);
    }
  }

  // ============================================================
  // HOURLY: Weekly Summary (Sunday 6 PM local time)
  // ============================================================
  @Cron('0 * * * *') // Every hour on the hour
  async sendWeeklySummaries() {
    const matchingTimezones = this.getTimezonesAtHourAndDay(18, 0); // 6 PM Sunday (0 = Sunday)
    if (matchingTimezones.length === 0) return;

    this.logger.log(`Running weekly summaries for timezones: ${matchingTimezones.join(', ')}`);

    try {
      const users = await this.getUsersInTimezones(matchingTimezones, 'weeklySummary');
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });

      for (const user of users) {
        try {
          const [completedTasks, completedHabits, journalEntries] = await Promise.all([
            this.prisma.task.count({
              where: {
                project: {
                  workspace: { members: { some: { userId: user.id } } },
                },
                statusId: { in: COMPLETED_TASK_STATUS_IDS },
                updatedAt: { gte: weekStart, lte: weekEnd },
              },
            }),
            this.prisma.habitLog.count({
              where: {
                habit: { userId: user.id },
                completed: true,
                date: { gte: weekStart, lte: weekEnd },
              },
            }),
            this.prisma.journalEntry.count({
              where: {
                userId: user.id,
                date: { gte: weekStart, lte: weekEnd },
              },
            }),
          ]);

          const highlights: string[] = [];
          if (completedTasks > 0) highlights.push(`Completed ${completedTasks} tasks`);
          if (completedHabits > 0) highlights.push(`Logged ${completedHabits} habit completions`);
          if (journalEntries > 0) highlights.push(`Wrote ${journalEntries} journal entries`);

          if (highlights.length > 0) {
            await this.emailService.sendWeeklySummaryEmail(user.email, user.name, {
              periodLabel: `Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`,
              highlights,
              metrics: [
                { label: 'Tasks Done', value: String(completedTasks) },
                { label: 'Habits Logged', value: String(completedHabits) },
                { label: 'Journal Entries', value: String(journalEntries) },
              ],
            });
          }
        } catch (err) {
          this.logger.error(`Failed to send weekly summary to ${user.email}: ${err}`);
        }
      }

      this.logger.log(`Weekly summaries completed for ${users.length} users`);
    } catch (err) {
      this.logger.error(`Weekly summary job failed: ${err}`);
    }
  }

  // ============================================================
  // HOURLY: Monthly Summary (1st of month 10 AM local time)
  // ============================================================
  @Cron('0 * * * *') // Every hour on the hour
  async sendMonthlySummaries() {
    const matchingTimezones = this.getTimezonesAtHourAndDayOfMonth(10, 1); // 10 AM on 1st
    if (matchingTimezones.length === 0) return;

    this.logger.log(`Running monthly summaries for timezones: ${matchingTimezones.join(', ')}`);

    try {
      const users = await this.getUsersInTimezones(matchingTimezones, 'monthlySummary');
      const lastMonth = subDays(new Date(), 1);
      const monthStart = startOfMonth(lastMonth);
      const monthEnd = endOfMonth(lastMonth);

      for (const user of users) {
        try {
          const [completedTasks, completedProjects, journalEntries] = await Promise.all([
            this.prisma.task.count({
              where: {
                project: {
                  workspace: { members: { some: { userId: user.id } } },
                },
                statusId: { in: COMPLETED_TASK_STATUS_IDS },
                updatedAt: { gte: monthStart, lte: monthEnd },
              },
            }),
            this.prisma.project.count({
              where: {
                workspace: { members: { some: { userId: user.id } } },
                statusId: { in: ['status-done', 'status-completed'] },
                updatedAt: { gte: monthStart, lte: monthEnd },
              },
            }),
            this.prisma.journalEntry.count({
              where: {
                userId: user.id,
                date: { gte: monthStart, lte: monthEnd },
              },
            }),
          ]);

          const highlights: string[] = [];
          if (completedTasks > 0) highlights.push(`Completed ${completedTasks} tasks`);
          if (completedProjects > 0) highlights.push(`Finished ${completedProjects} goals`);
          if (journalEntries > 0) highlights.push(`Wrote ${journalEntries} journal entries`);

          if (highlights.length > 0) {
            await this.emailService.sendMonthlySummaryEmail(user.email, user.name, {
              periodLabel: format(lastMonth, 'MMMM yyyy'),
              highlights,
              metrics: [
                { label: 'Tasks Done', value: String(completedTasks) },
                { label: 'Goals Finished', value: String(completedProjects) },
                { label: 'Journal Entries', value: String(journalEntries) },
              ],
            });
          }
        } catch (err) {
          this.logger.error(`Failed to send monthly summary to ${user.email}: ${err}`);
        }
      }

      this.logger.log(`Monthly summaries completed for ${users.length} users`);
    } catch (err) {
      this.logger.error(`Monthly summary job failed: ${err}`);
    }
  }

  // ============================================================
  // HOURLY: Stale Project Alerts (Monday 9 AM local time)
  // ============================================================
  @Cron('0 * * * *') // Every hour on the hour
  async sendStaleProjectAlerts() {
    const matchingTimezones = this.getTimezonesAtHourAndDay(9, 1); // 9 AM Monday (1 = Monday)
    if (matchingTimezones.length === 0) return;

    this.logger.log(`Running stale project alerts for timezones: ${matchingTimezones.join(', ')}`);

    try {
      const users = await this.getUsersInTimezones(matchingTimezones, 'staleProjectAlerts');
      const staleThreshold = subWeeks(new Date(), 2);

      for (const user of users) {
        try {
          const staleProjects = await this.prisma.project.findMany({
            where: {
              workspace: { members: { some: { userId: user.id } } },
              statusId: { notIn: ['status-done', 'status-completed', 'status-archived'] },
              updatedAt: { lt: staleThreshold },
            },
            select: {
              id: true,
              name: true,
              statusId: true,
              updatedAt: true,
            },
            take: 5,
          });

          for (const project of staleProjects) {
            const daysSinceUpdate = Math.floor(
              (Date.now() - project.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
            );

            await this.emailService.sendStaleProjectEmail(
              user.email,
              user.name,
              project.id,
              project.name,
              daysSinceUpdate,
              project.statusId
            );
          }
        } catch (err) {
          this.logger.error(`Failed to send stale project alert to ${user.email}: ${err}`);
        }
      }

      this.logger.log(`Stale project alerts completed for ${users.length} users`);
    } catch (err) {
      this.logger.error(`Stale project alerts job failed: ${err}`);
    }
  }

  // ============================================================
  // HOURLY: Review Due Reminders (Friday 2 PM local time)
  // ============================================================
  @Cron('0 * * * *') // Every hour on the hour
  async sendReviewDueReminders() {
    const matchingTimezones = this.getTimezonesAtHourAndDay(14, 5); // 2 PM Friday (5 = Friday)
    if (matchingTimezones.length === 0) return;

    this.logger.log(`Running review due reminders for timezones: ${matchingTimezones.join(', ')}`);

    try {
      const users = await this.getUsersInTimezones(matchingTimezones, 'reviewDueReminders');

      for (const user of users) {
        try {
          const projects = await this.prisma.project.findMany({
            where: {
              workspace: { members: { some: { userId: user.id } } },
              statusId: { notIn: ['status-done', 'status-completed', 'status-archived'] },
              lastReviewDate: { not: null },
            },
            select: {
              id: true,
              name: true,
              cadenceId: true,
              lastReviewDate: true,
            },
          });

          for (const project of projects) {
            if (!project.lastReviewDate) continue;

            const daysSinceLastReview = Math.floor(
              (Date.now() - project.lastReviewDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            const expectedDays = CADENCE_DAYS[project.cadenceId] || 7;
            if (daysSinceLastReview >= expectedDays) {
              await this.emailService.sendReviewDueEmail(
                user.email,
                user.name,
                project.id,
                project.name,
                'cadence',
                daysSinceLastReview,
                project.cadenceId
              );
            }
          }
        } catch (err) {
          this.logger.error(`Failed to send review due reminder to ${user.email}: ${err}`);
        }
      }

      this.logger.log(`Review due reminders completed for ${users.length} users`);
    } catch (err) {
      this.logger.error(`Review due reminders job failed: ${err}`);
    }
  }

  // ============================================================
  // HOURLY: Inactivity Reminders (Wednesday 10 AM local time)
  // ============================================================
  @Cron('0 * * * *') // Every hour on the hour
  async sendInactivityReminders() {
    const matchingTimezones = this.getTimezonesAtHourAndDay(10, 3); // 10 AM Wednesday (3 = Wednesday)
    if (matchingTimezones.length === 0) return;

    this.logger.log(`Running inactivity reminders for timezones: ${matchingTimezones.join(', ')}`);

    try {
      // Note: inactivityReminders defaults to FALSE (opt-in)
      const users = await this.getUsersInTimezones(matchingTimezones, 'inactivityReminders', false);
      const inactivityThreshold = subWeeks(new Date(), 1);

      for (const user of users) {
        try {
          const [lastHabitLog, lastJournal, lastTaskUpdate] = await Promise.all([
            this.prisma.habitLog.findFirst({
              where: { habit: { userId: user.id } },
              orderBy: { date: 'desc' },
              select: { date: true },
            }),
            this.prisma.journalEntry.findFirst({
              where: { userId: user.id },
              orderBy: { date: 'desc' },
              select: { date: true },
            }),
            this.prisma.task.findFirst({
              where: {
                project: {
                  workspace: { members: { some: { userId: user.id } } },
                },
                statusId: { in: COMPLETED_TASK_STATUS_IDS },
              },
              orderBy: { updatedAt: 'desc' },
              select: { updatedAt: true },
            }),
          ]);

          const activities = [
            lastHabitLog?.date,
            lastJournal?.date,
            lastTaskUpdate?.updatedAt,
          ].filter(Boolean) as Date[];

          const mostRecentActivity =
            activities.length > 0
              ? new Date(Math.max(...activities.map((d) => d.getTime())))
              : null;

          if (!mostRecentActivity || mostRecentActivity < inactivityThreshold) {
            const daysSinceActive = mostRecentActivity
              ? Math.floor((Date.now() - mostRecentActivity.getTime()) / (1000 * 60 * 60 * 24))
              : 30;

            await this.emailService.sendInactivityReminderEmail(
              user.email,
              user.name,
              daysSinceActive,
              mostRecentActivity ? format(mostRecentActivity, 'MMM d, yyyy') : undefined
            );
          }
        } catch (err) {
          this.logger.error(`Failed to send inactivity reminder to ${user.email}: ${err}`);
        }
      }

      this.logger.log(`Inactivity reminders completed for ${users.length} users`);
    } catch (err) {
      this.logger.error(`Inactivity reminders job failed: ${err}`);
    }
  }
}
