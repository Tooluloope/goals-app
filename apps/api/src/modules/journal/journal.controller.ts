import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JournalService } from './journal.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateJournalEntryDto, UpdateJournalEntryDto } from '@goals/shared';
import { User, JournalEntry } from '@goals/database';

type UserWithoutPassword = Omit<User, 'passwordHash'>;

@Controller('journal')
@UseGuards(JwtAuthGuard)
export class JournalController {
  constructor(private journalService: JournalService) {}

  @Get()
  findAll(
    @CurrentUser() user: UserWithoutPassword,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ): Promise<JournalEntry[]> {
    return this.journalService.findAll(
      user.id,
      limit ? parseInt(limit, 10) : 30,
      offset ? parseInt(offset, 10) : 0
    );
  }

  @Get('today')
  async findToday(@CurrentUser() user: UserWithoutPassword): Promise<{
    entry: JournalEntry | null;
    prompt: string;
    currentStreak: number;
    longestStreak: number;
  }> {
    // Get today's date in user's timezone
    const todayEntry = await this.journalService.findTodayEntry(user.id);
    const streakData = await this.journalService.getStreak(user.id);

    return {
      entry: todayEntry,
      prompt: this.journalService.getDailyPrompt(),
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
    };
  }

  @Get('streak')
  async getStreak(
    @CurrentUser() user: UserWithoutPassword
  ): Promise<{ currentStreak: number; longestStreak: number }> {
    return this.journalService.getStreak(user.id);
  }

  @Get('prompt')
  getPrompt(): { prompt: string } {
    return { prompt: this.journalService.getDailyPrompt() };
  }

  @Get('range')
  findByDateRange(
    @CurrentUser() user: UserWithoutPassword,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<JournalEntry[]> {
    return this.journalService.findByDateRange(user.id, startDate, endDate);
  }

  @Get('date/:date')
  findByDate(
    @CurrentUser() user: UserWithoutPassword,
    @Param('date') date: string
  ): Promise<JournalEntry | null> {
    return this.journalService.findByDate(date, user.id);
  }

  @Get(':id')
  findById(
    @CurrentUser() user: UserWithoutPassword,
    @Param('id') id: string
  ): Promise<JournalEntry> {
    return this.journalService.findById(id);
  }

  @Post()
  create(
    @Body() data: CreateJournalEntryDto,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<JournalEntry> {
    return this.journalService.create(data, user.id);
  }

  @Put('upsert')
  upsert(
    @Body() data: CreateJournalEntryDto,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<JournalEntry> {
    return this.journalService.upsert(data, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateJournalEntryDto,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<JournalEntry> {
    return this.journalService.update(id, data, user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: UserWithoutPassword): Promise<void> {
    return this.journalService.delete(id, user.id);
  }
}
