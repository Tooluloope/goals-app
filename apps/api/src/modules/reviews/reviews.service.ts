import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateWeeklyReviewDto,
  UpdateWeeklyReviewDto,
  CreateMonthlyReviewDto,
  UpdateMonthlyReviewDto,
} from '@goals/shared';
import { WeeklyReview, MonthlyReview } from '@goals/database';
import { startOfDay, parseISO, startOfWeek, startOfMonth, subWeeks } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  // Get user's timezone from database, default to UTC
  private async getUserTimezone(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    return user?.timezone || 'UTC';
  }

  // Get current date/time in user's timezone
  private getNowInTimezone(timezone: string): Date {
    return toZonedTime(new Date(), timezone);
  }

  // ============================================================
  // WEEKLY REVIEWS
  // ============================================================

  async createWeeklyReview(data: CreateWeeklyReviewDto, userId: string): Promise<WeeklyReview> {
    const weekStart = startOfDay(parseISO(data.weekStart));

    // Check if review already exists for this week
    const existing = await this.prisma.weeklyReview.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
    });

    if (existing) {
      throw new ConflictException('A weekly review already exists for this week');
    }

    return this.prisma.weeklyReview.create({
      data: {
        userId,
        weekStart,
        wentWell: data.wentWell,
        toImprove: data.toImprove,
        focusNextWeek: data.focusNextWeek,
        lessonsLearned: data.lessonsLearned,
        gratitude: data.gratitude,
        rating: data.rating,
      },
    });
  }

  async updateWeeklyReview(
    id: string,
    data: UpdateWeeklyReviewDto,
    userId: string
  ): Promise<WeeklyReview> {
    const review = await this.findWeeklyReviewById(id);

    if (review.userId !== userId) {
      throw new NotFoundException('Weekly review not found');
    }

    return this.prisma.weeklyReview.update({
      where: { id },
      data: {
        wentWell: data.wentWell,
        toImprove: data.toImprove,
        focusNextWeek: data.focusNextWeek,
        lessonsLearned: data.lessonsLearned,
        gratitude: data.gratitude,
        rating: data.rating,
      },
    });
  }

  async upsertWeeklyReview(data: CreateWeeklyReviewDto, userId: string): Promise<WeeklyReview> {
    const weekStart = startOfDay(parseISO(data.weekStart));

    // Prepare submitted data - only set submittedAt when newly submitted
    const submittedData = data.submitted ? { submitted: true, submittedAt: new Date() } : {};

    return this.prisma.weeklyReview.upsert({
      where: {
        userId_weekStart: {
          userId,
          weekStart,
        },
      },
      update: {
        wentWell: data.wentWell,
        toImprove: data.toImprove,
        focusNextWeek: data.focusNextWeek,
        lessonsLearned: data.lessonsLearned,
        gratitude: data.gratitude,
        rating: data.rating,
        ...submittedData,
      },
      create: {
        userId,
        weekStart,
        wentWell: data.wentWell,
        toImprove: data.toImprove,
        focusNextWeek: data.focusNextWeek,
        lessonsLearned: data.lessonsLearned,
        gratitude: data.gratitude,
        rating: data.rating,
        ...submittedData,
      },
    });
  }

  async deleteWeeklyReview(id: string, userId: string): Promise<void> {
    const review = await this.findWeeklyReviewById(id);

    if (review.userId !== userId) {
      throw new NotFoundException('Weekly review not found');
    }

    await this.prisma.weeklyReview.delete({ where: { id } });
  }

  async findWeeklyReviewById(id: string): Promise<WeeklyReview> {
    const review = await this.prisma.weeklyReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Weekly review not found');
    }

    return review;
  }

  async findWeeklyReviewByWeek(weekStart: string, userId: string): Promise<WeeklyReview | null> {
    const parsedDate = startOfDay(parseISO(weekStart));

    return this.prisma.weeklyReview.findUnique({
      where: {
        userId_weekStart: {
          userId,
          weekStart: parsedDate,
        },
      },
    });
  }

  async findAllWeeklyReviews(userId: string, limit = 12): Promise<WeeklyReview[]> {
    return this.prisma.weeklyReview.findMany({
      where: { userId },
      orderBy: { weekStart: 'desc' },
      take: limit,
    });
  }

  async getCurrentWeekReview(userId: string): Promise<{
    review: WeeklyReview | null;
    weekStart: string;
    isCurrentWeek: boolean;
  }> {
    // Use user's timezone to determine current week
    const userTimezone = await this.getUserTimezone(userId);
    const nowInTz = this.getNowInTimezone(userTimezone);
    const weekStart = startOfWeek(nowInTz, { weekStartsOn: 1 }); // Monday
    const weekStartStr = formatInTimeZone(weekStart, userTimezone, 'yyyy-MM-dd');

    const review = await this.findWeeklyReviewByWeek(weekStartStr, userId);

    return {
      review,
      weekStart: weekStartStr,
      isCurrentWeek: true,
    };
  }

  // ============================================================
  // MONTHLY REVIEWS
  // ============================================================

  async createMonthlyReview(data: CreateMonthlyReviewDto, userId: string): Promise<MonthlyReview> {
    const month = startOfDay(parseISO(data.month));

    // Check if review already exists for this month
    const existing = await this.prisma.monthlyReview.findUnique({
      where: {
        userId_month: {
          userId,
          month,
        },
      },
    });

    if (existing) {
      throw new ConflictException('A monthly review already exists for this month');
    }

    return this.prisma.monthlyReview.create({
      data: {
        userId,
        month,
        highlights: data.highlights,
        challenges: data.challenges,
        goalsAchieved: data.goalsAchieved,
        goalsForNextMonth: data.goalsForNextMonth,
        lessonsLearned: data.lessonsLearned,
        gratitude: data.gratitude,
        rating: data.rating,
      },
    });
  }

  async updateMonthlyReview(
    id: string,
    data: UpdateMonthlyReviewDto,
    userId: string
  ): Promise<MonthlyReview> {
    const review = await this.findMonthlyReviewById(id);

    if (review.userId !== userId) {
      throw new NotFoundException('Monthly review not found');
    }

    return this.prisma.monthlyReview.update({
      where: { id },
      data: {
        highlights: data.highlights,
        challenges: data.challenges,
        goalsAchieved: data.goalsAchieved,
        goalsForNextMonth: data.goalsForNextMonth,
        lessonsLearned: data.lessonsLearned,
        gratitude: data.gratitude,
        rating: data.rating,
      },
    });
  }

  async upsertMonthlyReview(data: CreateMonthlyReviewDto, userId: string): Promise<MonthlyReview> {
    const month = startOfDay(parseISO(data.month));

    // Prepare submitted data - only set submittedAt when newly submitted
    const submittedData = data.submitted ? { submitted: true, submittedAt: new Date() } : {};

    return this.prisma.monthlyReview.upsert({
      where: {
        userId_month: {
          userId,
          month,
        },
      },
      update: {
        highlights: data.highlights,
        challenges: data.challenges,
        goalsAchieved: data.goalsAchieved,
        goalsForNextMonth: data.goalsForNextMonth,
        lessonsLearned: data.lessonsLearned,
        gratitude: data.gratitude,
        rating: data.rating,
        ...submittedData,
      },
      create: {
        userId,
        month,
        highlights: data.highlights,
        challenges: data.challenges,
        goalsAchieved: data.goalsAchieved,
        goalsForNextMonth: data.goalsForNextMonth,
        lessonsLearned: data.lessonsLearned,
        gratitude: data.gratitude,
        rating: data.rating,
        ...submittedData,
      },
    });
  }

  async deleteMonthlyReview(id: string, userId: string): Promise<void> {
    const review = await this.findMonthlyReviewById(id);

    if (review.userId !== userId) {
      throw new NotFoundException('Monthly review not found');
    }

    await this.prisma.monthlyReview.delete({ where: { id } });
  }

  async findMonthlyReviewById(id: string): Promise<MonthlyReview> {
    const review = await this.prisma.monthlyReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Monthly review not found');
    }

    return review;
  }

  async findMonthlyReviewByMonth(month: string, userId: string): Promise<MonthlyReview | null> {
    const parsedDate = startOfDay(parseISO(month));

    return this.prisma.monthlyReview.findUnique({
      where: {
        userId_month: {
          userId,
          month: parsedDate,
        },
      },
    });
  }

  async findAllMonthlyReviews(userId: string, limit = 12): Promise<MonthlyReview[]> {
    return this.prisma.monthlyReview.findMany({
      where: { userId },
      orderBy: { month: 'desc' },
      take: limit,
    });
  }

  async getCurrentMonthReview(userId: string): Promise<{
    review: MonthlyReview | null;
    month: string;
    isCurrentMonth: boolean;
  }> {
    // Use user's timezone to determine current month
    const userTimezone = await this.getUserTimezone(userId);
    const nowInTz = this.getNowInTimezone(userTimezone);
    const month = startOfMonth(nowInTz);
    const monthStr = formatInTimeZone(month, userTimezone, 'yyyy-MM-dd');

    const review = await this.findMonthlyReviewByMonth(monthStr, userId);

    return {
      review,
      month: monthStr,
      isCurrentMonth: true,
    };
  }

  // ============================================================
  // STATS & PROMPTS
  // ============================================================

  async getReviewStats(userId: string): Promise<{
    weeklyReviewsCount: number;
    monthlyReviewsCount: number;
    currentWeeklyStreak: number;
    lastWeeklyReview: Date | null;
    lastMonthlyReview: Date | null;
  }> {
    // Get user's timezone for accurate "current week" calculation
    const userTimezone = await this.getUserTimezone(userId);
    const nowInTz = this.getNowInTimezone(userTimezone);

    const [weeklyCount, monthlyCount, lastWeekly, lastMonthly] = await Promise.all([
      this.prisma.weeklyReview.count({ where: { userId } }),
      this.prisma.monthlyReview.count({ where: { userId } }),
      this.prisma.weeklyReview.findFirst({
        where: { userId },
        orderBy: { weekStart: 'desc' },
        select: { weekStart: true },
      }),
      this.prisma.monthlyReview.findFirst({
        where: { userId },
        orderBy: { month: 'desc' },
        select: { month: true },
      }),
    ]);

    // Calculate weekly review streak
    const weeklyReviews = await this.prisma.weeklyReview.findMany({
      where: { userId },
      orderBy: { weekStart: 'desc' },
      take: 12,
      select: { weekStart: true },
    });

    let streak = 0;
    let expectedWeek = startOfWeek(nowInTz, { weekStartsOn: 1 });

    for (const review of weeklyReviews) {
      const reviewWeek = startOfDay(review.weekStart);
      if (reviewWeek.getTime() === expectedWeek.getTime()) {
        streak++;
        expectedWeek = subWeeks(expectedWeek, 1);
      } else if (reviewWeek.getTime() < expectedWeek.getTime()) {
        break;
      }
    }

    return {
      weeklyReviewsCount: weeklyCount,
      monthlyReviewsCount: monthlyCount,
      currentWeeklyStreak: streak,
      lastWeeklyReview: lastWeekly?.weekStart || null,
      lastMonthlyReview: lastMonthly?.month || null,
    };
  }

  getWeeklyReviewPrompts(): string[] {
    return [
      'What went well this week?',
      'What could you improve?',
      'What will you focus on next week?',
      'What lessons did you learn?',
      'What are you grateful for?',
    ];
  }

  getMonthlyReviewPrompts(): string[] {
    return [
      'What were the highlights of this month?',
      'What challenges did you face?',
      'What goals did you achieve?',
      'What goals do you want to set for next month?',
      'What lessons did you learn?',
      'What are you grateful for?',
    ];
  }
}
