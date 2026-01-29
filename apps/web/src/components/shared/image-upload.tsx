'use client';

import { useRef, useState, useCallback } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LocalImageAttachment } from '@/types';
import { processImageFiles } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onImagesAdd: (images: LocalImageAttachment[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  onImagesAdd,
  maxFiles = 5,
  maxSizeMB = 5,
  className,
  disabled = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).slice(0, maxFiles);

      setIsProcessing(true);

      try {
        const { images, errors } = await processImageFiles(fileArray, {
          maxSizeMB,
          maxDimension: 4096,
          maxPixels: 16_000_000,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        });

        if (errors.length > 0) {
          toast({
            title: 'Some files were skipped',
            description: errors.slice(0, 2).join(' '),
            variant: 'destructive',
          });
        }

        if (images.length > 0) {
          onImagesAdd(images);
        }
      } catch (error) {
        console.error('Error processing images:', error);
        toast({
          title: 'Upload failed',
          description: 'Could not process the selected images.',
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [maxFiles, maxSizeMB, onImagesAdd, toast]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <div
        onClick={() => !disabled && !isProcessing && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer',
          isDragging && 'border-primary bg-primary/5',
          !isDragging && 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
          disabled && 'opacity-50 cursor-not-allowed',
          isProcessing && 'cursor-wait'
        )}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Processing images...</p>
          </>
        ) : (
          <>
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Drop images here or click to upload
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Max {maxFiles} images, {maxSizeMB}MB each
            </p>
          </>
        )}
      </div>
    </div>
  );
}

interface ImageThumbnailProps {
  image: LocalImageAttachment;
  onRemove?: () => void;
  onClick?: () => void;
  showRemove?: boolean;
  className?: string;
}

export function ImageThumbnail({
  image,
  onRemove,
  onClick,
  showRemove = true,
  className,
}: ImageThumbnailProps) {
  return (
    <div
      className={cn(
        'group relative aspect-square overflow-hidden rounded-lg border bg-muted',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <img
        src={image.data}
        alt={image.caption || image.name}
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
      />
      {showRemove && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </button>
      )}
      {image.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
          <p className="text-xs text-white truncate">{image.caption}</p>
        </div>
      )}
    </div>
  );
}
