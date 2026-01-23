import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { render } from '@react-email/render';
import {
  WelcomeEmail,
  VerifyEmail,
  ResetPassword,
  PasswordChanged,
  WorkspaceInvite,
  HabitReminder,
  JournalNudge,
  WeeklySummaryEmail,
  MonthlySummaryEmail,
  YearlyReviewEmail,
  SecurityAlertEmail,
  StreakMilestoneEmail,
  GoalCompletedEmail,
  AiInsightEmail,
  InactivityReminderEmail,
  TaskDueReminderEmail,
} from '../src';

const templates = {
  // Auth & Onboarding
  welcome: () => <WelcomeEmail action={{ label: 'Launch app', href: '#' }} toName="Tolu" />,
  verifyEmail: () => <VerifyEmail action={{ label: 'Verify email', href: '#' }} />,
  resetPassword: () => <ResetPassword action={{ label: 'Reset password', href: '#' }} />,
  passwordChanged: () => <PasswordChanged action={{ label: 'Secure account', href: '#' }} />,

  // Collaboration
  workspaceInvite: () => (
    <WorkspaceInvite
      inviterName="Alex"
      workspaceName="Growth Squad"
      action={{ label: 'Accept invite', href: '#' }}
    />
  ),

  // Habits & Reminders
  habitReminder: () => (
    <HabitReminder
      habitName="Morning Run"
      streak={4}
      action={{ label: "Open today's habits", href: '#' }}
    />
  ),
  journalNudge: () => (
    <JournalNudge journalDate="Today" action={{ label: 'Open journal', href: '#' }} />
  ),

  // Summaries
  weeklySummary: () => (
    <WeeklySummaryEmail
      periodLabel="This week"
      metrics={[
        { label: 'Habits completed', value: '21/28' },
        { label: 'Streak', value: '5 days' },
        { label: 'Journaled', value: '4 days' },
      ]}
      highlights={['Most consistent: Morning run', 'Focus on hydration', 'Mood trend: up']}
      action={{ label: 'Open dashboard', href: '#' }}
    />
  ),
  monthlySummary: () => (
    <MonthlySummaryEmail
      periodLabel="January"
      metrics={[
        { label: 'Completion rate', value: '76%' },
        { label: 'Top habit', value: 'Reading' },
      ]}
      highlights={['Longest streak: 12 days', 'Try adding strength twice weekly']}
      action={{ label: 'See details', href: '#' }}
    />
  ),
  yearlyReview: () => (
    <YearlyReviewEmail
      periodLabel="2025"
      metrics={[
        { label: 'Total habits done', value: '612' },
        { label: 'Avg streak', value: '7 days' },
      ]}
      highlights={['Morning routine is your anchor', 'Hydration was most improved habit']}
      action={{ label: 'Open full review', href: '#' }}
    />
  ),

  // Security
  securityAlert: () => (
    <SecurityAlertEmail
      location="Lagos, NG"
      device="MacOS • Chrome"
      time="Just now"
      action={{ label: 'Review activity', href: '#' }}
    />
  ),

  // Achievements & Milestones
  streakMilestone7: () => (
    <StreakMilestoneEmail
      habitName="Morning Meditation"
      streakDays={7}
      action={{ label: 'View Your Progress', href: '#' }}
    />
  ),
  streakMilestone30: () => (
    <StreakMilestoneEmail
      habitName="Daily Exercise"
      streakDays={30}
      action={{ label: 'View Your Progress', href: '#' }}
    />
  ),
  streakMilestone100: () => (
    <StreakMilestoneEmail
      habitName="Reading"
      streakDays={100}
      action={{ label: 'View Your Progress', href: '#' }}
    />
  ),
  goalCompleted: () => (
    <GoalCompletedEmail
      goalName="Complete Q1 Product Launch"
      projectName="Marketing Campaign"
      completedTasks={24}
      totalDays={45}
      toName="Tolu"
      action={{ label: 'Set New Goal', href: '#' }}
    />
  ),

  // AI & Insights
  aiInsightPattern: () => (
    <AiInsightEmail
      insightTitle="You perform best in the mornings"
      insightContent="Based on your habit completion data, you complete 78% more habits before 10am compared to the afternoon. Consider scheduling important tasks earlier in the day."
      insightType="pattern"
      action={{ label: 'View All Insights', href: '#' }}
    />
  ),
  aiInsightCelebration: () => (
    <AiInsightEmail
      insightTitle="Incredible consistency this month!"
      insightContent="You've maintained a 90%+ completion rate for 3 weeks straight. This is your best performance yet!"
      insightType="celebration"
      action={{ label: 'View All Insights', href: '#' }}
    />
  ),

  // Re-engagement
  inactivityReminder: () => (
    <InactivityReminderEmail
      daysSinceActive={7}
      lastActivity="Completed Morning Run habit"
      toName="Tolu"
      action={{ label: 'Jump Back In', href: '#' }}
    />
  ),

  // Task Reminders
  taskDueReminder: () => (
    <TaskDueReminderEmail
      goalName="Finalize presentation slides"
      projectName="Q1 Review"
      action={{ label: 'View Task', href: '#' }}
    />
  ),
};

const outDir = join(process.cwd(), 'previews');
mkdirSync(outDir, { recursive: true });

Object.entries(templates).forEach(async ([name, factory]) => {
  const html = await render(factory(), { pretty: true });
  const file = join(outDir, `${name}.html`);
  writeFileSync(file, html);
  console.log('Generated', file);
});
