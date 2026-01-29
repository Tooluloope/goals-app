'use client';

import { Check, ChevronsUpDown, X } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { type AreaConfig, getColorClasses } from '@/types/config';

interface AreaSelectProps {
  areas: AreaConfig[];
  selectedAreaIds: string[];
  onSelectionChange: (areaIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function AreaSelect({
  areas,
  selectedAreaIds,
  onSelectionChange,
  placeholder = 'Select areas...',
  disabled = false,
}: AreaSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedAreas = areas.filter((area) => selectedAreaIds.includes(area.id));

  const toggleArea = (areaId: string) => {
    if (selectedAreaIds.includes(areaId)) {
      // Don't allow removing if it's the last one
      if (selectedAreaIds.length > 1) {
        onSelectionChange(selectedAreaIds.filter((id) => id !== areaId));
      }
    } else {
      onSelectionChange([...selectedAreaIds, areaId]);
    }
  };

  const removeArea = (areaId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Don't allow removing if it's the last one
    if (selectedAreaIds.length > 1) {
      onSelectionChange(selectedAreaIds.filter((id) => id !== areaId));
    }
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
            {selectedAreas.length > 0 ? (
              selectedAreas.map((area) => {
                const colors = getColorClasses(area.color);
                return (
                  <span
                    key={area.id}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                      colors.bg,
                      colors.text
                    )}
                  >
                    {area.name}
                    {selectedAreaIds.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => removeArea(area.id, e)}
                        className="hover:opacity-70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
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
          {areas.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No areas available</p>
          ) : (
            areas.map((area) => {
              const isSelected = selectedAreaIds.includes(area.id);
              const colors = getColorClasses(area.color);
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => toggleArea(area.id)}
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
                    {area.name}
                  </span>
                  {area.description && (
                    <span className="text-xs text-muted-foreground">{area.description}</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
