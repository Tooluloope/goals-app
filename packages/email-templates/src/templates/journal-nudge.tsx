import * as React from 'react';
import { Layout } from '../components/Layout';
import { ReminderProps } from '../types';

export function JournalNudge(props: ReminderProps) {
  return (
    <Layout
      preview="Reflect on your day"
      title="Take 2 minutes to reflect"
      intro={`Capture a quick note for ${props.journalDate || 'today'}—it fuels better insights.`}
      action={props.action ?? { label: 'Open journal', href: '#' }}
      {...props}
    />
  );
}
