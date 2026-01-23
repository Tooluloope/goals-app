import * as React from 'react';
import { Text } from '@react-email/components';
import { Layout } from '../components/Layout';
import { InviteProps } from '../types';

export function WorkspaceInvite(props: InviteProps) {
  return (
    <Layout
      preview={`Join ${props.workspaceName || 'the workspace'}`}
      title={`Join ${props.workspaceName || 'the workspace'}`}
      intro={`${props.inviterName || 'A teammate'} invited you to collaborate. Invites expire soon—accept to keep the momentum.`}
      action={props.action ?? { label: 'Accept invite', href: '#' }}
      {...props}
    >
      <Text className="muted">You’ll get access to shared goals, habits, and timelines.</Text>
    </Layout>
  );
}
