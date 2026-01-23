// Types
export * from './types';

// Layout & Helpers
export {
  Layout,
  HighlightBox,
  MetricsGrid,
  InfoRows,
  StreakBadge,
  Avatar,
  BulletList,
} from './components/Layout';

// Auth & Onboarding Templates
export { WelcomeEmail } from './templates/welcome';
export { VerifyEmail } from './templates/verify-email';
export { ResetPassword } from './templates/reset-password';
export { PasswordChanged } from './templates/password-changed';

// Collaboration Templates
export { WorkspaceInvite } from './templates/workspace-invite';

// Habit & Reminder Templates
export { HabitReminder } from './templates/habit-reminder';
export { JournalNudge } from './templates/journal-nudge';

// Summary Templates
export { WeeklySummaryEmail } from './templates/weekly-summary';
export { MonthlySummaryEmail } from './templates/monthly-summary';
export { YearlyReviewEmail } from './templates/yearly-review';

// Security Templates
export { SecurityAlertEmail } from './templates/journal-security';

// Achievement Templates
export { StreakMilestoneEmail } from './templates/streak-milestone';
export { GoalCompletedEmail } from './templates/goal-completed';

// AI & Insights Templates
export { AiInsightEmail } from './templates/ai-insight';

// Re-engagement Templates
export { InactivityReminderEmail } from './templates/inactivity-reminder';

// Task Templates
export { TaskDueReminderEmail } from './templates/task-due-reminder';
