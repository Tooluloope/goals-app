import * as React from 'react';
import { SummaryTemplate } from './summary-shared';
import { SummaryProps } from '../types';

export function YearlyReviewEmail(props: SummaryProps) {
  return (
    <SummaryTemplate
      heading="in review"
      preview="Your year in review"
      actionLabel="Open full review"
      {...props}
    />
  );
}
