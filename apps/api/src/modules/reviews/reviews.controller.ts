import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateWeeklyReviewDto,
  UpdateWeeklyReviewDto,
  CreateMonthlyReviewDto,
  UpdateMonthlyReviewDto,
} from '@goals/shared';
import { User, WeeklyReview, MonthlyReview } from '@goals/database';

type UserWithoutPassword = Omit<User, 'passwordHash'>;

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  // ============================================================
  // WEEKLY REVIEWS
  // ============================================================

  @Get('weekly')
  findAllWeekly(
    @CurrentUser() user: UserWithoutPassword,
    @Query('limit') limit?: string
  ): Promise<WeeklyReview[]> {
    return this.reviewsService.findAllWeeklyReviews(user.id, limit ? parseInt(limit, 10) : 12);
  }

  @Get('weekly/current')
  getCurrentWeekly(@CurrentUser() user: UserWithoutPassword): Promise<{
    review: WeeklyReview | null;
    weekStart: string;
    isCurrentWeek: boolean;
  }> {
    return this.reviewsService.getCurrentWeekReview(user.id);
  }

  @Get('weekly/prompts')
  getWeeklyPrompts(): { prompts: string[] } {
    return { prompts: this.reviewsService.getWeeklyReviewPrompts() };
  }

  @Get('weekly/week/:weekStart')
  findWeeklyByWeek(
    @CurrentUser() user: UserWithoutPassword,
    @Param('weekStart') weekStart: string
  ): Promise<WeeklyReview | null> {
    return this.reviewsService.findWeeklyReviewByWeek(weekStart, user.id);
  }

  @Get('weekly/stats')
  getWeeklyStats(@CurrentUser() user: UserWithoutPassword): Promise<{
    totalReviews: number;
    averageRating: number;
    currentStreak: number;
  }> {
    return this.reviewsService.getWeeklyReviewStats(user.id);
  }

  @Get('weekly/:id')
  findWeeklyById(@Param('id') id: string): Promise<WeeklyReview> {
    return this.reviewsService.findWeeklyReviewById(id);
  }

  @Post('weekly')
  createWeekly(
    @Body() data: CreateWeeklyReviewDto,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<WeeklyReview> {
    return this.reviewsService.createWeeklyReview(data, user.id);
  }

  @Put('weekly/upsert')
  upsertWeekly(
    @Body() data: CreateWeeklyReviewDto,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<WeeklyReview> {
    return this.reviewsService.upsertWeeklyReview(data, user.id);
  }

  @Put('weekly/:id')
  updateWeekly(
    @Param('id') id: string,
    @Body() data: UpdateWeeklyReviewDto,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<WeeklyReview> {
    return this.reviewsService.updateWeeklyReview(id, data, user.id);
  }

  @Delete('weekly/:id')
  deleteWeekly(@Param('id') id: string, @CurrentUser() user: UserWithoutPassword): Promise<void> {
    return this.reviewsService.deleteWeeklyReview(id, user.id);
  }

  // ============================================================
  // MONTHLY REVIEWS
  // ============================================================

  @Get('monthly')
  findAllMonthly(
    @CurrentUser() user: UserWithoutPassword,
    @Query('limit') limit?: string
  ): Promise<MonthlyReview[]> {
    return this.reviewsService.findAllMonthlyReviews(user.id, limit ? parseInt(limit, 10) : 12);
  }

  @Get('monthly/current')
  getCurrentMonthly(@CurrentUser() user: UserWithoutPassword): Promise<{
    review: MonthlyReview | null;
    month: string;
    isCurrentMonth: boolean;
  }> {
    return this.reviewsService.getCurrentMonthReview(user.id);
  }

  @Get('monthly/prompts')
  getMonthlyPrompts(): { prompts: string[] } {
    return { prompts: this.reviewsService.getMonthlyReviewPrompts() };
  }

  @Get('monthly/month/:month')
  findMonthlyByMonth(
    @CurrentUser() user: UserWithoutPassword,
    @Param('month') month: string
  ): Promise<MonthlyReview | null> {
    return this.reviewsService.findMonthlyReviewByMonth(month, user.id);
  }

  @Get('monthly/:id')
  findMonthlyById(@Param('id') id: string): Promise<MonthlyReview> {
    return this.reviewsService.findMonthlyReviewById(id);
  }

  @Post('monthly')
  createMonthly(
    @Body() data: CreateMonthlyReviewDto,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<MonthlyReview> {
    return this.reviewsService.createMonthlyReview(data, user.id);
  }

  @Put('monthly/upsert')
  upsertMonthly(
    @Body() data: CreateMonthlyReviewDto,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<MonthlyReview> {
    return this.reviewsService.upsertMonthlyReview(data, user.id);
  }

  @Put('monthly/:id')
  updateMonthly(
    @Param('id') id: string,
    @Body() data: UpdateMonthlyReviewDto,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<MonthlyReview> {
    return this.reviewsService.updateMonthlyReview(id, data, user.id);
  }

  @Delete('monthly/:id')
  deleteMonthly(@Param('id') id: string, @CurrentUser() user: UserWithoutPassword): Promise<void> {
    return this.reviewsService.deleteMonthlyReview(id, user.id);
  }

  // ============================================================
  // STATS
  // ============================================================

  @Get('stats')
  getStats(@CurrentUser() user: UserWithoutPassword): Promise<{
    weeklyReviewsCount: number;
    monthlyReviewsCount: number;
    currentWeeklyStreak: number;
    lastWeeklyReview: Date | null;
    lastMonthlyReview: Date | null;
  }> {
    return this.reviewsService.getReviewStats(user.id);
  }
}
