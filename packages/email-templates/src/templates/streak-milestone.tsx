import * as React from 'react';
import { Text } from '@react-email/components';
import { Layout, HighlightBox, StreakBadge } from '../components/Layout';
import { StreakProps } from '../types';

export function StreakMilestoneEmail(props: StreakProps) {
  const { streakDays, habitName = 'Your habit' } = props;

  const milestoneEmoji =
    streakDays >= 365 ? '🏆' : streakDays >= 100 ? '⭐' : streakDays >= 30 ? '🌟' : '🔥';

  const milestoneMessage =
    streakDays >= 365
      ? "A full year! You're a habit master!"
      : streakDays >= 100
        ? 'Triple digits! Incredible dedication!'
        : streakDays >= 30
          ? "A whole month! You're building real momentum!"
          : "One week down! You're on your way!";

  return (
    <Layout
      preview={`🔥 ${streakDays} day streak on ${habitName}!`}
      title="Incredible streak!"
      intro={milestoneMessage}
      action={props.action ?? { label: 'View Your Progress', href: '#' }}
      theme="success"
      headerBg
      celebration={milestoneEmoji}
      {...props}
    >
      <StreakBadge days={streakDays} />

      <HighlightBox theme="success">
        <Text className="m-0 text-center text-slate-700">
          <strong>{habitName}</strong> is becoming second nature. Keep it up!
        </Text>
      </HighlightBox>
    </Layout>
  );
}
