'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getColorClasses, TagConfig } from '@/types/config';

interface TagSelectProps {
  tags: TagConfig[];
  selectedTagIds: string[];
  onSelectionChange: (tagIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TagSelect({
  tags,
  selectedTagIds,
  onSelectionChange,
  placeholder = 'Select tags...',
  disabled = false,
}: TagSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onSelectionChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onSelectionChange([...selectedTagIds, tagId]);
    }
  };

  const removeTag = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange(selectedTagIds.filter((id) => id !== tagId));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <div className="flex flex-1 flex-wrap items-center gap-1 overflow-hidden">
            {selectedTags.length > 0 ? (
              selectedTags.map((tag) => {
                const colors = getColorClasses(tag.color);
                return (
                  <span
                    key={tag.id}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                      colors.bg,
                      colors.text
                    )}
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={(e) => removeTag(tag.id, e)}
                      className="hover:opacity-70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-2" align="start">
        <div className="max-h-60 overflow-auto">
          {tags.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No tags available</p>
          ) : (
            tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              const colors = getColorClasses(tag.color);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-accent',
                    isSelected && 'bg-accent'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded border',
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      colors.bg,
                      colors.text
                    )}
                  >
                    {tag.name}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface TagBadgeProps {
  tag: TagConfig;
  onRemove?: () => void;
  className?: string;
}

export function TagBadge({ tag, onRemove, className }: TagBadgeProps) {
  const colors = getColorClasses(tag.color);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        colors.bg,
        colors.text,
        className
      )}
    >
      {tag.name}
      {onRemove && (
        <button type="button" onClick={onRemove} className="hover:opacity-70">
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
