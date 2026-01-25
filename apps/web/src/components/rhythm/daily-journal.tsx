'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, isToday, parseISO } from 'date-fns';
import {
  useTodayJournalEntry,
  useJournalEntryByDate,
  useUpsertJournalEntry,
  useJournalPrompt,
} from '@/hooks/use-journal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { RichTextContent } from '@/components/ui/rich-text-content';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  Lock,
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

// Emoji categories for the picker
const EMOJI_CATEGORIES = [
  {
    name: 'Feelings',
    emojis: ['😊', '😄', '🥰', '😌', '🤗', '😎', '🤔', '😴', '😤', '😢', '🥺', '😇'],
  },
  {
    name: 'Activities',
    emojis: ['🎯', '💼', '📚', '✏️', '💻', '🏃', '🧘', '🎮', '🎨', '🎵', '📝', '🔧'],
  },
  {
    name: 'Nature',
    emojis: ['☀️', '🌙', '🌟', '🌈', '🔥', '🌸', '🍀', '🌻', '🌊', '⛈️', '❄️', '🌺'],
  },
  {
    name: 'Food',
    emojis: ['☕', '🍕', '🍔', '🍎', '🍰', '🍦', '🥗', '🍷', '🧁', '🥤', '🍜', '🥑'],
  },
  {
    name: 'Celebration',
    emojis: ['🎉', '🎊', '🎁', '🎈', '🎂', '🥳', '🏆', '🥇', '🎓', '💐', '🚀', '⭐'],
  },
  {
    name: 'Hearts',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💕', '💗', '💝', '💖'],
  },
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

interface DailyJournalProps {
  /** The date to show the journal for (controlled by parent). Format: 'yyyy-MM-dd' */
  selectedDate: string;
}

export function DailyJournal({ selectedDate }: DailyJournalProps) {
  const { toast } = useToast();

  // Determine if we're viewing today
  const isViewingToday = isToday(parseISO(selectedDate));

  // Fetch entry based on whether we're viewing today or a specific date
  const { data: todayEntry, isLoading: isLoadingToday } = useTodayJournalEntry();
  const { data: dateEntry, isLoading: isLoadingDate } = useJournalEntryByDate(
    isViewingToday ? '' : selectedDate
  );

  const existingEntry = isViewingToday ? todayEntry : dateEntry;
  const isLoadingEntry = isViewingToday ? isLoadingToday : isLoadingDate;

  // Only show prompts for today
  const { data: promptData } = useJournalPrompt();
  const upsertEntry = useUpsertJournalEntry();

  // Can only edit today's entry
  const canEdit = isViewingToday;

  const [mood, setMood] = useState<Mood | undefined>(undefined);
  const [emoji, setEmoji] = useState<string | undefined>(undefined);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState(0);
  const [content, setContent] = useState('');
  const [wins, setWins] = useState('');
  const [challenges, setChallenges] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [isSaved, setIsSaved] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Reset form when date changes
  useEffect(() => {
    // Reset form state when navigating to a different date
    setMood(undefined);
    setEmoji(undefined);
    setContent('');
    setWins('');
    setChallenges('');
    setGratitude('');
    setLastSaved(null);
    setIsSaved(true);
  }, [selectedDate]);

  // Load existing entry data
  useEffect(() => {
    if (existingEntry) {
      setMood(existingEntry.mood as Mood | undefined);
      setEmoji(existingEntry.emoji || undefined);
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
        emoji !== (existingEntry.emoji || undefined) ||
        content !== (existingEntry.content || '') ||
        wins !== (existingEntry.wins || '') ||
        challenges !== (existingEntry.challenges || '') ||
        gratitude !== (existingEntry.gratitude || '');
      setIsSaved(!hasChanges);
    } else if (content || wins || challenges || gratitude || mood || emoji) {
      setIsSaved(false);
    }
  }, [mood, emoji, content, wins, challenges, gratitude, existingEntry]);

  const handleSave = useCallback(async () => {
    if (!canEdit) return;

    try {
      await upsertEntry.mutateAsync({
        date: selectedDate,
        mood,
        emoji: emoji || undefined,
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
  }, [
    mood,
    emoji,
    content,
    wins,
    challenges,
    gratitude,
    promptData?.prompt,
    upsertEntry,
    toast,
    canEdit,
    selectedDate,
  ]);

  // Auto-save after 3 seconds of inactivity (only for today's entry)
  useEffect(() => {
    if (!canEdit || isSaved || isLoadingEntry) return;

    const timer = setTimeout(() => {
      if (!isSaved && (content || wins || challenges || gratitude || emoji)) {
        handleSave();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [
    content,
    wins,
    challenges,
    gratitude,
    mood,
    emoji,
    isSaved,
    isLoadingEntry,
    handleSave,
    canEdit,
  ]);

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
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Daily Journal</h2>

        {/* Mood Selector & Emoji Picker */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* Mood Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mood:</span>
            <div className="flex items-center gap-1 rounded-full border bg-card p-1">
              {MOOD_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = mood === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => canEdit && setMood(option.value)}
                    title={option.label}
                    disabled={!canEdit}
                    className={cn(
                      'rounded-full p-2 transition-all',
                      isSelected ? 'bg-primary/20 text-primary scale-110' : option.color,
                      canEdit ? 'hover:scale-110' : 'cursor-not-allowed opacity-70'
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Emoji Picker */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Emoji:</span>
            <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canEdit}
                  className={cn(
                    'h-11 min-w-11 text-2xl transition-all hover:scale-105',
                    emoji && 'bg-primary/5 border-primary/30',
                    !canEdit && 'cursor-not-allowed opacity-70'
                  )}
                >
                  {emoji || '✨'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="center">
                <div className="p-4 space-y-4">
                  {/* Header with selected emoji preview */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{emoji || '✨'}</span>
                      <span className="text-sm font-medium">
                        {emoji ? "Today's emoji" : 'Pick an emoji'}
                      </span>
                    </div>
                    {emoji && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setEmoji(undefined);
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>

                  {/* Category tabs */}
                  <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
                    {EMOJI_CATEGORIES.map((cat, idx) => (
                      <button
                        key={cat.name}
                        onClick={() => setEmojiCategory(idx)}
                        className={cn(
                          'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all',
                          emojiCategory === idx
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  {/* Emoji grid */}
                  <div className="grid grid-cols-6 gap-1.5">
                    {EMOJI_CATEGORIES[emojiCategory].emojis.map((e) => (
                      <button
                        key={e}
                        onClick={() => {
                          setEmoji(e);
                          setEmojiPickerOpen(false);
                        }}
                        className={cn(
                          'flex items-center justify-center h-11 w-11 rounded-lg text-2xl transition-all',
                          'hover:bg-primary/10 hover:scale-110 active:scale-95',
                          emoji === e && 'bg-primary/20 ring-2 ring-primary/50'
                        )}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Locked Banner for Past Entries */}
      {!canEdit && existingEntry && (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-muted p-4 text-muted-foreground">
          <Lock className="h-5 w-5" />
          <span className="font-medium">
            This journal entry is from a past date and cannot be edited
          </span>
        </div>
      )}

      {/* Daily Prompt - only shown for today */}
      {canEdit && promptData?.prompt && (
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
          {canEdit ? (
            <RichTextEditor
              placeholder="Start writing here... Let your thoughts flow freely."
              value={content}
              onChange={setContent}
              minHeight="200px"
              showToolbar={true}
            />
          ) : (
            <div className="min-h-[200px]">
              {content ? (
                <RichTextContent className="text-lg leading-relaxed">{content}</RichTextContent>
              ) : (
                <p className="text-muted-foreground">No entry for this day</p>
              )}
            </div>
          )}
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
            {canEdit ? (
              <RichTextEditor
                placeholder="What went well today?"
                value={wins}
                onChange={setWins}
                minHeight="120px"
                showToolbar={true}
              />
            ) : (
              <div className="min-h-[120px]">
                {wins ? (
                  <RichTextContent>{wins}</RichTextContent>
                ) : (
                  <p className="text-muted-foreground text-sm">No wins recorded</p>
                )}
              </div>
            )}
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
            {canEdit ? (
              <RichTextEditor
                placeholder="What challenges did you face?"
                value={challenges}
                onChange={setChallenges}
                minHeight="120px"
                showToolbar={true}
              />
            ) : (
              <div className="min-h-[120px]">
                {challenges ? (
                  <RichTextContent>{challenges}</RichTextContent>
                ) : (
                  <p className="text-muted-foreground text-sm">No challenges recorded</p>
                )}
              </div>
            )}
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
          {canEdit ? (
            <RichTextEditor
              placeholder="What are you grateful for today?"
              value={gratitude}
              onChange={setGratitude}
              minHeight="100px"
              showToolbar={true}
            />
          ) : (
            <div className="min-h-[100px]">
              {gratitude ? (
                <RichTextContent>{gratitude}</RichTextContent>
              ) : (
                <p className="text-muted-foreground text-sm">No gratitude recorded</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button - only shown for today's entry */}
      {canEdit && (
        <div className="mt-6 md:sticky md:bottom-4 z-20">
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
      )}
    </div>
  );
}
