import * as React from 'react';
import { Layout } from '../components/Layout';
import { ActionProps } from '../types';

export function VerifyEmail(props: ActionProps) {
  return (
    <Layout
      preview="Verify your email"
      title="Confirm your email"
      intro="Verify to secure your account and enable sync. This link expires in 30 minutes."
      action={props.action ?? { label: 'Verify email', href: '#' }}
      {...props}
    />
  );
}
