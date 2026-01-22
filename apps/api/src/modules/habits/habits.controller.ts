import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { HabitsService } from './habits.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateHabitDto, UpdateHabitDto, ToggleHabitLogDto, HabitWithStats } from '@goals/shared';
import { User, Habit, HabitLog } from '@goals/database';

type UserWithoutPassword = Omit<User, 'passwordHash'>;

@Controller('habits')
@UseGuards(JwtAuthGuard)
export class HabitsController {
  constructor(private habitsService: HabitsService) {}

  @Get()
  findAll(
    @CurrentUser() user: UserWithoutPassword,
    @Query('includeArchived') includeArchived?: string
  ): Promise<HabitWithStats[]> {
    return this.habitsService.findAll(user.id, includeArchived === 'true');
  }

  @Get('today')
  async getToday(@CurrentUser() user: UserWithoutPassword): Promise<{
    habits: HabitWithStats[];
    completedCount: number;
    totalCount: number;
  }> {
    const habits = await this.habitsService.findAll(user.id, false);
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
