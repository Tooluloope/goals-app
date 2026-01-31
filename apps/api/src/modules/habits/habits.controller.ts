import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';

import type { Habit, HabitLog, User } from '@goals/database';
import type { HabitWithStats } from '@goals/shared';
import { CreateHabitDto, ToggleHabitLogDto, UpdateHabitDto } from '@goals/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { HabitsService } from './habits.service';

type UserWithoutPassword = Omit<User, 'passwordHash'>;

@Controller('habits')
@UseGuards(JwtAuthGuard)
export class HabitsController {
  constructor(private habitsService: HabitsService) {}

  @Get()
  findAll(
    @CurrentUser() user: UserWithoutPassword,
    @Query('includeArchived') includeArchived?: string,
    @Query('date') date?: string
  ): Promise<HabitWithStats[]> {
    return this.habitsService.findAll(user.id, includeArchived === 'true', date);
  }

  @Get('today')
  async getToday(
    @CurrentUser() user: UserWithoutPassword,
    @Query('date') date?: string
  ): Promise<{
    habits: HabitWithStats[];
    completedCount: number;
    totalCount: number;
  }> {
    // Use the client's local date for completedToday comparison
    const habits = await this.habitsService.findAll(user.id, false, date);
    const completedCount = habits.filter((h) => h.completedToday).length;

    return {
      habits,
      completedCount,
      totalCount: habits.length,
    };
  }

  @Get('logs/date/:date')
  getLogsForDate(
    @CurrentUser() user: UserWithoutPassword,
    @Param('date') date: string
  ): Promise<HabitLog[]> {
    return this.habitsService.getAllLogsForDate(user.id, date);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<Habit> {
    return this.habitsService.findById(id);
  }

  @Get(':id/logs')
  getLogs(
    @CurrentUser() user: UserWithoutPassword,
    @Param('id') id: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<HabitLog[]> {
    return this.habitsService.getLogsForDateRange(id, startDate, endDate, user.id);
  }

  @Post()
  create(@Body() data: CreateHabitDto, @CurrentUser() user: UserWithoutPassword): Promise<Habit> {
    return this.habitsService.create(data, user.id);
  }

  @Post(':id/toggle')
  toggleLog(
    @Param('id') id: string,
    @Body() data: ToggleHabitLogDto,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<HabitLog> {
    return this.habitsService.toggleLog(id, data, user.id);
  }

  @Put('reorder')
  reorder(
    @Body() data: { habitIds: string[] },
    @CurrentUser() user: UserWithoutPassword
  ): Promise<void> {
    return this.habitsService.reorderHabits(user.id, data.habitIds);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateHabitDto,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<Habit> {
    return this.habitsService.update(id, data, user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: UserWithoutPassword): Promise<void> {
    return this.habitsService.delete(id, user.id);
  }
}
