'use client';

import { useAiInsights, useGenerateAiInsights, useDismissAiInsight } from '@/hooks/use-ai';
import { AiInsightCard } from './ai-insight-card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';

interface AiInsightsPanelProps {
  className?: string;
}

export function AiInsightsPanel({ className }: AiInsightsPanelProps) {
  const { data: insights, isLoading } = useAiInsights();
  const generateMutation = useGenerateAiInsights();
  const dismissMutation = useDismissAiInsight();

  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const activeInsights = insights?.filter((i) => !i.dismissed) || [];

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Insights
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => generateMutation.mutate(undefined)}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {activeInsights.length === 0 ? (
        <div className="text-center py-8">
          <Sparkles className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-4">No insights available yet</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateMutation.mutate(undefined)}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Insights
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeInsights.map((insight) => (
            <AiInsightCard
              key={insight.id}
              insight={insight}
              onDismiss={(id) => dismissMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
