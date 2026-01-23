'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Target,
  Trophy,
  AlertCircle,
} from 'lucide-react';
import type { AiSummary, AiSummaryMetadata } from '@goals/shared';
import { format } from 'date-fns';

interface AiSummaryCardProps {
  summary?: AiSummary | null;
  isLoading?: boolean;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  title?: string;
  description?: string;
}

export function AiSummaryCard({
  summary,
  isLoading,
  onRegenerate,
  isRegenerating,
  title,
  description,
}: AiSummaryCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <Sparkles className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-medium">No summary available</p>
            <p className="text-sm text-muted-foreground">
              Generate an AI summary to see insights about this period
            </p>
          </div>
          {onRegenerate && (
            <Button onClick={onRegenerate} disabled={isRegenerating}>
              {isRegenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Summary
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Parse metadata
  let metadata: AiSummaryMetadata = {};
  try {
    if (typeof summary.metadata === 'string') {
      metadata = JSON.parse(summary.metadata);
    } else {
      metadata = summary.metadata as AiSummaryMetadata;
    }
  } catch {
    // Use default empty metadata
  }

  const MoodIcon =
    metadata.moodTrend === 'improving'
      ? TrendingUp
      : metadata.moodTrend === 'declining'
        ? TrendingDown
        : Minus;

  const moodColor =
    metadata.moodTrend === 'improving'
      ? 'text-green-500'
      : metadata.moodTrend === 'declining'
        ? 'text-red-500'
        : 'text-yellow-500';

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {title || `${summary.type.charAt(0).toUpperCase() + summary.type.slice(1)} Summary`}
          </CardTitle>
          <CardDescription>
            {description ||
              `${format(new Date(summary.periodStart), 'MMM d')} - ${format(new Date(summary.periodEnd), 'MMM d, yyyy')}`}
          </CardDescription>
        </div>
        {onRegenerate && (
          <Button variant="ghost" size="icon" onClick={onRegenerate} disabled={isRegenerating}>
            {isRegenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Mood Trend */}
        {metadata.moodTrend && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Mood Trend:</span>
            <Badge variant="outline" className={moodColor}>
              <MoodIcon className="mr-1 h-3 w-3" />
              {metadata.moodTrend.charAt(0).toUpperCase() + metadata.moodTrend.slice(1)}
            </Badge>
          </div>
        )}

        {/* Highlights */}
        {metadata.highlights && metadata.highlights.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Highlights
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {metadata.highlights.map((highlight, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Top Achievements */}
        {metadata.topAchievements && metadata.topAchievements.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4 text-green-500" />
              Achievements
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {metadata.topAchievements.map((achievement, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  {achievement}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Areas for Improvement */}
        {metadata.areasForImprovement && metadata.areasForImprovement.length > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Areas for Improvement
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {metadata.areasForImprovement.map((area, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-orange-500">→</span>
                  {area}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Habit Insights */}
        {metadata.habitInsights && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Habit Insights</h4>
            <p className="text-sm text-muted-foreground">{metadata.habitInsights}</p>
          </div>
        )}

        {/* Encouragement */}
        {metadata.encouragement && (
          <div className="rounded-lg bg-primary/5 p-4">
            <p className="text-sm italic text-foreground">{metadata.encouragement}</p>
          </div>
        )}

        {/* Suggested Focus */}
        {metadata.suggestedFocus && metadata.suggestedFocus.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Focus for Next Period</h4>
            <div className="flex flex-wrap gap-2">
              {metadata.suggestedFocus.map((focus, i) => (
                <Badge key={i} variant="secondary">
                  {focus}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
