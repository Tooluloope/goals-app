'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useTodayJournalEntry, useUpsertJournalEntry, useJournalPrompt } from '@/hooks/use-journal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Frown,
  Meh,
  Smile,
  SmilePlus,
  Angry,
  Lightbulb,
  Trophy,
  Flag,
  Heart,
  Save,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import type { Mood } from '@goals/shared';
import { useToast } from '@/hooks/use-toast';

const MOOD_OPTIONS: {
  value: Mood;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  { value: 'terrible', label: 'Terrible', icon: Angry, color: 'text-red-500 hover:text-red-400' },
  { value: 'bad', label: 'Bad', icon: Frown, color: 'text-orange-500 hover:text-orange-400' },
  { value: 'neutral', label: 'Okay', icon: Meh, color: 'text-yellow-500 hover:text-yellow-400' },
  { value: 'good', label: 'Good', icon: Smile, color: 'text-green-500 hover:text-green-400' },
  { value: 'great', label: 'Great', icon: SmilePlus, color: 'text-primary hover:text-primary/80' },
];

// Helper to safely parse a date
function safeParseDate(dateValue: Date | string | null | undefined): Date | null {
  if (!dateValue) return null;
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  return isNaN(date.getTime()) ? null : date;
}

// Helper to safely format a date
function safeFormatDate(date: Date | null, formatStr: string): string {
  if (!date) return '';
  try {
    return format(date, formatStr);
  } catch {
    return '';
  }
}

export function DailyJournal() {
  const { toast } = useToast();
  const { data: existingEntry, isLoading: isLoadingEntry } = useTodayJournalEntry();
  const { data: promptData } = useJournalPrompt();
  const upsertEntry = useUpsertJournalEntry();

  const [mood, setMood] = useState<Mood | undefined>(undefined);
  const [content, setContent] = useState('');
  const [wins, setWins] = useState('');
  const [challenges, setChallenges] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [isSaved, setIsSaved] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load existing entry data
  useEffect(() => {
    if (existingEntry) {
      setMood(existingEntry.mood as Mood | undefined);
      setContent(existingEntry.content || '');
      setWins(existingEntry.wins || '');
      setChallenges(existingEntry.challenges || '');
      setGratitude(existingEntry.gratitude || '');
      setLastSaved(safeParseDate(existingEntry.updatedAt));
      setIsSaved(true);
    }
  }, [existingEntry]);

  // Mark as unsaved when content changes
  useEffect(() => {
    if (existingEntry) {
      const hasChanges =
        mood !== existingEntry.mood ||
        content !== (existingEntry.content || '') ||
        wins !== (existingEntry.wins || '') ||
        challenges !== (existingEntry.challenges || '') ||
        gratitude !== (existingEntry.gratitude || '');
      setIsSaved(!hasChanges);
    } else if (content || wins || challenges || gratitude || mood) {
      setIsSaved(false);
    }
  }, [mood, content, wins, challenges, gratitude, existingEntry]);

  const handleSave = useCallback(async () => {
    const today = format(new Date(), 'yyyy-MM-dd');

    try {
      await upsertEntry.mutateAsync({
        date: today,
        mood,
        content,
        wins: wins || undefined,
        challenges: challenges || undefined,
        gratitude: gratitude || undefined,
        prompt: promptData?.prompt,
      });

      setIsSaved(true);
      setLastSaved(new Date());
      toast({
        title: 'Journal saved',
        description: 'Your entry has been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error saving',
        description: 'Failed to save your journal entry. Please try again.',
        variant: 'destructive',
      });
    }
  }, [mood, content, wins, challenges, gratitude, promptData?.prompt, upsertEntry, toast]);

  // Auto-save after 3 seconds of inactivity
  useEffect(() => {
    if (isSaved || isLoadingEntry) return;

    const timer = setTimeout(() => {
      if (!isSaved && (content || wins || challenges || gratitude)) {
        handleSave();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [content, wins, challenges, gratitude, mood, isSaved, isLoadingEntry, handleSave]);

  if (isLoadingEntry) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Mood Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold">Daily Journal</h2>
        <div className="flex items-center gap-1 rounded-full border bg-card p-1">
          {MOOD_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = mood === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setMood(option.value)}
                title={option.label}
                className={cn(
                  'rounded-full p-2 transition-all',
                  isSelected ? 'bg-primary/20 text-primary scale-110' : option.color,
                  'hover:scale-110'
                )}
              >
                <Icon className="h-6 w-6" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Prompt */}
      {promptData?.prompt && (
        <Card className="overflow-hidden bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/20 p-2">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  Daily Prompt
                </p>
                <p className="mt-1 text-lg font-medium">{promptData.prompt}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Journal Entry */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <Textarea
            placeholder="Start writing here... Let your thoughts flow freely."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px] resize-none border-0 bg-transparent p-0 text-lg leading-relaxed focus-visible:ring-0"
          />
          <div className="mt-4 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
            <span>
              {isSaved ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Saved{' '}
                  {lastSaved &&
                    safeFormatDate(lastSaved, 'h:mm a') &&
                    `at ${safeFormatDate(lastSaved, 'h:mm a')}`}
                </span>
              ) : (
                'Unsaved changes...'
              )}
            </span>
            <span>{content.length} characters</span>
          </div>
        </CardContent>
      </Card>

      {/* Structured Reflection */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Wins */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-5 w-5 text-green-500" />
              Wins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="What went well today?"
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Challenges */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Flag className="h-5 w-5 text-orange-500" />
              Challenges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="What challenges did you face?"
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </CardContent>
        </Card>
      </div>

      {/* Gratitude */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-5 w-5 text-pink-500" />
            Gratitude
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="What are you grateful for today?"
            value={gratitude}
            onChange={(e) => setGratitude(e.target.value)}
            className="min-h-[100px] resize-none"
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="sticky bottom-4 z-20">
        <Button
          size="lg"
          className="w-full shadow-lg"
          onClick={handleSave}
          disabled={upsertEntry.isPending || isSaved}
        >
          {upsertEntry.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : isSaved ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Entry
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
