'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  format,
  startOfWeek,
  endOfWeek,
  isSaturday,
  isSunday,
  isAfter,
  addWeeks,
  subWeeks,
  isFuture,
  parseISO,
  isSameWeek,
} from 'date-fns';
import { AppLayout } from '@/components/layout/app-layout';
import { useAuthStore } from '@/store/auth-store';
import {
  useCurrentWeekReview,
  useWeeklyReviewByDate,
  useUpsertWeeklyReview,
  useWeeklyReviewStats,
  useWeeklyReviewPrompts,
} from '@/hooks/use-reviews';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { RichTextContent } from '@/components/ui/rich-text-content';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  Lock,
  Send,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function WeeklyReviewPage() {
  const router = useRouter();
  const { currentWorkspace } = useAuthStore();
  const { toast } = useToast();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
  const selectedWeekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const selectedWeekStartStr = format(selectedWeekStart, 'yyyy-MM-dd');
  const isViewingCurrentWeek = isSameWeek(selectedDate, today, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });

  // Redirect to Family Hub if in family workspace (this is a personal-only page)
  useEffect(() => {
    if (currentWorkspace?.type === 'family') {
      router.replace('/family');
    }
  }, [currentWorkspace, router]);

  const { data: currentReview, isLoading: isLoadingCurrentReview } = useCurrentWeekReview();
  const { data: dateReview, isLoading: isLoadingDateReview } = useWeeklyReviewByDate(
    isViewingCurrentWeek ? '' : selectedWeekStartStr
  );
  const existingReview = isViewingCurrentWeek ? currentReview : dateReview;
  const isLoadingReview = isViewingCurrentWeek ? isLoadingCurrentReview : isLoadingDateReview;
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
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Check if it's end of week (Saturday, Sunday, or past the week)
  const isEndOfWeek =
    isViewingCurrentWeek &&
    (isSaturday(today) || isSunday(today) || isAfter(today, currentWeekEnd));
  const isSubmitted = existingReview?.submitted === true;
  const canEdit = isViewingCurrentWeek && !isSubmitted;

  const goToPreviousWeek = () => setSelectedDate(subWeeks(selectedDate, 1));
  const goToNextWeek = () => {
    const nextWeek = addWeeks(selectedDate, 1);
    if (!isFuture(nextWeek)) setSelectedDate(nextWeek);
  };
  const goToCurrentWeek = () => setSelectedDate(today);

  // Reset form when switching weeks
  useEffect(() => {
    setWentWell('');
    setToImprove('');
    setFocusNextWeek('');
    setLessonsLearned('');
    setGratitude('');
    setRating(undefined);
    setIsSaved(true);
  }, [selectedWeekStartStr]);

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

  const handleSave = useCallback(
    async (submit = false) => {
      if (!canEdit && !submit) return;

      try {
        await upsertReview.mutateAsync({
          weekStart: selectedWeekStartStr,
          wentWell: wentWell || undefined,
          toImprove: toImprove || undefined,
          focusNextWeek: focusNextWeek || undefined,
          lessonsLearned: lessonsLearned || undefined,
          gratitude: gratitude || undefined,
          rating,
          submitted: submit || undefined,
        });

        setIsSaved(true);
        toast({
          title: submit ? 'Review submitted' : 'Review saved',
          description: submit
            ? 'Your weekly review has been finalized and can no longer be edited.'
            : 'Your weekly review has been saved as a draft.',
        });
      } catch (error) {
        toast({
          title: 'Error saving',
          description: 'Failed to save your review. Please try again.',
          variant: 'destructive',
        });
      }
    },
    [
      wentWell,
      toImprove,
      focusNextWeek,
      lessonsLearned,
      gratitude,
      rating,
      upsertReview,
      toast,
      canEdit,
      selectedWeekStartStr,
    ]
  );

  const handleSubmit = useCallback(() => {
    setShowSubmitDialog(true);
  }, []);

  const confirmSubmit = useCallback(async () => {
    setShowSubmitDialog(false);
    await handleSave(true);
  }, [handleSave]);

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
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                {format(selectedWeekStart, 'MMM d')} - {format(selectedWeekEnd, 'MMM d, yyyy')}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold md:text-3xl">Weekly Review</h1>
            <p className="mt-1 text-muted-foreground">
              Reflect on your week and plan for the next one
            </p>
          </div>

          {/* Week Picker */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousWeek}
              className="h-9 w-9 shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'min-w-[140px] justify-center gap-2 font-medium',
                    isViewingCurrentWeek && 'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                >
                  <CalendarDays className="h-4 w-4" />
                  {isViewingCurrentWeek ? 'This week' : format(selectedWeekStart, 'MMM d')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-4 space-y-4">
                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant={isViewingCurrentWeek ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        goToCurrentWeek();
                        setCalendarOpen(false);
                      }}
                    >
                      This week
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedDate(subWeeks(today, 1));
                        setCalendarOpen(false);
                      }}
                    >
                      Last week
                    </Button>
                  </div>

                  {/* Date Input */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Jump to Date
                    </p>
                    <input
                      type="date"
                      value={format(selectedDate, 'yyyy-MM-dd')}
                      max={format(today, 'yyyy-MM-dd')}
                      onChange={(e) => {
                        const date = parseISO(e.target.value);
                        if (!isNaN(date.getTime()) && !isFuture(date)) {
                          setSelectedDate(date);
                          setCalendarOpen(false);
                        }
                      }}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextWeek}
              disabled={isViewingCurrentWeek}
              className="h-9 w-9 shrink-0"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Locked Banner for Past Weeks or Submitted Review */}
        {!canEdit && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-muted p-4 text-muted-foreground">
            <Lock className="h-5 w-5" />
            <span className="font-medium">
              {isViewingCurrentWeek
                ? 'This review has been submitted and cannot be edited'
                : existingReview
                  ? 'This review is from a past week and is read-only'
                  : 'No review found for this week'}
            </span>
          </div>
        )}

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
                  onClick={() => canEdit && setRating(star)}
                  disabled={!canEdit}
                  className={cn(
                    'rounded-lg p-2 transition-all',
                    rating && rating >= star
                      ? 'text-yellow-500'
                      : 'text-muted-foreground/30 hover:text-yellow-500/50',
                    canEdit ? 'hover:scale-110' : 'cursor-not-allowed'
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
              {canEdit ? (
                <RichTextEditor
                  placeholder="Celebrate your wins..."
                  value={wentWell}
                  onChange={setWentWell}
                  minHeight="120px"
                  showToolbar={true}
                />
              ) : (
                <div className="min-h-[120px]">
                  {wentWell ? (
                    <RichTextContent>{wentWell}</RichTextContent>
                  ) : (
                    <p className="text-muted-foreground text-sm">No entry</p>
                  )}
                </div>
              )}
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
              {canEdit ? (
                <RichTextEditor
                  placeholder="What could have been better?"
                  value={toImprove}
                  onChange={setToImprove}
                  minHeight="120px"
                  showToolbar={true}
                />
              ) : (
                <div className="min-h-[120px]">
                  {toImprove ? (
                    <RichTextContent>{toImprove}</RichTextContent>
                  ) : (
                    <p className="text-muted-foreground text-sm">No entry</p>
                  )}
                </div>
              )}
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
              {canEdit ? (
                <RichTextEditor
                  placeholder="What are your priorities for next week?"
                  value={focusNextWeek}
                  onChange={setFocusNextWeek}
                  minHeight="120px"
                  showToolbar={true}
                />
              ) : (
                <div className="min-h-[120px]">
                  {focusNextWeek ? (
                    <RichTextContent>{focusNextWeek}</RichTextContent>
                  ) : (
                    <p className="text-muted-foreground text-sm">No entry</p>
                  )}
                </div>
              )}
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
              {canEdit ? (
                <RichTextEditor
                  placeholder="What did you learn this week?"
                  value={lessonsLearned}
                  onChange={setLessonsLearned}
                  minHeight="100px"
                  showToolbar={true}
                />
              ) : (
                <div className="min-h-[100px]">
                  {lessonsLearned ? (
                    <RichTextContent>{lessonsLearned}</RichTextContent>
                  ) : (
                    <p className="text-muted-foreground text-sm">No entry</p>
                  )}
                </div>
              )}
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
              {canEdit ? (
                <RichTextEditor
                  placeholder="What are you grateful for this week?"
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
        </div>

        {/* Save/Submit Buttons - bottom-20 on mobile to clear bottom nav, bottom-4 on desktop */}
        {canEdit && (
          <div className="sticky bottom-20 z-20 mt-8 md:bottom-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="outline"
                className="flex-1 shadow-lg"
                onClick={() => handleSave(false)}
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
                    Draft Saved
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Draft
                  </>
                )}
              </Button>

              {isEndOfWeek && (
                <Button
                  size="lg"
                  className="flex-1 shadow-lg"
                  onClick={handleSubmit}
                  disabled={upsertReview.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit Review
                </Button>
              )}

              {!isEndOfWeek && (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground sm:flex-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Submit available on Saturday/Sunday</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Weekly Review?</AlertDialogTitle>
            <AlertDialogDescription>
              Once submitted, your weekly review will be finalized and{' '}
              <span className="font-semibold text-destructive">cannot be edited</span>. Make sure
              you&apos;ve reviewed all your entries before submitting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>Submit Review</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
