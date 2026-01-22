'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Download, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LocalImageAttachment } from '@/types';
import { ImageThumbnail, ImageUpload } from './image-upload';
import { cn, formatDate } from '@/lib/utils';

interface ImageGalleryProps {
  images: LocalImageAttachment[];
  onImagesChange?: (images: LocalImageAttachment[]) => void;
  editable?: boolean;
  maxFiles?: number;
  className?: string;
  emptyMessage?: string;
}

export function ImageGallery({
  images,
  onImagesChange,
  editable = false,
  maxFiles = 10,
  className,
  emptyMessage = 'No images attached',
}: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleAddImages = (newImages: LocalImageAttachment[]) => {
    if (onImagesChange) {
      const combined = [...images, ...newImages].slice(0, maxFiles);
      onImagesChange(combined);
    }
  };

  const handleRemoveImage = (index: number) => {
    if (onImagesChange) {
      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);
    }
  };

  const handlePrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleDownload = () => {
    if (selectedIndex === null) return;
    const image = images[selectedIndex];
    const link = document.createElement('a');
    link.href = image.data;
    link.download = image.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'Escape') {
      setSelectedIndex(null);
    }
  };

  if (images.length === 0 && !editable) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8 text-center', className)}>
        <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {images.map((image, index) => (
            <ImageThumbnail
              key={image.id}
              image={image}
              onClick={() => setSelectedIndex(index)}
              onRemove={editable ? () => handleRemoveImage(index) : undefined}
              showRemove={editable}
            />
          ))}
        </div>
      )}

      {/* Upload Area (when editable) */}
      {editable && images.length < maxFiles && (
        <div className={images.length > 0 ? 'mt-4' : ''}>
          <ImageUpload onImagesAdd={handleAddImages} maxFiles={maxFiles - images.length} />
        </div>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl border-0 bg-black/95 p-0" onKeyDown={handleKeyDown}>
          <DialogTitle className="sr-only">Image viewer</DialogTitle>
          {selectedIndex !== null && images[selectedIndex] && (
            <div className="relative">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 z-10 text-white hover:bg-white/20"
                onClick={() => setSelectedIndex(null)}
              >
                <X className="h-5 w-5" />
              </Button>

              {/* Download Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-12 top-2 z-10 text-white hover:bg-white/20"
                onClick={handleDownload}
              >
                <Download className="h-5 w-5" />
              </Button>

              {/* Image */}
              <div className="flex min-h-[300px] items-center justify-center p-4">
                <img
                  src={images[selectedIndex].data}
                  alt={images[selectedIndex].caption || images[selectedIndex].name}
                  className="max-h-[70vh] max-w-full object-contain"
                />
              </div>

              {/* Navigation */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 disabled:opacity-30"
                    onClick={handlePrevious}
                    disabled={selectedIndex === 0}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 disabled:opacity-30"
                    onClick={handleNext}
                    disabled={selectedIndex === images.length - 1}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}

              {/* Image Info */}
              <div className="border-t border-white/10 bg-black/50 p-4 text-white">
                <p className="font-medium">{images[selectedIndex].name}</p>
                {images[selectedIndex].caption && (
                  <p className="mt-1 text-sm text-white/70">{images[selectedIndex].caption}</p>
                )}
                <p className="mt-1 text-xs text-white/50">
                  Added {formatDate(images[selectedIndex].createdAt, 'PPP')} &bull;{' '}
                  {(images[selectedIndex].size / 1024).toFixed(1)} KB
                </p>
                <p className="mt-2 text-xs text-white/50">
                  {selectedIndex + 1} of {images.length}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Compact gallery for inline display (e.g., in cards)
interface CompactImageGalleryProps {
  images: LocalImageAttachment[];
  maxDisplay?: number;
  onClick?: () => void;
  className?: string;
}

export function CompactImageGallery({
  images,
  maxDisplay = 4,
  onClick,
  className,
}: CompactImageGalleryProps) {
  if (images.length === 0) return null;

  const displayImages = images.slice(0, maxDisplay);
  const remainingCount = images.length - maxDisplay;

  return (
    <div className={cn('flex gap-1 cursor-pointer', className)} onClick={onClick}>
      {displayImages.map((image, index) => (
        <div key={image.id} className="relative h-12 w-12 overflow-hidden rounded border">
          <img src={image.data} alt={image.name} className="h-full w-full object-cover" />
          {index === maxDisplay - 1 && remainingCount > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-medium text-white">
              +{remainingCount}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
