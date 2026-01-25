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
  Lightbulb,
  Trophy,
  Flag,
  Heart,
  Save,
  Loader2,
  CheckCircle2,
  Lock,
  Shuffle,
  Sparkles,
} from 'lucide-react';
import type { Mood } from '@goals/shared';
import { useToast } from '@/hooks/use-toast';

const MOOD_OPTIONS: {
  value: Mood;
  label: string;
  emoji: string;
  tint: string;
  bg: string;
  ring: string;
}[] = [
  {
    value: 'terrible',
    label: 'Rough',
    emoji: '😣',
    tint: 'text-rose-600',
    bg: 'bg-rose-500/10',
    ring: 'border-rose-500/30',
  },
  {
    value: 'bad',
    label: 'Low',
    emoji: '😕',
    tint: 'text-orange-600',
    bg: 'bg-orange-500/10',
    ring: 'border-orange-500/30',
  },
  {
    value: 'neutral',
    label: 'Okay',
    emoji: '😐',
    tint: 'text-amber-600',
    bg: 'bg-amber-500/10',
    ring: 'border-amber-500/30',
  },
  {
    value: 'good',
    label: 'Good',
    emoji: '🙂',
    tint: 'text-emerald-600',
    bg: 'bg-emerald-500/10',
    ring: 'border-emerald-500/30',
  },
  {
    value: 'great',
    label: 'Great',
    emoji: '😁',
    tint: 'text-primary',
    bg: 'bg-primary/10',
    ring: 'border-primary/30',
  },
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

const ALL_EMOJIS = EMOJI_CATEGORIES.flatMap((category) => category.emojis);
const QUICK_EMOJIS = ['✨', '🔥', '🌿', '🎯', '💫', '🤍'];

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

interface DailyJournalRhythm2Props {
  /** The date to show the journal for (controlled by parent). Format: 'yyyy-MM-dd' */
  selectedDate: string;
}

export function DailyJournalRhythm2({ selectedDate }: DailyJournalRhythm2Props) {
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

  const handleRandomEmoji = () => {
    if (!canEdit || ALL_EMOJIS.length === 0) return;
    const nextEmoji = ALL_EMOJIS[Math.floor(Math.random() * ALL_EMOJIS.length)];
    setEmoji(nextEmoji);
  };

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
      <div className="rounded-3xl border bg-gradient-to-br from-background via-background to-primary/5 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Reflection Studio
            </div>
            <h2 className="mt-3 text-2xl font-semibold">Daily Journal</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Capture the mood, tag the moment, then let the story breathe.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-[11px] text-muted-foreground">
            <span
              className={cn('h-2 w-2 rounded-full', isSaved ? 'bg-emerald-500' : 'bg-amber-500')}
            />
            {isSaved ? 'All changes saved' : 'Editing...'}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border bg-card/70 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mood Line
              </p>
              <span className="text-[11px] text-muted-foreground">Tap to set</span>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {MOOD_OPTIONS.map((option) => {
                const isSelected = mood === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => canEdit && setMood(option.value)}
                    title={option.label}
                    disabled={!canEdit}
                    className={cn(
                      'group flex flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-[11px] font-semibold transition-all',
                      option.bg,
                      option.ring,
                      option.tint,
                      isSelected && 'shadow-sm ring-2 ring-primary/40',
                      canEdit ? 'hover:scale-[1.02]' : 'cursor-not-allowed opacity-60'
                    )}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <span className="uppercase tracking-wide">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border bg-card/70 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Emoji Stamp
              </p>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRandomEmoji}
                disabled={!canEdit}
                className={cn('h-8 w-8', !canEdit && 'cursor-not-allowed opacity-60')}
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    disabled={!canEdit}
                    className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-2xl border text-3xl transition-all',
                      emoji ? 'bg-primary/10 border-primary/30' : 'bg-muted/60',
                      canEdit ? 'hover:scale-105' : 'cursor-not-allowed opacity-60'
                    )}
                  >
                    {emoji || '✨'}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0" align="center">
                  <div className="space-y-4 p-4">
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

                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Quick picks
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_EMOJIS.map((quickEmoji) => (
                          <button
                            key={quickEmoji}
                            onClick={() => {
                              setEmoji(quickEmoji);
                              setEmojiPickerOpen(false);
                            }}
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-xl text-2xl transition-all',
                              'hover:bg-primary/10 hover:scale-110 active:scale-95',
                              emoji === quickEmoji && 'bg-primary/20 ring-2 ring-primary/50'
                            )}
                          >
                            {quickEmoji}
                          </button>
                        ))}
                      </div>
                    </div>

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
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  {emoji ? "Today's emoji" : 'Pick a highlight'}
                </p>
                <p className="text-xs text-muted-foreground">Add a visual tag to anchor the day.</p>
              </div>
            </div>
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
                <RichTextContent>{content}</RichTextContent>
              ) : (
                <p className="text-muted-foreground text-sm">No entry for this day</p>
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
                  <p className="text-muted-foreground text-sm">No entry</p>
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
                  <p className="text-muted-foreground text-sm">No entry</p>
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
                <p className="text-muted-foreground text-sm">No entry</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button - only shown for today's entry */}
      {canEdit && (
        <div className="sticky bottom-20 z-20 md:bottom-4">
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
