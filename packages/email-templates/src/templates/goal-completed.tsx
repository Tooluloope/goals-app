import * as React from 'react';
import { Text } from '@react-email/components';
import { Layout, HighlightBox, MetricsGrid } from '../components/Layout';
import { GoalProps } from '../types';

export function GoalCompletedEmail(props: GoalProps) {
  const { goalName, projectName, completedTasks, totalDays, toName } = props;

  const metrics = [];
  if (completedTasks) {
    metrics.push({ label: 'Tasks Completed', value: String(completedTasks) });
  }
  if (totalDays) {
    metrics.push({ label: 'Days to Complete', value: String(totalDays) });
  }

  return (
    <Layout
      preview={`🎯 Goal achieved: ${goalName}!`}
      title="Goal Achieved!"
      intro={`Congratulations${toName ? ', ' + toName : ''}! You did it!`}
      action={props.action ?? { label: 'Set New Goal', href: '#' }}
      theme="success"
      headerBg
      celebration="🎯"
      {...props}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
          borderRadius: '16px',
          padding: '24px',
          margin: '24px 0',
          textAlign: 'center',
        }}
      >
        <Text className="m-0 text-xl font-bold text-emerald-800">{goalName}</Text>
        {projectName && <Text className="m-0 mt-1 text-sm text-emerald-600">in {projectName}</Text>}
      </div>

      {metrics.length > 0 && <MetricsGrid metrics={metrics} theme="success" />}

      <HighlightBox theme="success">
        <Text className="m-0 text-center text-slate-700">
          🚀 Ready for your next challenge? Set a new goal and keep the momentum going!
        </Text>
      </HighlightBox>
    </Layout>
  );
}
