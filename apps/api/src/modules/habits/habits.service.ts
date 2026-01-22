import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHabitDto, UpdateHabitDto, ToggleHabitLogDto, HabitWithStats } from '@goals/shared';
import { Habit, HabitLog } from '@goals/database';
import { startOfDay, parseISO, subDays, differenceInDays } from 'date-fns';

// Helper to get local date as YYYY-MM-DD string
function getLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Helper to get date string from a DB date (stored as UTC midnight)
function getDbDateStr(date: Date): string {
  return date.toISOString().substring(0, 10);
}

@Injectable()
export class HabitsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateHabitDto, userId: string): Promise<Habit> {
    // Get the max order for user's habits
    const maxOrder = await this.prisma.habit.aggregate({
      where: { userId },
      _max: { order: true },
    });

    return this.prisma.habit.create({
      data: {
        userId,
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
  }

  async update(id: string, data: UpdateHabitDto, userId: string): Promise<Habit> {
    const habit = await this.findById(id);

    if (habit.userId !== userId) {
      throw new NotFoundException('Habit not found');
    }

    return this.prisma.habit.update({
      where: { id },
      data: {
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

    if (habit.userId !== userId) {
      throw new NotFoundException('Habit not found');
    }

    await this.prisma.habit.delete({ where: { id } });
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

  async findAll(userId: string, includeArchived = false): Promise<HabitWithStats[]> {
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

    // Use UTC date string for comparison to match how dates are stored in DB
    // DB stores dates as UTC midnight, so we use UTC for today as well
    const todayStr = getDbDateStr(new Date());

    return habits.map((habit) => {
      const completedToday = habit.logs.some(
        (log) => getDbDateStr(log.date) === todayStr && log.completed
      );

      const { currentStreak, longestStreak } = this.calculateStreaks(habit.logs);
      const completionRate = this.calculateCompletionRate(habit.logs);

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

    if (habit.userId !== userId) {
      throw new NotFoundException('Habit not found');
    }

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

    if (existingLog) {
      // Toggle the completed status
      return this.prisma.habitLog.update({
        where: { id: existingLog.id },
        data: { completed: !existingLog.completed },
      });
    } else {
      // Create new log
      return this.prisma.habitLog.create({
        data: {
          habitId,
          date,
          completed: true,
        },
      });
    }
  }

  async getLogsForDateRange(
    habitId: string,
    startDate: string,
    endDate: string,
    userId: string
  ): Promise<HabitLog[]> {
    const habit = await this.findById(habitId);

    if (habit.userId !== userId) {
      throw new NotFoundException('Habit not found');
    }

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

  private calculateStreaks(logs: HabitLog[]): { currentStreak: number; longestStreak: number } {
    if (logs.length === 0) return { currentStreak: 0, longestStreak: 0 };

    const completedLogs = logs.filter((log) => log.completed);
    if (completedLogs.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Get unique completed dates as YYYY-MM-DD strings, sorted descending
    const completedDates = [...new Set(completedLogs.map((log) => getDbDateStr(log.date)))].sort(
      (a, b) => b.localeCompare(a)
    );

    // Use UTC dates to match how dates are stored in DB (as UTC midnight)
    const now = new Date();
    const todayStr = getDbDateStr(now);
    const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = getDbDateStr(yesterdayDate);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let previousDateStr: string | null = null;
    let currentStreakFinalized = false; // Once we hit a gap, stop counting current streak

    for (const dateStr of completedDates) {
      if (previousDateStr === null) {
        // First log - check if it's today or yesterday to start current streak
        if (dateStr === todayStr || dateStr === yesterdayStr) {
          currentStreak = 1;
          tempStreak = 1;
        } else {
          tempStreak = 1;
          currentStreakFinalized = true; // Can't have current streak if first date isn't recent
        }
      } else {
        // Check if dates are consecutive (1 day apart)
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
          // Gap found - finalize current streak (keep the value, just stop counting)
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

  private calculateCompletionRate(logs: HabitLog[]): number {
    if (logs.length === 0) return 0;

    const completedCount = logs.filter((log) => log.completed).length;
    return Math.round((completedCount / 30) * 100); // Percentage of last 30 days
  }
}
