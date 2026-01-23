import * as React from 'react';
import { Text } from '@react-email/components';
import { Layout } from '../components/Layout';
import { ReminderProps } from '../types';

export function HabitReminder(props: ReminderProps) {
  const streakText = props.streak ? `Current streak: ${props.streak} days.` : '';
  return (
    <Layout
      preview={`Reminder: ${props.habitName || 'Your habit'}`}
      title={`Stay on track${props.toName ? ', ' + props.toName : ''}`}
      intro={`${props.habitName || 'Your habit'} is waiting. ${streakText}`}
      action={props.action ?? { label: "Open today's habits", href: '#' }}
      {...props}
    >
      <Text className="muted">Finish this habit to keep your rhythm for the day.</Text>
    </Layout>
  );
}
