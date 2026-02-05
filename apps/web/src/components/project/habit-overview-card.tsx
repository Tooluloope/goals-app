'use client';

import { useState } from 'react';
import { Loader2, Sparkles, TrendingUp, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useProjectHabitProgress, useGenerateHabitSuggestions } from '@/hooks/use-habits';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';

interface HabitOverviewCardProps {
  projectId: string;
  projectName: string;
}

export function HabitOverviewCard({ projectId, projectName }: HabitOverviewCardProps) {
  const { data: habitProgress, isLoading } = useProjectHabitProgress(projectId);
  const { openHabitSuggestionWizard } = useUIStore();
  const { currentWorkspace } = useAuthStore();
  const generateSuggestions = useGenerateHabitSuggestions();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSuggestHabits = async () => {
    if (!currentWorkspace?.id) return;

    setIsGenerating(true);
    try {
      // Pre-fetch suggestions to check rate limit before opening wizard
      await generateSuggestions.mutateAsync({
        workspaceId: currentWorkspace.id,
        projectId,
      });
      // If successful, open the wizard (it will use cached suggestions)
      openHabitSuggestionWizard(projectId, projectName);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate suggestions';
      const isUpgradeNeeded =
        message.toLowerCase().includes('upgrade') || message.toLowerCase().includes('free plan');
      toast({
        title: isUpgradeNeeded ? 'Upgrade required' : 'Error',
        description: message,
        variant: isUpgradeNeeded ? 'default' : 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasHabits = habitProgress && habitProgress.habits.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Linked Habits
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleSuggestHabits} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Suggest Habits
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!hasHabits ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">No habits linked to this goal yet.</p>
            <p className="text-xs text-muted-foreground">
              Link habits to track progress toward your goal.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{habitProgress.progress}%</span>
              </div>
              <Progress value={habitProgress.progress} className="h-2" />
            </div>

            {/* Individual Habits */}
            <div className="space-y-3 pt-2">
              {habitProgress.habits.map((habit) => (
                <div key={habit.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{habit.name}</span>
                    <div className="flex items-center gap-2">
                      {habit.weight && (
                        <span className="text-xs text-muted-foreground">{habit.weight}%</span>
                      )}
                      <span
                        className={cn(
                          'font-medium',
                          habit.completionRate >= 70
                            ? 'text-green-600'
                            : habit.completionRate >= 40
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        )}
                      >
                        {Math.round(habit.completionRate)}%
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={habit.completionRate}
                    className={cn(
                      'h-1.5',
                      habit.completionRate >= 70
                        ? '[&>div]:bg-green-500'
                        : habit.completionRate >= 40
                          ? '[&>div]:bg-yellow-500'
                          : '[&>div]:bg-red-500'
                    )}
                  />
                </div>
              ))}
            </div>

            {/* Completion trend indicator */}
            {habitProgress.progress >= 70 && (
              <div className="flex items-center gap-2 text-sm text-green-600 pt-2">
                <TrendingUp className="h-4 w-4" />
                <span>Great progress on your habits!</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
