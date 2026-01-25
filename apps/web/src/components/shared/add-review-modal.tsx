'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Clock,
  TrendingUp,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Input } from '@/components/ui/input';
// TODO: Re-enable when backend supports images
// import { ImageUpload, ImageThumbnail } from '@/components/shared/image-upload';
import { useUIStore } from '@/store/ui-store';
import { useAddReview, useProject } from '@/hooks/use-projects';
import { useToast } from '@/hooks/use-toast';
// import { LocalImageAttachment } from '@/types';
import { cn } from '@/lib/utils';

const reviewSchema = z.object({
  status: z.enum(['doing', 'done', 'failed']),
  confidence: z.enum(['high', 'medium', 'low']),
  progress: z.string().min(1, 'Progress update is required'),
  blockers: z.string(),
  nextSteps: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      completed: z.boolean(),
    })
  ),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

type NextStep = {
  id: string;
  text: string;
  completed: boolean;
};

export function AddReviewModal() {
  const { addReviewModalOpen, addReviewProjectId, closeAddReviewModal } = useUIStore();
  const { data: project } = useProject(addReviewProjectId || '');
  const addReview = useAddReview();
  const { toast } = useToast();
  // TODO: Re-enable when backend supports images
  // const [images, setImages] = useState<LocalImageAttachment[]>([]);
  const [step, setStep] = useState(1);
  const [nextSteps, setNextSteps] = useState<NextStep[]>([]);
  const [newTaskText, setNewTaskText] = useState('');

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      status: 'doing',
      confidence: 'high',
      progress: '',
      blockers: '',
      nextSteps: [],
    },
  });

  const currentStatus = watch('status');
  const currentConfidence = watch('confidence');

  // TODO: Re-enable when backend supports images
  // const handleAddImages = (newImages: LocalImageAttachment[]) => {
  //   setImages((prev) => [...prev, ...newImages].slice(0, 10));
  // };

  // const handleRemoveImage = (index: number) => {
  //   setImages((prev) => prev.filter((_, i) => i !== index));
  // };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const newStep: NextStep = {
      id: crypto.randomUUID(),
      text: newTaskText.trim(),
      completed: false,
    };
    setNextSteps((prev) => [...prev, newStep]);
    setNewTaskText('');
  };

  const handleToggleTask = (id: string) => {
    setNextSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, completed: !step.completed } : step))
    );
  };

  const handleRemoveTask = (id: string) => {
    setNextSteps((prev) => prev.filter((step) => step.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTask();
    }
  };

  const onSubmit = async (data: ReviewFormData) => {
    if (!addReviewProjectId) return;

    try {
      await addReview.mutateAsync({
        projectId: addReviewProjectId,
        notes: `Status: ${data.status}, Confidence: ${data.confidence}`,
        progress: data.progress,
        blockers: data.blockers,
        changes: '',
        nextStep: nextSteps.map((s) => s.text).join('\n'),
        // TODO: Images not yet implemented in backend - uncomment when ready
        // images: images.length > 0 ? (images as any) : undefined,
      });

      toast({
        title: 'Review logged',
        description: 'Your review has been saved.',
        variant: 'success',
      });

      handleClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save review. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    reset();
    // setImages([]); // TODO: Re-enable when backend supports images
    setStep(1);
    setNextSteps([]);
    setNewTaskText('');
    closeAddReviewModal();
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const progressPercentage = step === 1 ? 50 : 100;

  return (
    <Dialog open={addReviewModalOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85vh] sm:max-h-[90vh] overflow-hidden p-0 sm:max-w-lg lg:max-w-4xl">
        <div className="flex flex-col max-h-[85vh] sm:max-h-[90vh]">
          {/* Header & Progress */}
          <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <div className="flex flex-col gap-3">
              <div className="flex gap-6 justify-between items-center text-muted-foreground">
                <p className="text-sm font-medium">Step {step} of 2</p>
                <p className="text-xs font-semibold">{progressPercentage}%</p>
              </div>
              <div className="rounded-full bg-muted h-2 w-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Headline */}
            <div className="pt-4">
              <h2 className="text-2xl font-bold tracking-tight">
                {step === 1 ? 'How is it going?' : 'Progress & Blockers'}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {step === 1 ? (
                  <>
                    Update the status for{' '}
                    <span className="text-primary font-medium">
                      &apos;{project?.name || 'your goal'}&apos;
                    </span>
                  </>
                ) : (
                  'Reflect on recent progress and plan your next steps.'
                )}
              </p>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 px-6 py-4">
            <form id="review-form" onSubmit={handleSubmit(onSubmit)}>
              {step === 1 ? (
                <div className="space-y-6">
                  {/* Status Section */}
                  <div>
                    <h3 className="text-lg font-bold mb-4">Current Status</h3>
                    <div className="flex p-1 bg-muted rounded-xl">
                      {[
                        {
                          value: 'doing',
                          label: 'Doing',
                          icon: Clock,
                          activeColor: 'text-primary',
                        },
                        {
                          value: 'done',
                          label: 'Done',
                          icon: Check,
                          activeColor: 'text-green-600',
                        },
                        { value: 'failed', label: 'Failed', icon: X, activeColor: 'text-red-500' },
                      ].map(({ value, label, icon: Icon, activeColor }) => (
                        <label key={value} className="flex-1 cursor-pointer">
                          <input
                            type="radio"
                            className="peer sr-only"
                            value={value}
                            checked={currentStatus === value}
                            onChange={() =>
                              setValue('status', value as 'doing' | 'done' | 'failed')
                            }
                          />
                          <div
                            className={cn(
                              'flex items-center justify-center py-2.5 px-4 rounded-lg text-sm font-medium text-muted-foreground transition-all',
                              currentStatus === value && `bg-background shadow-sm ${activeColor}`
                            )}
                          >
                            <Icon className="w-4 h-4 mr-2" />
                            {label}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Confidence Section */}
                  <div>
                    <h3 className="text-lg font-bold mb-4">Confidence Level</h3>
                    <div className="flex flex-col gap-3">
                      {[
                        {
                          value: 'high',
                          label: 'High Confidence',
                          description: 'On track to crush it',
                          emoji: '🚀',
                          bgColor: 'bg-orange-100 dark:bg-orange-900/30',
                          borderColor: 'border-primary',
                          activeBg: 'bg-primary/5 dark:bg-primary/10',
                        },
                        {
                          value: 'medium',
                          label: 'Medium',
                          description: 'Needs some work',
                          emoji: '😐',
                          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
                          borderColor: 'border-yellow-400',
                          activeBg: 'bg-yellow-50 dark:bg-yellow-900/10',
                        },
                        {
                          value: 'low',
                          label: 'Low',
                          description: 'At risk of failing',
                          emoji: '📉',
                          bgColor: 'bg-red-100 dark:bg-red-900/30',
                          borderColor: 'border-red-400',
                          activeBg: 'bg-red-50 dark:bg-red-900/10',
                        },
                      ].map(
                        ({ value, label, description, emoji, bgColor, borderColor, activeBg }) => (
                          <label key={value} className="relative group cursor-pointer">
                            <input
                              type="radio"
                              className="peer sr-only"
                              value={value}
                              checked={currentConfidence === value}
                              onChange={() =>
                                setValue('confidence', value as 'high' | 'medium' | 'low')
                              }
                            />
                            <div
                              className={cn(
                                'flex items-center p-4 rounded-xl border-2 border-border bg-background hover:border-primary/30 transition-all',
                                currentConfidence === value && `${borderColor} ${activeBg}`
                              )}
                            >
                              <div
                                className={cn(
                                  'flex items-center justify-center w-12 h-12 rounded-full text-2xl mr-4 shrink-0',
                                  bgColor
                                )}
                              >
                                {emoji}
                              </div>
                              <div className="flex-1">
                                <div className="font-bold text-base mb-0.5">{label}</div>
                                <div className="text-sm text-muted-foreground">{description}</div>
                              </div>
                              <div
                                className={cn(
                                  'w-6 h-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center transition-colors',
                                  currentConfidence === value && `${borderColor} bg-primary`
                                )}
                              >
                                {currentConfidence === value && (
                                  <Check className="w-4 h-4 text-white" />
                                )}
                              </div>
                            </div>
                          </label>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Progress & Blockers Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* What went well */}
                    <div className="flex flex-col gap-2">
                      <label className="text-base font-semibold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        What went well?
                      </label>
                      <RichTextEditor
                        placeholder="e.g., Finished the budget draft ahead of schedule..."
                        value={watch('progress') || ''}
                        onChange={(value) => setValue('progress', value)}
                        minHeight="160px"
                        showToolbar={true}
                      />
                      {errors.progress && (
                        <p className="text-sm text-destructive">{errors.progress.message}</p>
                      )}
                    </div>

                    {/* Challenges faced */}
                    <div className="flex flex-col gap-2">
                      <label className="text-base font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Challenges faced
                      </label>
                      <RichTextEditor
                        placeholder="e.g., Unexpected delays took up most of Tuesday..."
                        value={watch('blockers') || ''}
                        onChange={(value) => setValue('blockers', value)}
                        minHeight="160px"
                        showToolbar={true}
                      />
                    </div>
                  </div>

                  {/* Next Steps Checklist */}
                  <div className="flex flex-col gap-4 bg-muted/50 p-5 rounded-xl border border-border">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <span className="p-1.5 bg-primary/10 rounded-lg text-primary">
                          <CheckCircle className="w-5 h-5" />
                        </span>
                        Next Steps (This Week)
                      </h3>
                      {nextSteps.length > 0 && (
                        <span className="text-sm font-medium text-muted-foreground bg-background px-3 py-1 rounded-full">
                          {nextSteps.length} {nextSteps.length === 1 ? 'item' : 'items'}
                        </span>
                      )}
                    </div>

                    {/* Add Task Input */}
                    <div className="flex gap-3 items-center">
                      <div className="relative flex-1">
                        <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          value={newTaskText}
                          onChange={(e) => setNewTaskText(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="h-12 pl-12 pr-4"
                          placeholder="Type a new task and press Enter..."
                        />
                      </div>
                      <Button type="button" onClick={handleAddTask} className="h-12 w-12 p-0">
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Task List */}
                    {nextSteps.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {nextSteps.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-4 p-4 rounded-xl bg-background border border-transparent hover:border-border transition-all group"
                          >
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => handleToggleTask(task.id)}
                              className="w-5 h-5 rounded border-2 border-muted-foreground/30 text-primary focus:ring-primary"
                            />
                            <span
                              className={cn(
                                'flex-1 text-sm font-medium transition-colors',
                                task.completed && 'line-through text-muted-foreground'
                              )}
                            >
                              {task.text}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTask(task.id)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Image Upload - TODO: Enable when backend supports images */}
                  {/* <div className="space-y-2">
                    <label className="text-base font-semibold">Attach images</label>
                    {images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {images.map((image, index) => (
                          <ImageThumbnail
                            key={image.id}
                            image={image}
                            onRemove={() => handleRemoveImage(index)}
                            className="h-16 w-16"
                          />
                        ))}
                      </div>
                    )}
                    {images.length < 10 && (
                      <ImageUpload
                        onImagesAdd={handleAddImages}
                        maxFiles={10 - images.length}
                        maxSizeMB={5}
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      Add photos to document your progress (max 10 images)
                    </p>
                  </div> */}
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-border shrink-0 flex justify-between items-center gap-3 pb-safe">
            {step === 1 ? (
              <>
                <Button variant="ghost" onClick={handleClose} className="touch-manipulation">
                  Cancel
                </Button>
                <Button onClick={handleNext} className="gap-2 touch-manipulation">
                  Next Step
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={handleBack} className="gap-2 touch-manipulation">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting || addReview.isPending}
                  className="gap-2 touch-manipulation"
                >
                  {isSubmitting || addReview.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Complete Review
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
