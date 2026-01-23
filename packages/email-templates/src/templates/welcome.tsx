import * as React from 'react';
import { Text } from '@react-email/components';
import { Layout, HighlightBox, BulletList } from '../components/Layout';
import { ActionProps } from '../types';

export function WelcomeEmail(props: ActionProps) {
  return (
    <Layout
      preview="Welcome to Goals - Start building better habits today!"
      title={`Welcome aboard${props.toName ? ', ' + props.toName : ''}!`}
      intro="You're set to start building better habits and achieving your goals."
      action={props.action ?? { label: 'Launch App →', href: '#' }}
      theme="primary"
      headerBg
      celebration="🎉"
      {...props}
    >
      <HighlightBox theme="primary">
        <Text className="m-0 font-semibold text-slate-700">Quick start tips:</Text>
        <BulletList
          items={[
            'Create your first project or goal',
            'Set up daily habits to track',
            'Write your first journal entry',
          ]}
        />
      </HighlightBox>

      <div className="divider" />

      <Text className="m-0 text-center text-sm text-slate-500">
        💡 Tip: Set your timezone in settings so streaks reset at the right time.
      </Text>
    </Layout>
  );
}
