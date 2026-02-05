'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { useGenerateHabitSuggestions, useCreateHabit } from '@/hooks/use-habits';
import { useToast } from '@/hooks/use-toast';
import type { SuggestedHabit } from '@goals/shared';
import {
  Loader2,
  Sparkles,
  BookOpen,
  Dumbbell,
  Droplets,
  Brain,
  Moon,
  Heart,
  Pencil,
  Coffee,
  Music,
  Target,
  DollarSign,
  Utensils,
  Clock,
  Flame,
  Zap,
  TrendingUp,
  Repeat,
  CalendarDays,
} from 'lucide-react';

// Map of icon names to Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'book-open': BookOpen,
  book: BookOpen,
  dumbbell: Dumbbell,
  droplets: Droplets,
  brain: Brain,
  moon: Moon,
  heart: Heart,
  pencil: Pencil,
  coffee: Coffee,
  music: Music,
  target: Target,
  'dollar-sign': DollarSign,
  utensils: Utensils,
  clock: Clock,
  flame: Flame,
  zap: Zap,
  'trending-up': TrendingUp,
  repeat: Repeat,
  'calendar-days': CalendarDays,
};

// Get icon component, fallback to Target
function getIconComponent(iconName: string): React.ComponentType<{ className?: string }> {
  const normalizedName = iconName.toLowerCase().replace(/_/g, '-');
  return ICON_MAP[normalizedName] || Target;
}

// Format frequency for display
function formatFrequency(frequency: string, frequencyDays: number[]): string {
  if (frequency === 'daily') return 'Daily';
  if (frequency === 'weekly') return 'Weekly';
  if (frequency === 'specific_days') {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return frequencyDays.map((d) => dayNames[d]).join(', ');
  }
  return frequency;
}

export function HabitSuggestionWizard() {
  const { toast } = useToast();
  const { currentWorkspace } = useAuthStore();
  const {
    habitSuggestionWizardOpen,
    habitSuggestionWizardProjectId,
    habitSuggestionWizardProjectName,
    closeHabitSuggestionWizard,
  } = useUIStore();

  const generateSuggestions = useGenerateHabitSuggestions();
  const createHabit = useCreateHabit();

  const [suggestions, setSuggestions] = useState<SuggestedHabit[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  // Generate suggestions when wizard opens
  useEffect(() => {
    if (habitSuggestionWizardOpen && habitSuggestionWizardProjectId && currentWorkspace?.id) {
      setSuggestions([]);
      setSelectedIndices(new Set());
      generateSuggestions.mutate(
        {
          workspaceId: currentWorkspace.id,
          projectId: habitSuggestionWizardProjectId,
        },
        {
          onSuccess: (data) => {
            setSuggestions(data);
            // Pre-select all suggestions
            setSelectedIndices(new Set(data.map((_, i) => i)));
          },
          onError: (error) => {
            toast({
              title: 'Failed to generate suggestions',
              description: error instanceof Error ? error.message : 'Please try again',
              variant: 'destructive',
            });
          },
        }
      );
    }
  }, [habitSuggestionWizardOpen, habitSuggestionWizardProjectId, currentWorkspace?.id]);

  const toggleSelection = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleClose = () => {
    setSuggestions([]);
    setSelectedIndices(new Set());
    closeHabitSuggestionWizard();
  };

  const handleCreateSelected = async () => {
    if (!currentWorkspace?.id || !habitSuggestionWizardProjectId) return;

    const selectedSuggestions = suggestions.filter((_, i) => selectedIndices.has(i));
    if (selectedSuggestions.length === 0) {
      handleClose();
      return;
    }

    setIsCreating(true);

    try {
      // Create habits sequentially to avoid rate limiting
      for (const suggestion of selectedSuggestions) {
        await createHabit.mutateAsync({
          workspaceId: currentWorkspace.id,
          projectId: habitSuggestionWizardProjectId,
          name: suggestion.name,
          icon: suggestion.icon.toLowerCase().replace(/-/g, ''),
          color: 'primary',
          frequency: suggestion.frequency,
          frequencyDays: suggestion.frequencyDays,
          weight: suggestion.suggestedWeight,
          reminderEnabled: false,
        });
      }

      toast({
        title: 'Habits created',
        description: `${selectedSuggestions.length} habit${selectedSuggestions.length > 1 ? 's' : ''} added to your goal`,
        variant: 'success',
      });

      handleClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create habits. Please try again.';
      const isLimitError = message.toLowerCase().includes('limit');
      toast({
        title: isLimitError ? 'Upgrade required' : 'Error',
        description: message,
        variant: isLimitError ? 'default' : 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const isLoading = generateSuggestions.isPending;
  const hasError = generateSuggestions.isError;

  return (
    <Dialog open={habitSuggestionWizardOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-h-[90vh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Suggested Habits
          </DialogTitle>
          <DialogDescription>
            {habitSuggestionWizardProjectName
              ? `AI-generated habits to help you achieve "${habitSuggestionWizardProjectName}"`
              : 'AI-generated habits to help you achieve your goal'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">Generating habit suggestions...</p>
            </div>
          )}

          {hasError && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">Failed to generate suggestions.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  if (currentWorkspace?.id && habitSuggestionWizardProjectId) {
                    generateSuggestions.mutate({
                      workspaceId: currentWorkspace.id,
                      projectId: habitSuggestionWizardProjectId,
                    });
                  }
                }}
              >
                Try again
              </Button>
            </div>
          )}

          {!isLoading && !hasError && suggestions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">No suggestions available.</p>
            </div>
          )}

          {!isLoading && suggestions.length > 0 && (
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => {
                const IconComponent = getIconComponent(suggestion.icon);
                const isSelected = selectedIndices.has(index);

                return (
                  <div
                    key={index}
                    onClick={() => toggleSelection(index)}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelection(index)}
                      className="mt-1"
                    />
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                        isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Label className="font-medium cursor-pointer">{suggestion.name}</Label>
                        <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                          {formatFrequency(suggestion.frequency, suggestion.frequencyDays)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {suggestion.description}
                      </p>
                      {suggestion.suggestedWeight && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Weight: {suggestion.suggestedWeight}%
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="ghost" onClick={handleClose} disabled={isCreating}>
            Skip
          </Button>
          <Button
            onClick={handleCreateSelected}
            disabled={isLoading || isCreating || selectedIndices.size === 0}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              `Add ${selectedIndices.size} habit${selectedIndices.size !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
