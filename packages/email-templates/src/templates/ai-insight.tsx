import * as React from 'react';
import { Text } from '@react-email/components';
import { Layout, HighlightBox } from '../components/Layout';
import { InsightProps, ThemeType } from '../types';

export function AiInsightEmail(props: InsightProps) {
  const { insightTitle, insightContent, insightType = 'pattern' } = props;

  const themeMap: Record<string, ThemeType> = {
    celebration: 'success',
    recommendation: 'purple',
    milestone: 'blue',
    pattern: 'primary',
  };

  const iconMap: Record<string, string> = {
    celebration: '🏆',
    recommendation: '✨',
    milestone: '🎯',
    pattern: '🧠',
  };

  const theme = themeMap[insightType];

  return (
    <Layout
      preview={`💡 New insight: ${insightTitle}`}
      title={insightTitle}
      intro="Our AI noticed something interesting about your progress."
      action={props.action ?? { label: 'View All Insights', href: '#' }}
      theme={theme}
      celebration={iconMap[insightType]}
      {...props}
    >
      <HighlightBox theme={theme}>
        <Text className="m-0 text-slate-700">{insightContent}</Text>
      </HighlightBox>
    </Layout>
  );
}
