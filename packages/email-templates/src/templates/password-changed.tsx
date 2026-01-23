import * as React from 'react';
import { Layout } from '../components/Layout';
import { ActionProps } from '../types';

export function PasswordChanged(props: ActionProps) {
  return (
    <Layout
      preview="Your password was changed"
      title="Password updated"
      intro="If this was you, no action is needed. If not, reset your password immediately."
      action={props.action ?? { label: 'Secure account', href: '#' }}
      {...props}
    />
  );
}
