import * as React from 'react';
import { SummaryTemplate } from './summary-shared';
import { SummaryProps } from '../types';

export function MonthlySummaryEmail(props: SummaryProps) {
  return (
    <SummaryTemplate
      heading="review"
      preview="Your monthly review"
      actionLabel="See details"
      {...props}
    />
  );
}
