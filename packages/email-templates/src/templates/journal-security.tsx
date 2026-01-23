import * as React from 'react';
import { Text } from '@react-email/components';
import { Layout } from '../components/Layout';
import { SecurityProps } from '../types';

export function SecurityAlertEmail(props: SecurityProps) {
  return (
    <Layout
      preview="New sign-in detected"
      title="New sign-in detected"
      intro="If this wasn’t you, secure your account now."
      action={props.action ?? { label: 'Review activity', href: '#' }}
      {...props}
    >
      <Text className="muted">
        Location: {props.location || 'Unknown'}
        <br />
        Device: {props.device || 'Unknown'}
        <br />
        Time: {props.time || 'Just now'}
      </Text>
    </Layout>
  );
}
