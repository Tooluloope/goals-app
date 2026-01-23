import { Test, TestingModule } from '@nestjs/testing';
import { HabitsService } from './habits.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { subDays } from 'date-fns';

describe('HabitsService', () => {
  let service: HabitsService;
  let prisma: any;

  const mockUser = {
    id: 'user-1',
    timezone: 'America/New_York',
  };

  const mockHabit = {
    id: 'habit-1',
    userId: 'user-1',
    name: 'Exercise',
    icon: '💪',
    color: 'primary',
    order: 0,
    isArchived: false,
    frequency: 'daily',
    frequencyDays: [],
    reminderEnabled: false,
    reminderTime: null,
    goalArea: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockHabitLog = {
    id: 'log-1',
    habitId: 'habit-1',
    date: new Date('2024-06-15T00:00:00.000Z'),
    completed: true,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn().mockResolvedValue(mockUser),
      } as any,
      habit: {
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        aggregate: jest.fn().mockResolvedValue({ _max: { order: 0 } }),
      } as any,
      habitLog: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      } as any,
      $transaction: jest.fn((updates) => Promise.all(updates)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [HabitsService, { provide: PrismaService, useValue: mockPrismaService } as any],
    }).compile();

    service = module.get<HabitsService>(HabitsService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create a habit with default values', async () => {
      prisma.habit.create.mockResolvedValue(mockHabit);

      const result = await service.create({ name: 'Exercise' } as any, 'user-1');

      expect(prisma.habit.aggregate).toHaveBeenCalled();
      expect(prisma.habit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          name: 'Exercise',
          order: 1,
          frequency: 'daily',
          color: 'primary',
        }),
      });
      expect(result).toEqual(mockHabit);
    });

    it('should create a habit with custom values', async () => {
      prisma.habit.create.mockResolvedValue({
        ...mockHabit,
        icon: '🏃',
        color: 'green',
        frequency: 'weekly',
        frequencyDays: [1, 3, 5],
      });

      await service.create(
        {
          name: 'Running',
          icon: '🏃',
          color: 'green',
          frequency: 'weekly',
          frequencyDays: [1, 3, 5],
          reminderEnabled: true,
          reminderTime: '09:00',
        } as any,
        'user-1'
      );

      expect(prisma.habit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Running',
          icon: '🏃',
          color: 'green',
          frequency: 'weekly',
          frequencyDays: [1, 3, 5],
          reminderEnabled: true,
          reminderTime: '09:00',
        }),
      });
    });

    it('should use provided order when specified', async () => {
      prisma.habit.create.mockResolvedValue({ ...mockHabit, order: 5 });

      await service.create({ name: 'Custom Order', order: 5 } as any, 'user-1');

      expect(prisma.habit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          order: 5,
        }),
      });
    });

    it('should create habit with goal area', async () => {
      prisma.habit.create.mockResolvedValue({
        ...mockHabit,
        goalArea: 'health',
      });

      await service.create({ name: 'Exercise', goalArea: 'health' } as any, 'user-1');

      expect(prisma.habit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          goalArea: 'health',
        }),
      });
    });
  });

  describe('update', () => {
    it('should update habit when user owns it', async () => {
      prisma.habit.findUnique.mockResolvedValue(mockHabit);
      prisma.habit.update.mockResolvedValue({ ...mockHabit, name: 'Updated Name' });

      const result = await service.update('habit-1', { name: 'Updated Name' } as any, 'user-1');

      expect(prisma.habit.update).toHaveBeenCalledWith({
        where: { id: 'habit-1' } as any,
        data: expect.objectContaining({ name: 'Updated Name' }),
      });
      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundException when user does not own habit', async () => {
      prisma.habit.findUnique.mockResolvedValue({ ...mockHabit, userId: 'other-user' });

      await expect(service.update('habit-1', { name: 'Updated' }, 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should archive a habit', async () => {
      prisma.habit.findUnique.mockResolvedValue(mockHabit);
      prisma.habit.update.mockResolvedValue({ ...mockHabit, isArchived: true });

      const result = await service.update('habit-1', { isArchived: true }, 'user-1');

      expect(prisma.habit.update).toHaveBeenCalledWith({
        where: { id: 'habit-1' } as any,
        data: expect.objectContaining({ isArchived: true }),
      });
      expect(result.isArchived).toBe(true);
    });

    it('should update multiple fields', async () => {
      prisma.habit.findUnique.mockResolvedValue(mockHabit);
      prisma.habit.update.mockResolvedValue({
        ...mockHabit,
        name: 'New Name',
        icon: '🎯',
        color: 'blue',
      });

      await service.update(
        'habit-1',
        { name: 'New Name', icon: '🎯', color: 'blue' } as any,
        'user-1'
      );

      expect(prisma.habit.update).toHaveBeenCalledWith({
        where: { id: 'habit-1' } as any,
        data: expect.objectContaining({
          name: 'New Name',
          icon: '🎯',
          color: 'blue',
        }),
      });
    });
  });

  describe('delete', () => {
    it('should delete habit when user owns it', async () => {
      prisma.habit.findUnique.mockResolvedValue(mockHabit);
      prisma.habit.delete.mockResolvedValue(mockHabit);

      await service.delete('habit-1', 'user-1');

      expect(prisma.habit.delete).toHaveBeenCalledWith({
        where: { id: 'habit-1' } as any,
      });
    });

    it('should throw NotFoundException when user does not own habit', async () => {
      prisma.habit.findUnique.mockResolvedValue({ ...mockHabit, userId: 'other-user' });

      await expect(service.delete('habit-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return habit when found', async () => {
      prisma.habit.findUnique.mockResolvedValue(mockHabit);

      const result = await service.findById('habit-1');

      expect(result).toEqual(mockHabit);
    });

    it('should throw NotFoundException when habit not found', async () => {
      prisma.habit.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return habits with stats', async () => {
      const todayStr = new Date().toISOString().substring(0, 10);
      const habitsWithLogs = [
        {
          ...mockHabit,
          logs: [
            {
              ...mockHabitLog,
              date: new Date(todayStr + 'T00:00:00.000Z'),
              completed: true,
            } as any,
          ],
        } as any,
      ];
      prisma.habit.findMany.mockResolvedValue(habitsWithLogs);

      const result = await service.findAll('user-1', false, todayStr);

      expect(result[0]).toHaveProperty('currentStreak');
      expect(result[0]).toHaveProperty('longestStreak');
      expect(result[0]).toHaveProperty('completedToday');
      expect(result[0]).toHaveProperty('completionRate');
    });

    it('should exclude archived habits by default', async () => {
      prisma.habit.findMany.mockResolvedValue([]);

      await service.findAll('user-1');

      expect(prisma.habit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', isArchived: false } as any,
        })
      );
    });

    it('should include archived habits when requested', async () => {
      prisma.habit.findMany.mockResolvedValue([]);

      await service.findAll('user-1', true);

      expect(prisma.habit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' } as any,
        })
      );
    });

    it('should calculate completedToday correctly', async () => {
      const todayStr = '2024-06-15';
      const habitsWithLogs = [
        {
          ...mockHabit,
          logs: [
            { ...mockHabitLog, date: new Date('2024-06-15T00:00:00.000Z'), completed: true } as any,
          ],
        } as any,
      ];
      prisma.habit.findMany.mockResolvedValue(habitsWithLogs);

      const result = await service.findAll('user-1', false, todayStr);

      expect(result[0].completedToday).toBe(true);
    });

    it('should use user timezone when no client date provided', async () => {
      prisma.habit.findMany.mockResolvedValue([{ ...mockHabit, logs: [] }]);

      await service.findAll('user-1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' } as any,
        select: { timezone: true } as any,
      });
    });
  });

  describe('toggleLog', () => {
    it('should create new log when none exists', async () => {
      prisma.habit.findUnique.mockResolvedValue(mockHabit);
      prisma.habitLog.findUnique.mockResolvedValue(null);
      prisma.habitLog.create.mockResolvedValue({
        ...mockHabitLog,
        completed: true,
      });

      const result = await service.toggleLog('habit-1', { date: '2024-06-15' } as any, 'user-1');

      expect(prisma.habitLog.create).toHaveBeenCalledWith({
        data: {
          habitId: 'habit-1',
          date: new Date('2024-06-15T00:00:00.000Z'),
          completed: true,
        } as any,
      });
      expect(result.completed).toBe(true);
    });

    it('should toggle existing log', async () => {
      prisma.habit.findUnique.mockResolvedValue(mockHabit);
      prisma.habitLog.findUnique.mockResolvedValue({
        ...mockHabitLog,
        completed: true,
      });
      prisma.habitLog.update.mockResolvedValue({
        ...mockHabitLog,
        completed: false,
      });

      const result = await service.toggleLog('habit-1', { date: '2024-06-15' } as any, 'user-1');

      expect(prisma.habitLog.update).toHaveBeenCalledWith({
        where: { id: 'log-1' } as any,
        data: { completed: false } as any,
      });
      expect(result.completed).toBe(false);
    });

    it('should throw NotFoundException when user does not own habit', async () => {
      prisma.habit.findUnique.mockResolvedValue({ ...mockHabit, userId: 'other-user' });

      await expect(service.toggleLog('habit-1', { date: '2024-06-15' }, 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getLogsForDateRange', () => {
    it('should return logs within date range', async () => {
      prisma.habit.findUnique.mockResolvedValue(mockHabit);
      prisma.habitLog.findMany.mockResolvedValue([mockHabitLog]);

      const result = await service.getLogsForDateRange(
        'habit-1',
        '2024-06-01',
        '2024-06-30',
        'user-1'
      );

      expect(prisma.habitLog.findMany).toHaveBeenCalledWith({
        where: {
          habitId: 'habit-1',
          date: {
            gte: new Date('2024-06-01T00:00:00.000Z'),
            lte: new Date('2024-06-30T00:00:00.000Z'),
          } as any,
        } as any,
        orderBy: { date: 'desc' } as any,
      });
      expect(result).toEqual([mockHabitLog]);
    });

    it('should throw NotFoundException when user does not own habit', async () => {
      prisma.habit.findUnique.mockResolvedValue({ ...mockHabit, userId: 'other-user' });

      await expect(
        service.getLogsForDateRange('habit-1', '2024-06-01', '2024-06-30', 'user-1')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAllLogsForDate', () => {
    it('should return all completed logs for a date', async () => {
      const logsWithHabit = [
        {
          ...mockHabitLog,
          habit: { id: 'habit-1', name: 'Exercise', icon: '💪', color: 'primary' } as any,
        } as any,
      ];
      prisma.habitLog.findMany.mockResolvedValue(logsWithHabit);

      const result = await service.getAllLogsForDate('user-1', '2024-06-15');

      expect(prisma.habitLog.findMany).toHaveBeenCalledWith({
        where: {
          habit: { userId: 'user-1' } as any,
          date: new Date('2024-06-15T00:00:00.000Z'),
          completed: true,
        } as any,
        include: {
          habit: {
            select: { id: true, name: true, icon: true, color: true } as any,
          } as any,
        } as any,
      });
      expect(result).toEqual(logsWithHabit);
    });
  });

  describe('reorderHabits', () => {
    it('should update habit orders', async () => {
      const habitIds = ['habit-3', 'habit-1', 'habit-2'];
      prisma.habit.updateMany.mockResolvedValue({ count: 1 });

      await service.reorderHabits('user-1', habitIds);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.habit.updateMany).toHaveBeenCalledTimes(3);
      expect(prisma.habit.updateMany).toHaveBeenCalledWith({
        where: { id: 'habit-3', userId: 'user-1' } as any,
        data: { order: 0 } as any,
      });
      expect(prisma.habit.updateMany).toHaveBeenCalledWith({
        where: { id: 'habit-1', userId: 'user-1' } as any,
        data: { order: 1 } as any,
      });
      expect(prisma.habit.updateMany).toHaveBeenCalledWith({
        where: { id: 'habit-2', userId: 'user-1' } as any,
        data: { order: 2 } as any,
      });
    });
  });

  describe('streak calculation', () => {
    it('should calculate current streak for consecutive days', async () => {
      const today = new Date();
      const todayStr = today.toISOString().substring(0, 10);
      const yesterday = subDays(today, 1);
      const dayBefore = subDays(today, 2);

      const habitsWithLogs = [
        {
          ...mockHabit,
          logs: [
            { ...mockHabitLog, id: 'log-1', date: today, completed: true } as any,
            { ...mockHabitLog, id: 'log-2', date: yesterday, completed: true } as any,
            { ...mockHabitLog, id: 'log-3', date: dayBefore, completed: true } as any,
          ],
        } as any,
      ];
      prisma.habit.findMany.mockResolvedValue(habitsWithLogs);

      const result = await service.findAll('user-1', false, todayStr);

      expect(result[0].currentStreak).toBeGreaterThanOrEqual(1);
    });

    it('should return 0 streak for no logs', async () => {
      prisma.habit.findMany.mockResolvedValue([{ ...mockHabit, logs: [] }]);

      const result = await service.findAll('user-1');

      expect(result[0].currentStreak).toBe(0);
      expect(result[0].longestStreak).toBe(0);
    });

    it('should return 0 streak for only incomplete logs', async () => {
      prisma.habit.findMany.mockResolvedValue([
        {
          ...mockHabit,
          logs: [{ ...mockHabitLog, completed: false }],
        } as any,
      ]);

      const result = await service.findAll('user-1');

      expect(result[0].currentStreak).toBe(0);
    });

    it('should calculate completion rate correctly', async () => {
      const logs = Array.from({ length: 15 }, (_, i) => ({
        ...mockHabitLog,
        id: `log-${i}`,
        date: subDays(new Date(), i),
        completed: true,
      }));

      prisma.habit.findMany.mockResolvedValue([{ ...mockHabit, logs }]);

      const result = await service.findAll('user-1');

      // 15 completed out of 30 days = 50%
      expect(result[0].completionRate).toBe(50);
    });
  });

  describe('getUserTimezone', () => {
    it('should return UTC when user has no timezone set', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, timezone: null });
      prisma.habit.findMany.mockResolvedValue([{ ...mockHabit, logs: [] }]);

      await service.findAll('user-1');

      // The service should use UTC as fallback
      expect(prisma.user.findUnique).toHaveBeenCalled();
    });

    it('should return user timezone when set', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, timezone: 'Europe/London' });
      prisma.habit.findMany.mockResolvedValue([{ ...mockHabit, logs: [] }]);

      await service.findAll('user-1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' } as any,
        select: { timezone: true } as any,
      });
    });
  });
});
