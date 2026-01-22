'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUpload, ImageThumbnail } from '@/components/shared/image-upload';
import { useUIStore } from '@/store/ui-store';
import { useAddReview, useProject } from '@/hooks/use-projects';
import { useToast } from '@/hooks/use-toast';
import { ImageAttachment } from '@/types';

const reviewSchema = z.object({
  notes: z.string().min(1, 'Notes are required'),
  progress: z.string().min(1, 'Progress update is required'),
  blockers: z.string(),
  changes: z.string(),
  nextStep: z.string(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export function AddReviewModal() {
  const { addReviewModalOpen, addReviewProjectId, closeAddReviewModal } = useUIStore();
  const { data: project } = useProject(addReviewProjectId || '');
  const addReview = useAddReview();
  const { toast } = useToast();
  const [images, setImages] = useState<ImageAttachment[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      notes: '',
      progress: '',
      blockers: '',
      changes: '',
      nextStep: '',
    },
  });

  const handleAddImages = (newImages: ImageAttachment[]) => {
    setImages((prev) => [...prev, ...newImages].slice(0, 10));
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ReviewFormData) => {
    if (!addReviewProjectId) return;

    try {
      await addReview.mutateAsync({
        projectId: addReviewProjectId,
        notes: data.notes,
        progress: data.progress,
        blockers: data.blockers,
        changes: data.changes,
        nextStep: data.nextStep,
        images: images.length > 0 ? images : undefined,
      });

      toast({
        title: 'Review logged',
        description: 'Your review has been saved.',
        variant: 'success',
      });

      reset();
      setImages([]);
      closeAddReviewModal();
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
    setImages([]);
    closeAddReviewModal();
  };

  return (
    <Dialog open={addReviewModalOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Review</DialogTitle>
          <DialogDescription>
            {project && `Reviewing "${project.name}"`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="progress">Progress update *</Label>
              <Textarea
                id="progress"
                placeholder="What progress has been made?"
                {...register('progress')}
                className="min-h-[80px]"
              />
              {errors.progress && (
                <p className="text-sm text-destructive">{errors.progress.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes *</Label>
              <Textarea
                id="notes"
                placeholder="Any observations or thoughts?"
                {...register('notes')}
                className="min-h-[80px]"
              />
              {errors.notes && (
                <p className="text-sm text-destructive">{errors.notes.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="blockers">Blockers</Label>
              <Textarea
                id="blockers"
                placeholder="Any blockers or challenges?"
                {...register('blockers')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="changes">Changes needed</Label>
              <Textarea
                id="changes"
                placeholder="Any adjustments to the plan?"
                {...register('changes')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextStep">Next step</Label>
              <Textarea
                id="nextStep"
                placeholder="What's the immediate next action?"
                {...register('nextStep')}
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Attach images</Label>
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
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || addReview.isPending}>
              {isSubmitting || addReview.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Review'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
