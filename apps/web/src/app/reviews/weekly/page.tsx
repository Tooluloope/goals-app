'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { AppLayout } from '@/components/layout/app-layout';
import {
  useCurrentWeekReview,
  useUpsertWeeklyReview,
  useWeeklyReviewStats,
  useWeeklyReviewPrompts,
} from '@/hooks/use-reviews';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  Lightbulb,
  Heart,
  Star,
  Save,
  Loader2,
  CheckCircle2,
  Flame,
  BarChart3,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function WeeklyReviewPage() {
  const { toast } = useToast();
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const { data: existingReview, isLoading: isLoadingReview } = useCurrentWeekReview();
  const { data: stats } = useWeeklyReviewStats();
  const { data: prompts } = useWeeklyReviewPrompts();
  const upsertReview = useUpsertWeeklyReview();

  const [wentWell, setWentWell] = useState('');
  const [toImprove, setToImprove] = useState('');
  const [focusNextWeek, setFocusNextWeek] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [isSaved, setIsSaved] = useState(true);

  // Load existing review data
  useEffect(() => {
    if (existingReview) {
      setWentWell(existingReview.wentWell || '');
      setToImprove(existingReview.toImprove || '');
      setFocusNextWeek(existingReview.focusNextWeek || '');
      setLessonsLearned(existingReview.lessonsLearned || '');
      setGratitude(existingReview.gratitude || '');
      setRating(existingReview.rating ?? undefined);
      setIsSaved(true);
    }
  }, [existingReview]);

  // Mark as unsaved when content changes
  useEffect(() => {
    if (existingReview) {
      const hasChanges =
        wentWell !== (existingReview.wentWell || '') ||
        toImprove !== (existingReview.toImprove || '') ||
        focusNextWeek !== (existingReview.focusNextWeek || '') ||
        lessonsLearned !== (existingReview.lessonsLearned || '') ||
        gratitude !== (existingReview.gratitude || '') ||
        rating !== existingReview.rating;
      setIsSaved(!hasChanges);
    } else if (wentWell || toImprove || focusNextWeek || lessonsLearned || gratitude || rating) {
      setIsSaved(false);
    }
  }, [wentWell, toImprove, focusNextWeek, lessonsLearned, gratitude, rating, existingReview]);

  const handleSave = useCallback(async () => {
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');

    try {
      await upsertReview.mutateAsync({
        weekStart: weekStartStr,
        wentWell: wentWell || undefined,
        toImprove: toImprove || undefined,
        focusNextWeek: focusNextWeek || undefined,
        lessonsLearned: lessonsLearned || undefined,
        gratitude: gratitude || undefined,
        rating,
      });

      setIsSaved(true);
      toast({
        title: 'Review saved',
        description: 'Your weekly review has been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error saving',
        description: 'Failed to save your review. Please try again.',
        variant: 'destructive',
      });
    }
  }, [
    wentWell,
    toImprove,
    focusNextWeek,
    lessonsLearned,
    gratitude,
    rating,
    weekStart,
    upsertReview,
    toast,
  ]);

  if (isLoadingReview) {
    return (
      <AppLayout title="Weekly Review">
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Weekly Review">
      <div className="container max-w-4xl px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold md:text-3xl">Weekly Review</h1>
          <p className="mt-1 text-muted-foreground">
            Reflect on your week and plan for the next one
          </p>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalReviews}</p>
                  <p className="text-xs text-muted-foreground">Total Reviews</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-full bg-yellow-500/10 p-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.averageRating?.toFixed(1) || '-'}</p>
                  <p className="text-xs text-muted-foreground">Avg Rating</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-full bg-orange-500/10 p-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.currentStreak}</p>
                  <p className="text-xs text-muted-foreground">Week Streak</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Rating */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Rate Your Week
            </CardTitle>
            <CardDescription>How would you rate this week overall?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={cn(
                    'rounded-lg p-2 transition-all hover:scale-110',
                    rating && rating >= star
                      ? 'text-yellow-500'
                      : 'text-muted-foreground/30 hover:text-yellow-500/50'
                  )}
                >
                  <Star className={cn('h-8 w-8', rating && rating >= star && 'fill-current')} />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Review Sections */}
        <div className="space-y-6">
          {/* What Went Well */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-green-500" />
                What Went Well
              </CardTitle>
              {prompts?.prompts?.wentWell && (
                <CardDescription>{prompts.prompts.wentWell}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Celebrate your wins..."
                value={wentWell}
                onChange={(e) => setWentWell(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </CardContent>
          </Card>

          {/* What to Improve */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingDown className="h-5 w-5 text-orange-500" />
                Areas to Improve
              </CardTitle>
              {prompts?.prompts?.toImprove && (
                <CardDescription>{prompts.prompts.toImprove}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What could have been better?"
                value={toImprove}
                onChange={(e) => setToImprove(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </CardContent>
          </Card>

          {/* Focus for Next Week */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-blue-500" />
                Focus for Next Week
              </CardTitle>
              {prompts?.prompts?.focusNextWeek && (
                <CardDescription>{prompts.prompts.focusNextWeek}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What are your priorities for next week?"
                value={focusNextWeek}
                onChange={(e) => setFocusNextWeek(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </CardContent>
          </Card>

          {/* Lessons Learned */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Lessons Learned
              </CardTitle>
              {prompts?.prompts?.lessonsLearned && (
                <CardDescription>{prompts.prompts.lessonsLearned}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What did you learn this week?"
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </CardContent>
          </Card>

          {/* Gratitude */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="h-5 w-5 text-pink-500" />
                Gratitude
              </CardTitle>
              {prompts?.prompts?.gratitude && (
                <CardDescription>{prompts.prompts.gratitude}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What are you grateful for this week?"
                value={gratitude}
                onChange={(e) => setGratitude(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="sticky bottom-4 z-20 mt-8">
          <Button
            size="lg"
            className="w-full shadow-lg"
            onClick={handleSave}
            disabled={upsertReview.isPending || isSaved}
          >
            {upsertReview.isPending ? (
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
                Save Review
              </>
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
