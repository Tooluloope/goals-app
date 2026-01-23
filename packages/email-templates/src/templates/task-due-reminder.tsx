import * as React from 'react';
import { Text } from '@react-email/components';
import { Layout } from '../components/Layout';
import { GoalProps } from '../types';

export function TaskDueReminderEmail(props: GoalProps) {
  const { goalName, projectName } = props;

  return (
    <Layout
      preview={`⏰ Task due soon: ${goalName}`}
      title="Task Due Soon"
      intro="Don't forget about this task on your list."
      action={props.action ?? { label: 'View Task', href: '#' }}
      theme="warning"
      celebration="⏰"
      {...props}
    >
      <div
        style={{
          background: '#fffbeb',
          border: '1px solid #fbbf24',
          borderRadius: '12px',
          padding: '20px',
          margin: '20px 0',
        }}
      >
        <Text className="m-0 text-lg font-semibold text-amber-800">{goalName}</Text>
        {projectName && <Text className="m-0 mt-1 text-sm text-amber-600">in {projectName}</Text>}
      </div>
    </Layout>
  );
}
