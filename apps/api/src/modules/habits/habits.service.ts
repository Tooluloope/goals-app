import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHabitDto, UpdateHabitDto, ToggleHabitLogDto, HabitWithStats } from '@goals/shared';
import { Habit, HabitLog } from '@goals/database';
import { startOfDay, parseISO, subDays, differenceInDays } from 'date-fns';

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

    const today = startOfDay(new Date());

    return habits.map((habit) => {
      const completedToday = habit.logs.some(
        (log) => startOfDay(log.date).getTime() === today.getTime() && log.completed
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

    const date = startOfDay(parseISO(data.date));

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
          gte: startOfDay(parseISO(startDate)),
          lte: startOfDay(parseISO(endDate)),
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getAllLogsForDate(userId: string, date: string): Promise<HabitLog[]> {
    const parsedDate = startOfDay(parseISO(date));

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

    // Sort by date descending
    const sortedLogs = [...completedLogs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const today = startOfDay(new Date());
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let previousDate: Date | null = null;

    for (const log of sortedLogs) {
      const logDate = startOfDay(log.date);

      if (previousDate === null) {
        // First log
        const daysFromToday = differenceInDays(today, logDate);
        if (daysFromToday <= 1) {
          currentStreak = 1;
          tempStreak = 1;
        } else {
          tempStreak = 1;
        }
      } else {
        const daysDiff = differenceInDays(previousDate, logDate);
        if (daysDiff === 1) {
          tempStreak++;
          if (currentStreak > 0) {
            currentStreak++;
          }
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
          if (currentStreak > 0) {
            // Break in current streak
            currentStreak = 0;
          }
        }
      }

      previousDate = logDate;
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
