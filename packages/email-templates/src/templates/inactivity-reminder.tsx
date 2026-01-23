import * as React from 'react';
import { Text } from '@react-email/components';
import { Layout, HighlightBox } from '../components/Layout';
import { InactivityProps } from '../types';

export function InactivityReminderEmail(props: InactivityProps) {
  const { daysSinceActive, lastActivity, toName } = props;

  return (
    <Layout
      preview={`We miss you${toName ? ', ' + toName : ''}! 💙`}
      title={`We miss you${toName ? ', ' + toName : ''}!`}
      intro={`It's been ${daysSinceActive} days since your last visit.`}
      action={props.action ?? { label: 'Jump Back In', href: '#' }}
      theme="purple"
      celebration="💙"
      {...props}
    >
      <HighlightBox theme="purple">
        <Text className="m-0 text-slate-700">
          🌱 <strong>Remember:</strong> Small, consistent steps lead to big results. Even a quick
          check-in counts!
        </Text>
      </HighlightBox>

      {lastActivity && (
        <Text className="m-0 mt-4 text-center text-sm text-slate-500">
          Last activity: {lastActivity}
        </Text>
      )}

      <div className="divider" />

      <Text className="m-0 text-center text-sm text-slate-500">
        Not ready to come back? That's okay too. We'll be here when you are.
      </Text>
    </Layout>
  );
}
