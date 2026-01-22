'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { AppLayout } from '@/components/layout/app-layout';
import {
  useCurrentMonthReview,
  useUpsertMonthlyReview,
  useMonthlyReviewStats,
  useMonthlyReviewPrompts,
} from '@/hooks/use-reviews';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Sparkles,
  Mountain,
  Trophy,
  Target,
  Lightbulb,
  Heart,
  Star,
  Save,
  Loader2,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MonthlyReviewPage() {
  const { toast } = useToast();
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const { data: existingReview, isLoading: isLoadingReview } = useCurrentMonthReview();
  const { data: stats } = useMonthlyReviewStats();
  const { data: prompts } = useMonthlyReviewPrompts();
  const upsertReview = useUpsertMonthlyReview();

  const [highlights, setHighlights] = useState('');
  const [challenges, setChallenges] = useState('');
  const [goalsAchieved, setGoalsAchieved] = useState('');
  const [goalsForNextMonth, setGoalsForNextMonth] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [isSaved, setIsSaved] = useState(true);

  // Load existing review data
  useEffect(() => {
    if (existingReview) {
      setHighlights(existingReview.highlights || '');
      setChallenges(existingReview.challenges || '');
      setGoalsAchieved(existingReview.goalsAchieved || '');
      setGoalsForNextMonth(existingReview.goalsForNextMonth || '');
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
        highlights !== (existingReview.highlights || '') ||
        challenges !== (existingReview.challenges || '') ||
        goalsAchieved !== (existingReview.goalsAchieved || '') ||
        goalsForNextMonth !== (existingReview.goalsForNextMonth || '') ||
        lessonsLearned !== (existingReview.lessonsLearned || '') ||
        gratitude !== (existingReview.gratitude || '') ||
        rating !== existingReview.rating;
      setIsSaved(!hasChanges);
    } else if (
      highlights ||
      challenges ||
      goalsAchieved ||
      goalsForNextMonth ||
      lessonsLearned ||
      gratitude ||
      rating
    ) {
      setIsSaved(false);
    }
  }, [
    highlights,
    challenges,
    goalsAchieved,
    goalsForNextMonth,
    lessonsLearned,
    gratitude,
    rating,
    existingReview,
  ]);

  const handleSave = useCallback(async () => {
    const monthStr = format(monthStart, 'yyyy-MM-dd');

    try {
      await upsertReview.mutateAsync({
        month: monthStr,
        highlights: highlights || undefined,
        challenges: challenges || undefined,
        goalsAchieved: goalsAchieved || undefined,
        goalsForNextMonth: goalsForNextMonth || undefined,
        lessonsLearned: lessonsLearned || undefined,
        gratitude: gratitude || undefined,
        rating,
      });

      setIsSaved(true);
      toast({
        title: 'Review saved',
        description: 'Your monthly review has been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error saving',
        description: 'Failed to save your review. Please try again.',
        variant: 'destructive',
      });
    }
  }, [
    highlights,
    challenges,
    goalsAchieved,
    goalsForNextMonth,
    lessonsLearned,
    gratitude,
    rating,
    monthStart,
    upsertReview,
    toast,
  ]);

  if (isLoadingReview) {
    return (
      <AppLayout title="Monthly Review">
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Monthly Review">
      <div className="container max-w-4xl px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">{format(monthStart, 'MMMM yyyy')}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold md:text-3xl">Monthly Review</h1>
          <p className="mt-1 text-muted-foreground">
            Reflect on your month and set intentions for the next
          </p>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
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
          </div>
        )}

        {/* Rating */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Rate Your Month
            </CardTitle>
            <CardDescription>How would you rate this month overall?</CardDescription>
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
          {/* Highlights */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Monthly Highlights
              </CardTitle>
              {prompts?.prompts?.highlights && (
                <CardDescription>{prompts.prompts.highlights}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What were the best moments of this month?"
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </CardContent>
          </Card>

          {/* Challenges */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mountain className="h-5 w-5 text-orange-500" />
                Challenges Faced
              </CardTitle>
              {prompts?.prompts?.challenges && (
                <CardDescription>{prompts.prompts.challenges}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What obstacles did you overcome or struggle with?"
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </CardContent>
          </Card>

          {/* Goals Achieved */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-5 w-5 text-green-500" />
                Goals Achieved
              </CardTitle>
              {prompts?.prompts?.goalsAchieved && (
                <CardDescription>{prompts.prompts.goalsAchieved}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What goals did you accomplish this month?"
                value={goalsAchieved}
                onChange={(e) => setGoalsAchieved(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </CardContent>
          </Card>

          {/* Goals for Next Month */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-blue-500" />
                Goals for Next Month
              </CardTitle>
              {prompts?.prompts?.goalsForNextMonth && (
                <CardDescription>{prompts.prompts.goalsForNextMonth}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What do you want to achieve next month?"
                value={goalsForNextMonth}
                onChange={(e) => setGoalsForNextMonth(e.target.value)}
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
                placeholder="What key insights did you gain this month?"
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
                placeholder="What are you most grateful for this month?"
                value={gratitude}
                onChange={(e) => setGratitude(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Save Button - bottom-20 on mobile to clear bottom nav, bottom-4 on desktop */}
        <div className="sticky bottom-20 z-20 mt-8 md:bottom-4">
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
