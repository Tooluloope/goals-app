import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ data: { id: 'email-123' }, error: null }),
    },
  })),
}));

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    // Set environment variables for testing
    process.env.RESEND_API_KEY = 'test-api-key';
    process.env.EMAIL_FROM = 'test@goals-app.com';
    process.env.EMAIL_FROM_NAME = 'Goals App Test';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    delete process.env.EMAIL_FROM_NAME;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email', async () => {
      const result = await service.sendWelcomeEmail('user@example.com', 'John');
      expect(result.success).toBe(true);
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with token', async () => {
      const result = await service.sendVerificationEmail(
        'user@example.com',
        'John',
        'verify-token-123'
      );
      expect(result.success).toBe(true);
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with token', async () => {
      const result = await service.sendPasswordResetEmail(
        'user@example.com',
        'John',
        'reset-token-123'
      );
      expect(result.success).toBe(true);
    });
  });

  describe('sendPasswordChangedEmail', () => {
    it('should send password changed notification', async () => {
      const result = await service.sendPasswordChangedEmail('user@example.com', 'John');
      expect(result.success).toBe(true);
    });
  });

  describe('sendSecurityAlertEmail', () => {
    it('should send security alert with details', async () => {
      const result = await service.sendSecurityAlertEmail('user@example.com', 'John', {
        location: 'New York, USA',
        device: 'Chrome on Windows',
        time: '2024-01-15T10:30:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('should handle missing details', async () => {
      const result = await service.sendSecurityAlertEmail('user@example.com', 'John', {});
      expect(result.success).toBe(true);
    });
  });

  describe('sendWorkspaceInviteEmail', () => {
    it('should send workspace invite', async () => {
      const result = await service.sendWorkspaceInviteEmail(
        'invitee@example.com',
        'John',
        'Family Goals',
        'invite-token-123'
      );
      expect(result.success).toBe(true);
    });
  });

  describe('sendHabitReminderEmail', () => {
    it('should send habit reminder', async () => {
      const result = await service.sendHabitReminderEmail(
        'user@example.com',
        'John',
        'Exercise',
        7
      );
      expect(result.success).toBe(true);
    });
  });

  describe('sendJournalNudgeEmail', () => {
    it('should send journal nudge', async () => {
      const result = await service.sendJournalNudgeEmail('user@example.com', 'John');
      expect(result.success).toBe(true);
    });
  });

  describe('sendStreakMilestoneEmail', () => {
    it('should send streak milestone for 7 days', async () => {
      const result = await service.sendStreakMilestoneEmail(
        'user@example.com',
        'John',
        'Exercise',
        7,
        '7'
      );
      expect(result.success).toBe(true);
    });

    it('should send streak milestone for 30 days', async () => {
      const result = await service.sendStreakMilestoneEmail(
        'user@example.com',
        'John',
        'Meditation',
        30,
        '30'
      );
      expect(result.success).toBe(true);
    });

    it('should send streak milestone for 100 days', async () => {
      const result = await service.sendStreakMilestoneEmail(
        'user@example.com',
        'John',
        'Reading',
        100,
        '100'
      );
      expect(result.success).toBe(true);
    });

    it('should send streak milestone for 365 days', async () => {
      const result = await service.sendStreakMilestoneEmail(
        'user@example.com',
        'John',
        'Daily Walk',
        365,
        '365'
      );
      expect(result.success).toBe(true);
    });
  });

  describe('sendWeeklySummaryEmail', () => {
    it('should send weekly summary', async () => {
      const result = await service.sendWeeklySummaryEmail('user@example.com', 'John', {
        periodLabel: 'Week of Jan 8 - Jan 14',
        highlights: ['Completed 5 tasks', 'Maintained 7-day streak'],
        metrics: [
          { label: 'Tasks Done', value: '5' },
          { label: 'Habits Logged', value: '21' },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sendMonthlySummaryEmail', () => {
    it('should send monthly summary', async () => {
      const result = await service.sendMonthlySummaryEmail('user@example.com', 'John', {
        periodLabel: 'December 2024',
        highlights: ['Finished 2 projects'],
        metrics: [{ label: 'Goals Completed', value: '2' }],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sendYearlyReviewEmail', () => {
    it('should send yearly review', async () => {
      const result = await service.sendYearlyReviewEmail('user@example.com', 'John', {
        periodLabel: '2024',
        highlights: ['Amazing year of growth!'],
        metrics: [{ label: 'Goals Achieved', value: '12' }],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sendTaskDueReminderEmail', () => {
    it('should send task due reminder', async () => {
      const result = await service.sendTaskDueReminderEmail(
        'user@example.com',
        'John',
        'Complete feature X',
        'Main Project'
      );
      expect(result.success).toBe(true);
    });

    it('should handle task without project', async () => {
      const result = await service.sendTaskDueReminderEmail(
        'user@example.com',
        'John',
        'Personal task'
      );
      expect(result.success).toBe(true);
    });
  });

  describe('sendGoalCompletedEmail', () => {
    it('should send goal completed email', async () => {
      const result = await service.sendGoalCompletedEmail(
        'user@example.com',
        'John',
        'Launch MVP',
        undefined,
        15,
        30
      );
      expect(result.success).toBe(true);
    });
  });

  describe('sendAiInsightEmail', () => {
    it('should send AI insight email', async () => {
      const result = await service.sendAiInsightEmail('user@example.com', 'John', {
        title: 'Pattern Detected',
        content: 'You are most productive on Tuesdays',
        type: 'pattern',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('sendInactivityReminderEmail', () => {
    it('should send inactivity reminder', async () => {
      const result = await service.sendInactivityReminderEmail(
        'user@example.com',
        'John',
        14,
        'Jan 1, 2024'
      );
      expect(result.success).toBe(true);
    });
  });

  describe('sendStaleProjectEmail', () => {
    it('should send stale project alert', async () => {
      const result = await service.sendStaleProjectEmail(
        'user@example.com',
        'John',
        'project-123',
        'Side Project',
        21,
        'in-progress'
      );
      expect(result.success).toBe(true);
    });
  });

  describe('sendReviewDueEmail', () => {
    it('should send review due reminder', async () => {
      const result = await service.sendReviewDueEmail(
        'user@example.com',
        'John',
        'project-123',
        'Main Project',
        'weekly',
        10,
        'weekly'
      );
      expect(result.success).toBe(true);
    });
  });

  describe('dev mode (no API key)', () => {
    beforeEach(async () => {
      delete process.env.RESEND_API_KEY;

      const module: TestingModule = await Test.createTestingModule({
        providers: [EmailService],
      }).compile();

      service = module.get<EmailService>(EmailService);
    });

    it('should log email instead of sending in dev mode', async () => {
      const result = await service.sendWelcomeEmail('user@example.com', 'John');
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('dev-mode-no-send');
    });
  });
});
