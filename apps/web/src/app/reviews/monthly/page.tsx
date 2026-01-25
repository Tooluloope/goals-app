'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  format,
  startOfMonth,
  endOfMonth,
  getDate,
  getDaysInMonth,
  isAfter,
  addMonths,
  subMonths,
  isFuture,
  isSameMonth,
  parse,
} from 'date-fns';
import { AppLayout } from '@/components/layout/app-layout';
import { useAuthStore } from '@/store/auth-store';
import {
  useCurrentMonthReview,
  useMonthlyReviewByDate,
  useUpsertMonthlyReview,
  useMonthlyReviewStats,
  useMonthlyReviewPrompts,
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
  Lock,
  Send,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MonthlyReviewPage() {
  const router = useRouter();
  const { currentWorkspace } = useAuthStore();
  const { toast } = useToast();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const selectedMonthStart = startOfMonth(selectedDate);
  const selectedMonthStr = format(selectedMonthStart, 'yyyy-MM-dd');
  const isViewingCurrentMonth = isSameMonth(selectedDate, today);
  const currentMonthEnd = endOfMonth(today);

  // Redirect to Family Hub if in family workspace (this is a personal-only page)
  useEffect(() => {
    if (currentWorkspace?.type === 'family') {
      router.replace('/family');
    }
  }, [currentWorkspace, router]);

  const { data: currentReview, isLoading: isLoadingCurrentReview } = useCurrentMonthReview();
  const { data: dateReview, isLoading: isLoadingDateReview } = useMonthlyReviewByDate(
    isViewingCurrentMonth ? '' : selectedMonthStr
  );
  const existingReview = isViewingCurrentMonth ? currentReview : dateReview;
  const isLoadingReview = isViewingCurrentMonth ? isLoadingCurrentReview : isLoadingDateReview;
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
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Check if it's end of month (last 3 days or past the month)
  const daysInMonth = getDaysInMonth(today);
  const currentDay = getDate(today);
  const isEndOfMonth =
    isViewingCurrentMonth && (currentDay >= daysInMonth - 2 || isAfter(today, currentMonthEnd));
  const isSubmitted = existingReview?.submitted === true;
  const canEdit = isViewingCurrentMonth && !isSubmitted;

  const goToPreviousMonth = () => setSelectedDate(subMonths(selectedDate, 1));
  const goToNextMonth = () => {
    const nextMonth = addMonths(selectedDate, 1);
    if (!isFuture(nextMonth)) setSelectedDate(nextMonth);
  };
  const goToCurrentMonth = () => setSelectedDate(today);

  // Reset form when switching months
  useEffect(() => {
    setHighlights('');
    setChallenges('');
    setGoalsAchieved('');
    setGoalsForNextMonth('');
    setLessonsLearned('');
    setGratitude('');
    setRating(undefined);
    setIsSaved(true);
  }, [selectedMonthStr]);

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

  const handleSave = useCallback(
    async (submit = false) => {
      if (!canEdit && !submit) return;

      try {
        await upsertReview.mutateAsync({
          month: selectedMonthStr,
          highlights: highlights || undefined,
          challenges: challenges || undefined,
          goalsAchieved: goalsAchieved || undefined,
          goalsForNextMonth: goalsForNextMonth || undefined,
          lessonsLearned: lessonsLearned || undefined,
          gratitude: gratitude || undefined,
          rating,
          submitted: submit || undefined,
        });

        setIsSaved(true);
        toast({
          title: submit ? 'Review submitted' : 'Review saved',
          description: submit
            ? 'Your monthly review has been finalized and can no longer be edited.'
            : 'Your monthly review has been saved as a draft.',
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
      highlights,
      challenges,
      goalsAchieved,
      goalsForNextMonth,
      lessonsLearned,
      gratitude,
      rating,
      upsertReview,
      toast,
      canEdit,
      selectedMonthStr,
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
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">{format(selectedMonthStart, 'MMMM yyyy')}</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold md:text-3xl">Monthly Review</h1>
            <p className="mt-1 text-muted-foreground">
              Reflect on your month and set intentions for the next
            </p>
          </div>

          {/* Month Picker */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousMonth}
              className="h-9 w-9 shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'min-w-[150px] justify-center gap-2 font-medium',
                    isViewingCurrentMonth &&
                      'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                >
                  <CalendarDays className="h-4 w-4" />
                  {isViewingCurrentMonth ? 'This month' : format(selectedMonthStart, 'MMM yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-4 space-y-4">
                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant={isViewingCurrentMonth ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        goToCurrentMonth();
                        setCalendarOpen(false);
                      }}
                    >
                      This month
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedDate(subMonths(today, 1));
                        setCalendarOpen(false);
                      }}
                    >
                      Last month
                    </Button>
                  </div>

                  {/* Month Input */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Jump to Month
                    </p>
                    <input
                      type="month"
                      value={format(selectedMonthStart, 'yyyy-MM')}
                      max={format(today, 'yyyy-MM')}
                      onChange={(e) => {
                        const date = parse(e.target.value, 'yyyy-MM', new Date());
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
              onClick={goToNextMonth}
              disabled={isViewingCurrentMonth}
              className="h-9 w-9 shrink-0"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Locked Banner for Past Months or Submitted Review */}
        {!canEdit && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-muted p-4 text-muted-foreground">
            <Lock className="h-5 w-5" />
            <span className="font-medium">
              {isViewingCurrentMonth
                ? 'This review has been submitted and cannot be edited'
                : existingReview
                  ? 'This review is from a past month and is read-only'
                  : 'No review found for this month'}
            </span>
          </div>
        )}

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
              {canEdit ? (
                <RichTextEditor
                  placeholder="What were the best moments of this month?"
                  value={highlights}
                  onChange={setHighlights}
                  minHeight="120px"
                  showToolbar={true}
                />
              ) : (
                <div className="min-h-[120px]">
                  {highlights ? (
                    <RichTextContent>{highlights}</RichTextContent>
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
                <Mountain className="h-5 w-5 text-orange-500" />
                Challenges Faced
              </CardTitle>
              {prompts?.prompts?.challenges && (
                <CardDescription>{prompts.prompts.challenges}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {canEdit ? (
                <RichTextEditor
                  placeholder="What obstacles did you overcome or struggle with?"
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
              {canEdit ? (
                <RichTextEditor
                  placeholder="What goals did you accomplish this month?"
                  value={goalsAchieved}
                  onChange={setGoalsAchieved}
                  minHeight="120px"
                  showToolbar={true}
                />
              ) : (
                <div className="min-h-[120px]">
                  {goalsAchieved ? (
                    <RichTextContent>{goalsAchieved}</RichTextContent>
                  ) : (
                    <p className="text-muted-foreground text-sm">No entry</p>
                  )}
                </div>
              )}
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
              {canEdit ? (
                <RichTextEditor
                  placeholder="What do you want to achieve next month?"
                  value={goalsForNextMonth}
                  onChange={setGoalsForNextMonth}
                  minHeight="120px"
                  showToolbar={true}
                />
              ) : (
                <div className="min-h-[120px]">
                  {goalsForNextMonth ? (
                    <RichTextContent>{goalsForNextMonth}</RichTextContent>
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
                  placeholder="What key insights did you gain this month?"
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
                  placeholder="What are you most grateful for this month?"
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
          <div className="mt-8 md:sticky md:bottom-4 z-20">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:flex-1 shadow-lg"
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

              {isEndOfMonth && (
                <Button
                  size="lg"
                  className="w-full sm:flex-1 shadow-lg"
                  onClick={handleSubmit}
                  disabled={upsertReview.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit Review
                </Button>
              )}

              {!isEndOfMonth && (
                <div className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-muted px-4 text-sm text-muted-foreground sm:flex-1">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Submit available in last 3 days</span>
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
            <AlertDialogTitle>Submit Monthly Review?</AlertDialogTitle>
            <AlertDialogDescription>
              Once submitted, your monthly review will be finalized and{' '}
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
