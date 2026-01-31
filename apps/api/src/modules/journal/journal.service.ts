import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { parseISO, startOfDay } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

import type { JournalEntry, Mood } from '@goals/database';
import type { CreateJournalEntryDto, UpdateJournalEntryDto } from '@goals/shared';

import { validateImageUrl } from '../../common/utils/image-validation';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JournalService {
  constructor(private prisma: PrismaService) {}

  // Get user's timezone from database, default to UTC
  private async getUserTimezone(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    return user?.timezone || 'UTC';
  }

  // Get today's date at start of day in user's timezone
  private getTodayInTimezone(timezone: string): Date {
    const todayStr = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
    return new Date(todayStr + 'T00:00:00.000Z');
  }

  async create(data: CreateJournalEntryDto, userId: string): Promise<JournalEntry> {
    const date = startOfDay(parseISO(data.date));
    let photoUrl = data.photoUrl;
    if (photoUrl === '') {
      photoUrl = null;
    } else if (photoUrl !== undefined && photoUrl !== null) {
      if (typeof photoUrl !== 'string') {
        throw new BadRequestException('Journal photo must be a URL.');
      }
      photoUrl = validateImageUrl(photoUrl, {
        allowData: true,
        maxBytes: 5 * 1024 * 1024,
        context: 'Journal photo',
      });
    }

    // Check if entry already exists for this date
    const existing = await this.prisma.journalEntry.findUnique({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
    });

    if (existing) {
      throw new ConflictException('A journal entry already exists for this date');
    }

    return this.prisma.journalEntry.create({
      data: {
        userId,
        date,
        mood: data.mood as Mood | null,
        emoji: data.emoji,
        prompt: data.prompt,
        content: data.content,
        wins: data.wins,
        challenges: data.challenges,
        gratitude: data.gratitude,
        photoUrl,
      },
    });
  }

  async update(id: string, data: UpdateJournalEntryDto, userId: string): Promise<JournalEntry> {
    const entry = await this.findById(id);

    if (entry.userId !== userId) {
      throw new NotFoundException('Journal entry not found');
    }
    let photoUrl = data.photoUrl;
    if (photoUrl === '') {
      photoUrl = null;
    } else if (photoUrl !== undefined && photoUrl !== null) {
      if (typeof photoUrl !== 'string') {
        throw new BadRequestException('Journal photo must be a URL.');
      }
      photoUrl = validateImageUrl(photoUrl, {
        allowData: true,
        maxBytes: 5 * 1024 * 1024,
        context: 'Journal photo',
      });
    }

    return this.prisma.journalEntry.update({
      where: { id },
      data: {
        mood: data.mood as Mood | null | undefined,
        emoji: data.emoji,
        prompt: data.prompt,
        content: data.content,
        wins: data.wins,
        challenges: data.challenges,
        gratitude: data.gratitude,
        photoUrl,
      },
    });
  }

  async upsert(data: CreateJournalEntryDto, userId: string): Promise<JournalEntry> {
    const date = startOfDay(parseISO(data.date));
    let photoUrl = data.photoUrl;
    if (photoUrl === '') {
      photoUrl = null;
    } else if (photoUrl !== undefined && photoUrl !== null) {
      if (typeof photoUrl !== 'string') {
        throw new BadRequestException('Journal photo must be a URL.');
      }
      photoUrl = validateImageUrl(photoUrl, {
        allowData: true,
        maxBytes: 5 * 1024 * 1024,
        context: 'Journal photo',
      });
    }

    return this.prisma.journalEntry.upsert({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      update: {
        mood: data.mood as Mood | null,
        emoji: data.emoji,
        prompt: data.prompt,
        content: data.content,
        wins: data.wins,
        challenges: data.challenges,
        gratitude: data.gratitude,
        photoUrl,
      },
      create: {
        userId,
        date,
        mood: data.mood as Mood | null,
        emoji: data.emoji,
        prompt: data.prompt,
        content: data.content,
        wins: data.wins,
        challenges: data.challenges,
        gratitude: data.gratitude,
        photoUrl,
      },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const entry = await this.findById(id);

    if (entry.userId !== userId) {
      throw new NotFoundException('Journal entry not found');
    }

    await this.prisma.journalEntry.delete({ where: { id } });
  }

  async findById(id: string): Promise<JournalEntry> {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }

    return entry;
  }

  async findByDate(date: string, userId: string): Promise<JournalEntry | null> {
    const parsedDate = startOfDay(parseISO(date));

    return this.prisma.journalEntry.findUnique({
      where: {
        userId_date: {
          userId,
          date: parsedDate,
        },
      },
    });
  }

  // Find today's entry using user's timezone
  async findTodayEntry(userId: string): Promise<JournalEntry | null> {
    const userTimezone = await this.getUserTimezone(userId);
    const today = this.getTodayInTimezone(userTimezone);

    return this.prisma.journalEntry.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });
  }

  async findAll(userId: string, limit = 30, offset = 0): Promise<JournalEntry[]> {
    return this.prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async findByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<JournalEntry[]> {
    return this.prisma.journalEntry.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay(parseISO(startDate)),
          lte: startOfDay(parseISO(endDate)),
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number }> {
    // Get user's timezone for accurate "today" calculation
    const userTimezone = await this.getUserTimezone(userId);

    // Get recent journal entries for the user ordered by date descending
    // Limit to 400 entries (enough for 365-day streak calculation with buffer)
    const entries = await this.prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      select: { date: true },
      take: 400,
    });

    if (entries.length === 0) return { currentStreak: 0, longestStreak: 0 };

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = this.getTodayInTimezone(userTimezone);
    let currentDate = today;

    for (const entry of entries) {
      const entryDate = startOfDay(entry.date);
      const diffDays = Math.round(
        (currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0) {
        tempStreak++;
        if (currentStreak === 0 || currentStreak === tempStreak - 1) {
          currentStreak = tempStreak;
        }
        currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
      } else if (diffDays === 1) {
        tempStreak++;
        if (currentStreak === tempStreak - 1) {
          currentStreak = tempStreak;
        }
        currentDate = entryDate;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
        currentDate = entryDate;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return { currentStreak, longestStreak };
  }

  // Get random daily prompt
  getDailyPrompt(): string {
    const prompts = [
      'What was the most surprising moment of your day?',
      'What is one thing you are grateful for today?',
      'What challenged you today and how did you handle it?',
      'What made you smile today?',
      'What did you learn today?',
      'If you could change one thing about today, what would it be?',
      'What are you looking forward to tomorrow?',
      'Describe a moment when you felt proud today.',
      'What conversation stood out to you today?',
      'How did you take care of yourself today?',
      'What would you tell your past self about today?',
      'What kindness did you witness or perform today?',
      'What are you holding onto that you need to let go of?',
      'What inspired you today?',
      'How did you grow today?',
    ];

    // Use date-based seed for consistent daily prompt
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const index = seed % prompts.length;

    return prompts[index];
  }
}
