import * as React from 'react';
import { SummaryTemplate } from './summary-shared';
import { SummaryProps } from '../types';

export function WeeklySummaryEmail(props: SummaryProps) {
  return (
    <SummaryTemplate
      heading="summary"
      preview="Your weekly rhythm summary"
      actionLabel="Open dashboard"
      {...props}
    />
  );
}
