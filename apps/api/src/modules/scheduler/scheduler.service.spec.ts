import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerService } from './scheduler.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';

describe('SchedulerService', () => {
  let service: SchedulerService;
  let prisma: any;
  let emailService: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    timezone: 'America/New_York',
    settings: {
      emailPreferences: {
        habitReminders: true,
        taskDueReminders: true,
        weeklySummary: true,
        monthlySummary: true,
        staleProjectAlerts: true,
        reviewDueReminders: true,
        inactivityReminders: false,
      },
    },
  };

  const mockHabit = {
    id: 'habit-1',
    userId: 'user-1',
    name: 'Exercise',
    isArchived: false,
    reminderEnabled: true,
    logs: [],
  };

  const mockTask = {
    id: 'task-1',
    title: 'Complete feature',
    statusId: 'in-progress',
    dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
    project: { name: 'Main Project' },
  };

  const mockProject = {
    id: 'project-1',
    name: 'Test Project',
    statusId: 'in-progress',
    cadenceId: 'cadence-weekly',
    lastReviewDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    updatedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findMany: jest.fn().mockResolvedValue([mockUser]),
        findUnique: jest.fn().mockResolvedValue(mockUser),
      },
      habit: {
        findMany: jest.fn().mockResolvedValue([mockHabit]),
      },
      habitLog: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
      },
      journalEntry: {
        findFirst: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
      },
      task: {
        findMany: jest.fn().mockResolvedValue([mockTask]),
        findFirst: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(5),
      },
      project: {
        findMany: jest.fn().mockResolvedValue([mockProject]),
        count: jest.fn().mockResolvedValue(1),
      },
    };

    const mockEmailService = {
      sendHabitReminderEmail: jest.fn().mockResolvedValue({ success: true }),
      sendJournalNudgeEmail: jest.fn().mockResolvedValue({ success: true }),
      sendTaskDueReminderEmail: jest.fn().mockResolvedValue({ success: true }),
      sendWeeklySummaryEmail: jest.fn().mockResolvedValue({ success: true }),
      sendMonthlySummaryEmail: jest.fn().mockResolvedValue({ success: true }),
      sendStaleProjectEmail: jest.fn().mockResolvedValue({ success: true }),
      sendReviewDueEmail: jest.fn().mockResolvedValue({ success: true }),
      sendInactivityReminderEmail: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);
    prisma = module.get(PrismaService);
    emailService = module.get(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('timezone helpers', () => {
    it('should have getTimezonesAtHour method', () => {
      expect(service['getTimezonesAtHour']).toBeDefined();
    });

    it('should have getTimezonesAtHourAndDay method', () => {
      expect(service['getTimezonesAtHourAndDay']).toBeDefined();
    });

    it('should have getTimezonesAtHourAndDayOfMonth method', () => {
      expect(service['getTimezonesAtHourAndDayOfMonth']).toBeDefined();
    });

    it('getTimezonesAtHour should return array of timezones', () => {
      const result = service['getTimezonesAtHour'](12);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getUsersInTimezones', () => {
    it('should return empty array when no timezones provided', async () => {
      const result = await service['getUsersInTimezones']([], 'habitReminders');
      expect(result).toEqual([]);
    });

    it('should filter users by timezone', async () => {
      const _result = await service['getUsersInTimezones'](['America/New_York'], 'habitReminders');
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { timezone: { in: ['America/New_York'] } },
        select: expect.any(Object),
      });
    });

    it('should respect email preferences', async () => {
      const userWithDisabledPref = {
        ...mockUser,
        settings: {
          emailPreferences: { habitReminders: false },
        },
      };
      prisma.user.findMany.mockResolvedValueOnce([userWithDisabledPref]);

      const result = await service['getUsersInTimezones'](['America/New_York'], 'habitReminders');

      expect(result).toHaveLength(0);
    });

    it('should use default value when preference not set', async () => {
      const userWithNoPref = {
        ...mockUser,
        settings: {},
      };
      prisma.user.findMany.mockResolvedValueOnce([userWithNoPref]);

      const result = await service['getUsersInTimezones'](
        ['America/New_York'],
        'habitReminders',
        true // default to true
      );

      expect(result).toHaveLength(1);
    });
  });

  describe('sendHabitReminders', () => {
    it('should be defined', () => {
      expect(service.sendHabitReminders).toBeDefined();
    });

    it('should query habits for users with reminderEnabled', async () => {
      // Mock timezone match
      jest.spyOn(service as any, 'getTimezonesAtHour').mockReturnValue(['America/New_York']);

      await service.sendHabitReminders();

      expect(prisma.habit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-1',
            isArchived: false,
            reminderEnabled: true,
          }),
        })
      );
    });

    it('should send email for incomplete habits', async () => {
      jest.spyOn(service as any, 'getTimezonesAtHour').mockReturnValue(['America/New_York']);
      prisma.habit.findMany.mockResolvedValueOnce([{ ...mockHabit, logs: [] }]);

      await service.sendHabitReminders();

      expect(emailService.sendHabitReminderEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        'Exercise',
        expect.any(Number)
      );
    });

    it('should not send email when no incomplete habits', async () => {
      jest.spyOn(service as any, 'getTimezonesAtHour').mockReturnValue(['America/New_York']);
      const todayStr = new Date().toISOString().substring(0, 10);
      prisma.habit.findMany.mockResolvedValueOnce([
        {
          ...mockHabit,
          logs: [{ date: new Date(todayStr + 'T00:00:00.000Z'), completed: true }],
        },
      ]);

      await service.sendHabitReminders();

      expect(emailService.sendHabitReminderEmail).not.toHaveBeenCalled();
    });

    it('should exit early when no matching timezones', async () => {
      jest.spyOn(service as any, 'getTimezonesAtHour').mockReturnValue([]);

      await service.sendHabitReminders();

      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });
  });

  describe('sendJournalNudges', () => {
    it('should be defined', () => {
      expect(service.sendJournalNudges).toBeDefined();
    });

    it('should send nudge when no journal entry today', async () => {
      jest.spyOn(service as any, 'getTimezonesAtHour').mockReturnValue(['America/New_York']);
      prisma.journalEntry.findFirst.mockResolvedValueOnce(null);

      await service.sendJournalNudges();

      expect(emailService.sendJournalNudgeEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User'
      );
    });

    it('should not send nudge when journal entry exists', async () => {
      jest.spyOn(service as any, 'getTimezonesAtHour').mockReturnValue(['America/New_York']);
      prisma.journalEntry.findFirst.mockResolvedValueOnce({ id: 'entry-1' });

      await service.sendJournalNudges();

      expect(emailService.sendJournalNudgeEmail).not.toHaveBeenCalled();
    });
  });

  describe('sendTaskDueReminders', () => {
    it('should be defined', () => {
      expect(service.sendTaskDueReminders).toBeDefined();
    });

    it('should send reminder for tasks due soon', async () => {
      jest.spyOn(service as any, 'getTimezonesAtHour').mockReturnValue(['America/New_York']);

      await service.sendTaskDueReminders();

      expect(emailService.sendTaskDueReminderEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        'Complete feature',
        'Main Project'
      );
    });
  });

  describe('sendWeeklySummaries', () => {
    it('should be defined', () => {
      expect(service.sendWeeklySummaries).toBeDefined();
    });

    it('should send summary with stats', async () => {
      jest.spyOn(service as any, 'getTimezonesAtHourAndDay').mockReturnValue(['America/New_York']);
      prisma.task.count.mockResolvedValueOnce(10);
      prisma.habitLog.count.mockResolvedValueOnce(5);
      prisma.journalEntry.count.mockResolvedValueOnce(3);

      await service.sendWeeklySummaries();

      expect(emailService.sendWeeklySummaryEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        expect.objectContaining({
          periodLabel: expect.any(String),
          highlights: expect.any(Array),
          metrics: expect.any(Array),
        })
      );
    });

    it('should not send when no activity', async () => {
      jest.spyOn(service as any, 'getTimezonesAtHourAndDay').mockReturnValue(['America/New_York']);
      prisma.task.count.mockResolvedValueOnce(0);
      prisma.habitLog.count.mockResolvedValueOnce(0);
      prisma.journalEntry.count.mockResolvedValueOnce(0);

      await service.sendWeeklySummaries();

      expect(emailService.sendWeeklySummaryEmail).not.toHaveBeenCalled();
    });
  });

  describe('sendStaleProjectAlerts', () => {
    it('should be defined', () => {
      expect(service.sendStaleProjectAlerts).toBeDefined();
    });

    it('should send alert for stale projects', async () => {
      jest.spyOn(service as any, 'getTimezonesAtHourAndDay').mockReturnValue(['America/New_York']);

      await service.sendStaleProjectAlerts();

      expect(emailService.sendStaleProjectEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        'project-1',
        'Test Project',
        expect.any(Number),
        'in-progress'
      );
    });
  });

  describe('sendReviewDueReminders', () => {
    it('should be defined', () => {
      expect(service.sendReviewDueReminders).toBeDefined();
    });

    it('should send reminder when review is overdue', async () => {
      jest.spyOn(service as any, 'getTimezonesAtHourAndDay').mockReturnValue(['America/New_York']);

      await service.sendReviewDueReminders();

      expect(emailService.sendReviewDueEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        'project-1',
        'Test Project',
        'cadence',
        expect.any(Number),
        'cadence-weekly'
      );
    });
  });

  describe('sendInactivityReminders', () => {
    it('should be defined', () => {
      expect(service.sendInactivityReminders).toBeDefined();
    });

    it('should default inactivityReminders to false (opt-in)', async () => {
      jest.spyOn(service as any, 'getTimezonesAtHourAndDay').mockReturnValue(['America/New_York']);

      // User has inactivityReminders: false in settings
      await service.sendInactivityReminders();

      // Should not send because user hasn't opted in
      expect(emailService.sendInactivityReminderEmail).not.toHaveBeenCalled();
    });

    it('should send reminder when user opts in and is inactive', async () => {
      jest.spyOn(service as any, 'getTimezonesAtHourAndDay').mockReturnValue(['America/New_York']);

      const userWithOptIn = {
        ...mockUser,
        settings: {
          emailPreferences: { inactivityReminders: true },
        },
      };
      prisma.user.findMany.mockResolvedValueOnce([userWithOptIn]);

      await service.sendInactivityReminders();

      expect(emailService.sendInactivityReminderEmail).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully in sendHabitReminders', async () => {
      jest.spyOn(service as any, 'getTimezonesAtHour').mockReturnValue(['America/New_York']);
      prisma.habit.findMany.mockRejectedValueOnce(new Error('DB error'));

      // Should not throw
      await expect(service.sendHabitReminders()).resolves.not.toThrow();
    });

    it('should continue processing other users if one fails', async () => {
      jest.spyOn(service as any, 'getTimezonesAtHour').mockReturnValue(['America/New_York']);

      const users = [mockUser, { ...mockUser, id: 'user-2', email: 'user2@example.com' }];
      prisma.user.findMany.mockResolvedValueOnce(users);

      // First user fails, second should still be processed
      prisma.habit.findMany
        .mockRejectedValueOnce(new Error('DB error'))
        .mockResolvedValueOnce([{ ...mockHabit, userId: 'user-2', logs: [] }]);

      await service.sendHabitReminders();

      // Should have attempted to process both users
      expect(prisma.habit.findMany).toHaveBeenCalledTimes(2);
    });
  });
});
