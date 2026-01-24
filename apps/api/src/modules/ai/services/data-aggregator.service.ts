import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { subDays, endOfWeek, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import type { Mood } from '@goals/shared';

export interface HabitData {
  name: string;
  currentStreak: number;
  completionRate: number;
  completedToday: boolean;
  goalArea?: string | null;
}

export interface JournalData {
  date: Date;
  mood?: Mood | null;
  content: string;
  wins?: string | null;
  challenges?: string | null;
  gratitude?: string | null;
}

export interface WeeklyReviewData {
  weekStart: Date;
  wentWell?: string | null;
  toImprove?: string | null;
  focusNextWeek?: string | null;
  lessonsLearned?: string | null;
  gratitude?: string | null;
  rating?: number | null;
}

export interface MonthlyReviewData {
  month: Date;
  highlights?: string | null;
  challenges?: string | null;
  goalsAchieved?: string | null;
  goalsForNextMonth?: string | null;
  lessonsLearned?: string | null;
  gratitude?: string | null;
  rating?: number | null;
}

export interface UserContext {
  habits: HabitData[];
  journalStreak: number;
  recentMoods: (Mood | null)[];
  pendingTasks: number;
  activeProjects: number;
  lastJournalEntry?: JournalData | null;
}

export interface WeeklyData {
  weekStart: string;
  journalEntries: JournalData[];
  habits: HabitData[];
  tasksCompleted: number;
  totalTasks: number;
  weeklyReview?: WeeklyReviewData | null;
}

export interface MonthlyData {
  month: string;
  journalEntries: JournalData[];
  habits: HabitData[];
  weeklyReviews: WeeklyReviewData[];
  tasksCompleted: number;
  totalTasks: number;
  monthlyReview?: MonthlyReviewData | null;
}

export interface YearlyData {
  year: number;
  journalEntriesCount: number;
  moodDistribution: Record<Mood, number>;
  habits: HabitData[];
  monthlyReviews: MonthlyReviewData[];
  tasksCompleted: number;
  highlightMonths: { month: string; rating: number }[];
}

@Injectable()
export class DataAggregatorService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get current user context for chat (scoped to workspace)
   */
  async getUserContext(userId: string, workspaceId: string): Promise<UserContext> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const last30Days = subDays(today, 30);

    const [habits, journalStreak, recentJournals, pendingTasks, activeProjects] = await Promise.all(
      [
        this.getHabitsWithStats(userId, todayStr),
        this.getJournalStreak(userId),
        this.prisma.journalEntry.findMany({
          where: { userId, date: { gte: last30Days } },
          orderBy: { date: 'desc' },
          take: 7,
          select: {
            date: true,
            mood: true,
            content: true,
            wins: true,
            challenges: true,
            gratitude: true,
          },
        }),
        // Filter tasks by workspace
        this.prisma.task.count({
          where: {
            project: { workspaceId },
            OR: [{ assignedToId: userId }, { project: { ownerId: userId } }],
            completedAt: null,
          },
        }),
        // Filter projects by workspace
        this.prisma.project.count({
          where: {
            workspaceId,
            statusId: { not: 'done' },
          },
        }),
      ]
    );

    const recentMoods = recentJournals.map((j) => j.mood as Mood | null);
    const lastJournalEntry = recentJournals[0]
      ? {
          date: recentJournals[0].date,
          mood: recentJournals[0].mood as Mood | null,
          content: recentJournals[0].content,
          wins: recentJournals[0].wins,
          challenges: recentJournals[0].challenges,
          gratitude: recentJournals[0].gratitude,
        }
      : null;

    return {
      habits,
      journalStreak,
      recentMoods,
      pendingTasks,
      activeProjects,
      lastJournalEntry,
    };
  }

  /**
   * Get weekly data for summary generation (scoped to workspace)
   */
  async getWeeklyData(userId: string, workspaceId: string, weekStart: Date): Promise<WeeklyData> {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const [journalEntries, habits, tasks, weeklyReview] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where: {
          userId,
          date: { gte: weekStart, lte: weekEnd },
        },
        orderBy: { date: 'asc' },
        select: {
          date: true,
          mood: true,
          content: true,
          wins: true,
          challenges: true,
          gratitude: true,
        },
      }),
      this.getHabitsWithStats(userId, weekStartStr),
      // Filter tasks by workspace
      this.prisma.task.findMany({
        where: {
          project: { workspaceId },
          updatedAt: { gte: weekStart, lte: weekEnd },
        },
        select: { completedAt: true },
      }),
      this.prisma.weeklyReview.findFirst({
        where: { userId, weekStart },
        select: {
          weekStart: true,
          wentWell: true,
          toImprove: true,
          focusNextWeek: true,
          lessonsLearned: true,
          gratitude: true,
          rating: true,
        },
      }),
    ]);

    const tasksCompleted = tasks.filter((t) => t.completedAt !== null).length;

    return {
      weekStart: weekStartStr,
      journalEntries: journalEntries.map((j) => ({
        date: j.date,
        mood: j.mood as Mood | null,
        content: j.content,
        wins: j.wins,
        challenges: j.challenges,
        gratitude: j.gratitude,
      })),
      habits,
      tasksCompleted,
      totalTasks: tasks.length,
      weeklyReview: weeklyReview
        ? {
            weekStart: weeklyReview.weekStart,
            wentWell: weeklyReview.wentWell,
            toImprove: weeklyReview.toImprove,
            focusNextWeek: weeklyReview.focusNextWeek,
            lessonsLearned: weeklyReview.lessonsLearned,
            gratitude: weeklyReview.gratitude,
            rating: weeklyReview.rating,
          }
        : null,
    };
  }

  /**
   * Get monthly data for summary generation (scoped to workspace)
   */
  async getMonthlyData(
    userId: string,
    workspaceId: string,
    monthStart: Date
  ): Promise<MonthlyData> {
    const monthEnd = endOfMonth(monthStart);
    const monthStr = monthStart.toISOString().split('T')[0];

    const [journalEntries, habits, weeklyReviews, tasks, monthlyReview] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where: {
          userId,
          date: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { date: 'asc' },
        select: {
          date: true,
          mood: true,
          content: true,
          wins: true,
          challenges: true,
          gratitude: true,
        },
      }),
      this.getHabitsWithStats(userId, monthStr),
      this.prisma.weeklyReview.findMany({
        where: {
          userId,
          weekStart: { gte: monthStart, lte: monthEnd },
        },
        orderBy: { weekStart: 'asc' },
        select: {
          weekStart: true,
          wentWell: true,
          toImprove: true,
          focusNextWeek: true,
          lessonsLearned: true,
          gratitude: true,
          rating: true,
        },
      }),
      // Filter tasks by workspace
      this.prisma.task.findMany({
        where: {
          project: { workspaceId },
          updatedAt: { gte: monthStart, lte: monthEnd },
        },
        select: { completedAt: true },
      }),
      this.prisma.monthlyReview.findFirst({
        where: { userId, month: monthStart },
        select: {
          month: true,
          highlights: true,
          challenges: true,
          goalsAchieved: true,
          goalsForNextMonth: true,
          lessonsLearned: true,
          gratitude: true,
          rating: true,
        },
      }),
    ]);

    const tasksCompleted = tasks.filter((t) => t.completedAt !== null).length;

    return {
      month: monthStr,
      journalEntries: journalEntries.map((j) => ({
        date: j.date,
        mood: j.mood as Mood | null,
        content: j.content,
        wins: j.wins,
        challenges: j.challenges,
        gratitude: j.gratitude,
      })),
      habits,
      weeklyReviews: weeklyReviews.map((r) => ({
        weekStart: r.weekStart,
        wentWell: r.wentWell,
        toImprove: r.toImprove,
        focusNextWeek: r.focusNextWeek,
        lessonsLearned: r.lessonsLearned,
        gratitude: r.gratitude,
        rating: r.rating,
      })),
      tasksCompleted,
      totalTasks: tasks.length,
      monthlyReview: monthlyReview
        ? {
            month: monthlyReview.month,
            highlights: monthlyReview.highlights,
            challenges: monthlyReview.challenges,
            goalsAchieved: monthlyReview.goalsAchieved,
            goalsForNextMonth: monthlyReview.goalsForNextMonth,
            lessonsLearned: monthlyReview.lessonsLearned,
            gratitude: monthlyReview.gratitude,
            rating: monthlyReview.rating,
          }
        : null,
    };
  }

  /**
   * Get yearly data for summary generation (scoped to workspace)
   */
  async getYearlyData(userId: string, workspaceId: string, year: number): Promise<YearlyData> {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(yearStart);

    const [journalEntries, habits, monthlyReviews, tasks] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where: {
          userId,
          date: { gte: yearStart, lte: yearEnd },
        },
        select: { mood: true },
      }),
      this.getHabitsWithStats(userId, yearStart.toISOString().split('T')[0]),
      this.prisma.monthlyReview.findMany({
        where: {
          userId,
          month: { gte: yearStart, lte: yearEnd },
        },
        orderBy: { month: 'asc' },
        select: {
          month: true,
          highlights: true,
          challenges: true,
          goalsAchieved: true,
          goalsForNextMonth: true,
          lessonsLearned: true,
          gratitude: true,
          rating: true,
        },
      }),
      // Filter tasks by workspace
      this.prisma.task.findMany({
        where: {
          project: { workspaceId },
          completedAt: { gte: yearStart, lte: yearEnd },
        },
        select: { id: true },
      }),
    ]);

    // Calculate mood distribution
    const moodDistribution: Record<Mood, number> = {
      terrible: 0,
      bad: 0,
      neutral: 0,
      good: 0,
      great: 0,
    };
    journalEntries.forEach((j) => {
      if (j.mood) {
        moodDistribution[j.mood as Mood]++;
      }
    });

    // Find highlight months (those with highest ratings)
    const highlightMonths = monthlyReviews
      .filter((r) => r.rating !== null)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 3)
      .map((r) => ({
        month: r.month.toISOString().split('T')[0],
        rating: r.rating!,
      }));

    return {
      year,
      journalEntriesCount: journalEntries.length,
      moodDistribution,
      habits,
      monthlyReviews: monthlyReviews.map((r) => ({
        month: r.month,
        highlights: r.highlights,
        challenges: r.challenges,
        goalsAchieved: r.goalsAchieved,
        goalsForNextMonth: r.goalsForNextMonth,
        lessonsLearned: r.lessonsLearned,
        gratitude: r.gratitude,
        rating: r.rating,
      })),
      tasksCompleted: tasks.length,
      highlightMonths,
    };
  }

  /**
   * Helper: Get habits with stats for a specific date
   */
  private async getHabitsWithStats(userId: string, dateStr: string): Promise<HabitData[]> {
    const last30Days = subDays(new Date(dateStr), 30);

    const habits = await this.prisma.habit.findMany({
      where: { userId, isArchived: false },
      include: {
        logs: {
          where: { date: { gte: last30Days } },
          orderBy: { date: 'desc' },
        },
      },
    });

    return habits.map((habit) => {
      const completedLogs = habit.logs.filter((log) => log.completed);
      const completionRate = Math.round((completedLogs.length / 30) * 100);

      // Calculate streak
      let currentStreak = 0;
      const sortedLogs = [...completedLogs].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const today = new Date(dateStr);
      let checkDate = today;

      for (const log of sortedLogs) {
        const logDate = new Date(log.date);
        const diffDays = Math.floor(
          (checkDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays <= 1) {
          currentStreak++;
          checkDate = logDate;
        } else {
          break;
        }
      }

      // Check if completed today
      const todayLog = habit.logs.find((log) => {
        const logDateStr = new Date(log.date).toISOString().split('T')[0];
        return logDateStr === dateStr && log.completed;
      });

      return {
        name: habit.name,
        currentStreak,
        completionRate,
        completedToday: !!todayLog,
        goalArea: habit.goalArea,
      };
    });
  }

  /**
   * Helper: Get journal streak
   */
  private async getJournalStreak(userId: string): Promise<number> {
    const entries = await this.prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      select: { date: true },
      take: 100,
    });

    if (entries.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    let checkDate = new Date(today.toISOString().split('T')[0]);

    for (const entry of entries) {
      const entryDate = new Date(entry.date);
      const entryDateStr = entryDate.toISOString().split('T')[0];
      const checkDateStr = checkDate.toISOString().split('T')[0];

      if (entryDateStr === checkDateStr) {
        streak++;
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      } else if (entryDate < checkDate) {
        break;
      }
    }

    return streak;
  }
}
