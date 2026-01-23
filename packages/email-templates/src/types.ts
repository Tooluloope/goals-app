export type CTA = { label: string; href: string };

export type BaseProps = {
  toName?: string;
  appName?: string;
  supportUrl?: string;
  unsubscribeUrl?: string;
  logoUrl?: string;
};

export type ActionProps = BaseProps & {
  action?: CTA;
};

export type SummaryProps = ActionProps & {
  periodLabel: string;
  highlights?: string[];
  metrics?: { label: string; value: string }[];
};

export type ReminderProps = ActionProps & {
  habitName?: string;
  streak?: number;
  journalDate?: string;
};

export type InviteProps = ActionProps & {
  inviterName?: string;
  workspaceName?: string;
  inviterAvatar?: string;
};

export type SecurityProps = ActionProps & {
  location?: string;
  device?: string;
  time?: string;
};

export type StreakProps = ActionProps & {
  habitName?: string;
  streakDays: number;
  milestone?: '7' | '30' | '100' | '365';
};

export type GoalProps = ActionProps & {
  goalName: string;
  projectName?: string;
  completedTasks?: number;
  totalDays?: number;
};

export type InsightProps = ActionProps & {
  insightTitle: string;
  insightContent: string;
  insightType?: 'pattern' | 'recommendation' | 'celebration' | 'milestone';
};

export type InactivityProps = ActionProps & {
  daysSinceActive: number;
  lastActivity?: string;
};

export type ThemeType = 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'blue';
