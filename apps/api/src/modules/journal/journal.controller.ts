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
    streak: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const [entry, streak] = await Promise.all([
      this.journalService.findByDate(today, user.id),
      this.journalService.getStreak(user.id),
    ]);

    return {
      entry,
      prompt: this.journalService.getDailyPrompt(),
      streak,
    };
  }

  @Get('streak')
  async getStreak(@CurrentUser() user: UserWithoutPassword): Promise<{ streak: number }> {
    const streak = await this.journalService.getStreak(user.id);
    return { streak };
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
