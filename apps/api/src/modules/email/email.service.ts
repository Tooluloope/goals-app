import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

import type {
  BaseEmailData,
  EmailTemplateKey,
  GoalData,
  InactivityData,
  InsightData,
  InviteData,
  ReminderData,
  ReviewDueData,
  SecurityData,
  StaleProjectData,
  StreakData,
  SummaryData,
} from '../../emails/templates';
import { emailTemplates } from '../../emails/templates';

// Union type of all possible email data
type EmailData =
  | BaseEmailData
  | SummaryData
  | ReminderData
  | InviteData
  | SecurityData
  | StreakData
  | GoalData
  | InsightData
  | InactivityData
  | StaleProjectData
  | ReviewDueData;

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly appUrl: string;
  private readonly marketingUrl: string;
  private static sendQueue: Promise<void> = Promise.resolve();
  private static lastSentAt = 0;
  private static readonly minIntervalMs = Math.max(
    100,
    parseInt(process.env.EMAIL_MIN_INTERVAL_MS || '500', 10)
  );

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@alignia.app';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Alignia';
    this.appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    this.marketingUrl =
      process.env.NEXT_PUBLIC_MARKETING_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://alignia.xyz';

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Email service initialized with Resend');
    } else {
      this.resend = null;
      this.logger.warn('RESEND_API_KEY not set - emails will be logged but not sent');
    }
  }

  private async sendEmail<T extends EmailData>(
    to: string,
    type: EmailTemplateKey,
    data: T
  ): Promise<SendEmailResult> {
    const template = emailTemplates[type];
    if (!template) {
      this.logger.error(`Unknown email template type: ${type}`);
      return { success: false, error: `Unknown template: ${type}` };
    }

    // Merge with default data
    const emailData: T & BaseEmailData = {
      appName: this.fromName,
      supportUrl: `${this.marketingUrl}/contact`,
      unsubscribeUrl: `${this.appUrl}/settings#email-preferences`,
      ...data,
    };

    // Template functions accept their specific data type which extends BaseEmailData
    // We use a type assertion here because the template lookup is dynamic
    const typedTemplate = template as {
      subject: (data: T & BaseEmailData) => string;
      html: (data: T & BaseEmailData) => string;
      text: (data: T & BaseEmailData) => string;
    };

    const subject = typedTemplate.subject(emailData);
    const html = typedTemplate.html(emailData);
    const text = typedTemplate.text(emailData);

    // If no Resend API key, log the email instead
    if (!this.resend) {
      this.logger.log(`[DEV] Email would be sent:
        To: ${to}
        Subject: ${subject}
        Type: ${type}
        Data: ${JSON.stringify(data, null, 2)}
      `);
      return { success: true, messageId: 'dev-mode-no-send' };
    }

    return this.runThrottled(async () => {
      try {
        const { data: result, error } = await this.resend!.emails.send({
          from: `${this.fromName} <${this.fromEmail}>`,
          to,
          subject,
          html,
          text,
        });

        if (error) {
          this.logger.error(`Failed to send email to ${to}: ${error.message}`);
          return { success: false, error: error.message };
        }

        this.logger.log(`Email sent successfully to ${to} (${type}): ${result?.id}`);
        return { success: true, messageId: result?.id };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Email send error: ${message}`);
        return { success: false, error: message };
      }
    });
  }

  private async runThrottled<T>(task: () => Promise<T>): Promise<T> {
    if (process.env.NODE_ENV === 'test') {
      return task();
    }

    return new Promise<T>((resolve, reject) => {
      EmailService.sendQueue = EmailService.sendQueue
        .then(async () => {
          const now = Date.now();
          const wait = Math.max(0, EmailService.lastSentAt + EmailService.minIntervalMs - now);
          if (wait > 0) {
            await new Promise((waitResolve) => setTimeout(waitResolve, wait));
          }

          try {
            const result = await task();
            EmailService.lastSentAt = Date.now();
            resolve(result);
          } catch (error) {
            EmailService.lastSentAt = Date.now();
            reject(error);
          }
        })
        .catch((error) => {
          this.logger.warn(`Email rate limiter queue error: ${String(error)}`);
          EmailService.lastSentAt = Date.now();
        });
    });
  }

  // ============================================================
  // AUTHENTICATION EMAILS
  // ============================================================

  async sendWelcomeEmail(to: string, name: string): Promise<SendEmailResult> {
    return this.sendEmail<BaseEmailData>(to, 'welcome', {
      toName: name,
      actionUrl: `${this.appUrl}/dashboard`,
    });
  }

  async sendVerificationEmail(to: string, name: string, token: string): Promise<SendEmailResult> {
    return this.sendEmail<BaseEmailData>(to, 'verifyEmail', {
      toName: name,
      actionUrl: `${this.appUrl}/auth/verify-email?token=${token}`,
    });
  }

  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<SendEmailResult> {
    return this.sendEmail<BaseEmailData>(to, 'resetPassword', {
      toName: name,
      actionUrl: `${this.appUrl}/auth/reset-password?token=${token}`,
    });
  }

  async sendPasswordChangedEmail(to: string, name: string): Promise<SendEmailResult> {
    return this.sendEmail<BaseEmailData>(to, 'passwordChanged', {
      toName: name,
      actionUrl: `${this.appUrl}/settings#password`,
    });
  }

  async sendMagicLinkEmail(
    to: string,
    name: string | null,
    token: string
  ): Promise<SendEmailResult> {
    return this.sendEmail<BaseEmailData>(to, 'magicLink', {
      toName: name || undefined,
      actionUrl: `${this.appUrl}/auth/magic-link/verify?token=${token}`,
    });
  }

  // ============================================================
  // SECURITY EMAILS
  // ============================================================

  async sendSecurityAlertEmail(
    to: string,
    name: string,
    details: { location?: string; device?: string; time?: string }
  ): Promise<SendEmailResult> {
    return this.sendEmail<SecurityData>(to, 'securityAlert', {
      toName: name,
      location: details.location || 'Unknown',
      device: details.device || 'Unknown device',
      time: details.time || new Date().toISOString(),
      actionUrl: `${this.appUrl}/settings#security`,
    });
  }

  // ============================================================
  // WORKSPACE EMAILS
  // ============================================================

  async sendWorkspaceInviteEmail(
    to: string,
    inviterName: string,
    workspaceName: string,
    inviteToken: string
  ): Promise<SendEmailResult> {
    return this.sendEmail<InviteData>(to, 'workspaceInvite', {
      inviterName,
      workspaceName,
      actionUrl: `${this.appUrl}/invite/accept?token=${inviteToken}`,
    });
  }

  // ============================================================
  // HABIT & JOURNAL REMINDERS
  // ============================================================

  async sendHabitReminderEmail(
    to: string,
    name: string,
    habitName: string,
    streak: number
  ): Promise<SendEmailResult> {
    return this.sendEmail<ReminderData>(to, 'habitReminder', {
      toName: name,
      habitName,
      streak,
      actionUrl: `${this.appUrl}/rhythm`,
    });
  }

  async sendJournalNudgeEmail(to: string, name: string): Promise<SendEmailResult> {
    return this.sendEmail<ReminderData>(to, 'journalNudge', {
      toName: name,
      journalDate: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
      actionUrl: `${this.appUrl}/rhythm`,
    });
  }

  async sendStreakMilestoneEmail(
    to: string,
    name: string,
    habitName: string,
    streakDays: number,
    milestone: '7' | '30' | '100' | '365'
  ): Promise<SendEmailResult> {
    return this.sendEmail<StreakData>(to, 'streakMilestone', {
      toName: name,
      habitName,
      streakDays,
      milestone,
      actionUrl: `${this.appUrl}/habits`,
    });
  }

  // ============================================================
  // SUMMARY EMAILS
  // ============================================================

  async sendWeeklySummaryEmail(
    to: string,
    name: string,
    summary: {
      periodLabel: string;
      highlights?: string[];
      metrics?: { label: string; value: string }[];
    }
  ): Promise<SendEmailResult> {
    return this.sendEmail<SummaryData>(to, 'weeklySummary', {
      toName: name,
      periodLabel: summary.periodLabel,
      highlights: summary.highlights,
      metrics: summary.metrics,
      actionUrl: `${this.appUrl}/reviews/weekly`,
    });
  }

  async sendMonthlySummaryEmail(
    to: string,
    name: string,
    summary: {
      periodLabel: string;
      highlights?: string[];
      metrics?: { label: string; value: string }[];
    }
  ): Promise<SendEmailResult> {
    return this.sendEmail<SummaryData>(to, 'monthlySummary', {
      toName: name,
      periodLabel: summary.periodLabel,
      highlights: summary.highlights,
      metrics: summary.metrics,
      actionUrl: `${this.appUrl}/reviews/monthly`,
    });
  }

  async sendYearlyReviewEmail(
    to: string,
    name: string,
    summary: {
      periodLabel: string;
      highlights?: string[];
      metrics?: { label: string; value: string }[];
    }
  ): Promise<SendEmailResult> {
    return this.sendEmail<SummaryData>(to, 'yearlyReview', {
      toName: name,
      periodLabel: summary.periodLabel,
      highlights: summary.highlights,
      metrics: summary.metrics,
      actionUrl: `${this.appUrl}/reviews/yearly`,
    });
  }

  // ============================================================
  // TASK EMAILS
  // ============================================================

  async sendTaskDueReminderEmail(
    to: string,
    name: string,
    goalName: string,
    projectName?: string
  ): Promise<SendEmailResult> {
    return this.sendEmail<GoalData>(to, 'taskDueReminder', {
      toName: name,
      goalName,
      projectName,
      actionUrl: `${this.appUrl}/tasks`,
    });
  }

  async sendGoalCompletedEmail(
    to: string,
    name: string,
    goalName: string,
    projectName?: string,
    completedTasks?: number,
    totalDays?: number
  ): Promise<SendEmailResult> {
    return this.sendEmail<GoalData>(to, 'goalCompleted', {
      toName: name,
      goalName,
      projectName,
      completedTasks,
      totalDays,
      actionUrl: `${this.appUrl}/projects`,
    });
  }

  // ============================================================
  // AI & INSIGHTS EMAILS
  // ============================================================

  async sendAiInsightEmail(
    to: string,
    name: string,
    insight: {
      title: string;
      content: string;
      type?: 'pattern' | 'recommendation' | 'celebration' | 'milestone';
    }
  ): Promise<SendEmailResult> {
    return this.sendEmail<InsightData>(to, 'aiInsight', {
      toName: name,
      insightTitle: insight.title,
      insightContent: insight.content,
      insightType: insight.type,
      actionUrl: `${this.appUrl}/ai`,
    });
  }

  // ============================================================
  // RE-ENGAGEMENT EMAILS
  // ============================================================

  async sendInactivityReminderEmail(
    to: string,
    name: string,
    daysSinceActive: number,
    lastActivity?: string
  ): Promise<SendEmailResult> {
    return this.sendEmail<InactivityData>(to, 'inactivityReminder', {
      toName: name,
      daysSinceActive,
      lastActivity,
      actionUrl: `${this.appUrl}/dashboard`,
    });
  }

  // ============================================================
  // PROJECT MANAGEMENT EMAILS
  // ============================================================

  async sendStaleProjectEmail(
    to: string,
    name: string,
    projectId: string,
    projectName: string,
    daysSinceUpdate: number,
    projectStatus?: string
  ): Promise<SendEmailResult> {
    return this.sendEmail<StaleProjectData>(to, 'staleProject', {
      toName: name,
      projectName,
      daysSinceUpdate,
      projectStatus,
      actionUrl: `${this.appUrl}/project/${projectId}`,
    });
  }

  async sendReviewDueEmail(
    to: string,
    name: string,
    projectId: string,
    projectName: string,
    reviewType: 'weekly' | 'monthly' | 'cadence',
    daysSinceLastReview: number,
    cadence?: string
  ): Promise<SendEmailResult> {
    return this.sendEmail<ReviewDueData>(to, 'reviewDue', {
      toName: name,
      projectName,
      reviewType,
      daysSinceLastReview,
      cadence,
      actionUrl: `${this.appUrl}/project/${projectId}`,
    });
  }
}
