import * as React from 'react';
import { Layout } from '../components/Layout';
import { ActionProps } from '../types';

export function ResetPassword(props: ActionProps) {
  return (
    <Layout
      preview="Reset your password"
      title="Reset your password"
      intro="Click the button below to choose a new password. If you didn’t request this, you can safely ignore this email. Link expires in 30 minutes."
      action={props.action ?? { label: 'Reset password', href: '#' }}
      {...props}
    />
  );
}
