'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, X, Lock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Project, Task } from '@/types';
import { useConfigStore } from '@/store/config-store';
import { useAuthStore } from '@/store/auth-store';
import { getColorClasses } from '@/types/config';

interface BlockerSelectProps {
  type: 'project' | 'task';
  items: (Project | Task)[];
  selectedIds: string[];
  excludeId?: string; // Current item ID to exclude from selection
  onSelectionChange: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function BlockerSelect({
  type,
  items,
  selectedIds,
  excludeId,
  onSelectionChange,
  placeholder = 'Select blockers...',
  disabled = false,
}: BlockerSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const { currentWorkspace } = useAuthStore();
  const { getStatusById } = useConfigStore();

  // Filter out excluded item and filter by search
  const availableItems = items.filter((item) => {
    if (item.id === excludeId) return false;
    const name = 'name' in item ? item.name : item.title;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const selectedItems = items.filter((item) => selectedIds.includes(item.id));

  const toggleItem = (itemId: string) => {
    if (selectedIds.includes(itemId)) {
      onSelectionChange(selectedIds.filter((id) => id !== itemId));
    } else {
      onSelectionChange([...selectedIds, itemId]);
    }
  };

  const removeItem = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange(selectedIds.filter((id) => id !== itemId));
  };

  const getItemName = (item: Project | Task): string => {
    return 'name' in item ? item.name : item.title;
  };

  const getStatusColor = (statusId: string): string => {
    if (!currentWorkspace) return 'slate';
    const status = getStatusById(currentWorkspace.id, statusId);
    return status?.color || 'slate';
  };

  const isCompleted = (statusId: string): boolean => {
    if (!currentWorkspace) return false;
    const status = getStatusById(currentWorkspace.id, statusId);
    return status?.type === 'completed';
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
            {selectedItems.length > 0 ? (
              selectedItems.map((item) => {
                const colors = getColorClasses(getStatusColor(item.statusId));
                const completed = isCompleted(item.statusId);
                return (
                  <span
                    key={item.id}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                      colors.bg,
                      colors.text,
                      completed && 'line-through opacity-60'
                    )}
                  >
                    <Lock className="h-3 w-3" />
                    {getItemName(item)}
                    <button
                      type="button"
                      onClick={(e) => removeItem(item.id, e)}
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
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${type}s...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="max-h-60 overflow-auto border-t p-2">
          {availableItems.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No {type}s found</p>
          ) : (
            availableItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const colors = getColorClasses(getStatusColor(item.statusId));
              const completed = isCompleted(item.statusId);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item.id)}
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
                  <div className="flex flex-1 items-center gap-2 overflow-hidden">
                    <span className={cn('flex-1 truncate', completed && 'line-through opacity-60')}>
                      {getItemName(item)}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        colors.bg,
                        colors.text
                      )}
                    >
                      {currentWorkspace
                        ? getStatusById(currentWorkspace.id, item.statusId)?.name || 'Unknown'
                        : 'Unknown'}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Badge component to display a single blocker
interface BlockerBadgeProps {
  item: Project | Task;
  onRemove?: () => void;
  className?: string;
}

export function BlockerBadge({ item, onRemove, className }: BlockerBadgeProps) {
  const { currentWorkspace } = useAuthStore();
  const { getStatusById } = useConfigStore();

  const name = 'name' in item ? item.name : item.title;
  const status = currentWorkspace ? getStatusById(currentWorkspace.id, item.statusId) : null;
  const colors = getColorClasses(status?.color || 'slate');
  const completed = status?.type === 'completed';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        colors.bg,
        colors.text,
        completed && 'line-through opacity-60',
        className
      )}
    >
      <Lock className="h-3 w-3" />
      {name}
      {onRemove && (
        <button type="button" onClick={onRemove} className="hover:opacity-70">
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
