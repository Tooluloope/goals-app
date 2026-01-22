import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJournalEntryDto, UpdateJournalEntryDto } from '@goals/shared';
import { JournalEntry, Mood } from '@goals/database';
import { startOfDay, parseISO } from 'date-fns';

@Injectable()
export class JournalService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateJournalEntryDto, userId: string): Promise<JournalEntry> {
    const date = startOfDay(parseISO(data.date));

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
        prompt: data.prompt,
        content: data.content,
        wins: data.wins,
        challenges: data.challenges,
        gratitude: data.gratitude,
        photoUrl: data.photoUrl,
      },
    });
  }

  async update(id: string, data: UpdateJournalEntryDto, userId: string): Promise<JournalEntry> {
    const entry = await this.findById(id);

    if (entry.userId !== userId) {
      throw new NotFoundException('Journal entry not found');
    }

    return this.prisma.journalEntry.update({
      where: { id },
      data: {
        mood: data.mood as Mood | null | undefined,
        prompt: data.prompt,
        content: data.content,
        wins: data.wins,
        challenges: data.challenges,
        gratitude: data.gratitude,
        photoUrl: data.photoUrl,
      },
    });
  }

  async upsert(data: CreateJournalEntryDto, userId: string): Promise<JournalEntry> {
    const date = startOfDay(parseISO(data.date));

    return this.prisma.journalEntry.upsert({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      update: {
        mood: data.mood as Mood | null,
        prompt: data.prompt,
        content: data.content,
        wins: data.wins,
        challenges: data.challenges,
        gratitude: data.gratitude,
        photoUrl: data.photoUrl,
      },
      create: {
        userId,
        date,
        mood: data.mood as Mood | null,
        prompt: data.prompt,
        content: data.content,
        wins: data.wins,
        challenges: data.challenges,
        gratitude: data.gratitude,
        photoUrl: data.photoUrl,
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

  async getStreak(userId: string): Promise<number> {
    // Get all journal entries for the user ordered by date descending
    const entries = await this.prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    if (entries.length === 0) return 0;

    let streak = 0;
    const today = startOfDay(new Date());
    let currentDate = today;

    for (const entry of entries) {
      const entryDate = startOfDay(entry.date);
      const diffDays = Math.round(
        (currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0) {
        streak++;
        currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
      } else if (diffDays === 1) {
        streak++;
        currentDate = entryDate;
      } else {
        break;
      }
    }

    return streak;
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
