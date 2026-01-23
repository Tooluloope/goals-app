'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Lightbulb, TrendingUp, PartyPopper, AlertTriangle, Flag } from 'lucide-react';
import type { AiInsight, InsightType } from '@goals/shared';
import { cn } from '@/lib/utils';

interface AiInsightCardProps {
  insight: AiInsight;
  onDismiss?: (id: string) => void;
}

const insightConfig: Record<
  InsightType,
  { icon: typeof Lightbulb; color: string; bgColor: string }
> = {
  pattern: {
    icon: TrendingUp,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  recommendation: {
    icon: Lightbulb,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  celebration: {
    icon: PartyPopper,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  milestone: {
    icon: Flag,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
};

export function AiInsightCard({ insight, onDismiss }: AiInsightCardProps) {
  const config = insightConfig[insight.type];
  const Icon = config.icon;

  return (
    <Card className={cn('relative', config.bgColor)}>
      <CardContent className="p-3 sm:p-4">
        {/* Header row with icon, type badge, and dismiss button */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className={cn('rounded-full p-1.5 shrink-0', config.bgColor)}>
              <Icon className={cn('h-3.5 w-3.5', config.color)} />
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              {insight.type}
            </Badge>
          </div>

          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 opacity-50 hover:opacity-100 -mr-1"
              onClick={() => onDismiss(insight.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Title */}
        <h4 className="font-medium text-sm mb-1">{insight.title}</h4>

        {/* Content - allow text to wrap */}
        <p className="text-sm text-muted-foreground leading-relaxed">{insight.content}</p>

        {/* Footer with actionable badge and confidence */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {insight.actionable && (
            <Badge variant="secondary" className="text-xs">
              Actionable
            </Badge>
          )}

          {/* Confidence indicator */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {Math.round(insight.confidence * 100)}% confident
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
