'use client';

import { useState } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { useWorkspaceMembers } from '@/hooks/use-workspace-members';
import { getColorClasses } from '@/types/config';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function BoardFilters() {
  const { boardFilters, setBoardFilters, resetBoardFilters } = useUIStore();
  const { currentWorkspace } = useAuthStore();
  const { getAreasForWorkspace, getPrioritiesForWorkspace, getActiveTags } = useConfigStore();
  const { data: members = [] } = useWorkspaceMembers(currentWorkspace?.id);
  const [isOpen, setIsOpen] = useState(false);

  const areas = currentWorkspace ? getAreasForWorkspace(currentWorkspace.id) : [];
  const priorities = currentWorkspace ? getPrioritiesForWorkspace(currentWorkspace.id) : [];
  const tags = currentWorkspace ? getActiveTags(currentWorkspace.id) : [];

  const activeFilterCount =
    boardFilters.areaIds.length +
    boardFilters.priorityIds.length +
    boardFilters.tagIds.length +
    boardFilters.assignedTo.length +
    (boardFilters.dueSoon ? 1 : 0) +
    (boardFilters.reviewDue ? 1 : 0);

  const toggleArea = (areaId: string) => {
    const newAreaIds = boardFilters.areaIds.includes(areaId)
      ? boardFilters.areaIds.filter((a) => a !== areaId)
      : [...boardFilters.areaIds, areaId];
    setBoardFilters({ areaIds: newAreaIds });
  };

  const togglePriority = (priorityId: string) => {
    const newPriorityIds = boardFilters.priorityIds.includes(priorityId)
      ? boardFilters.priorityIds.filter((p) => p !== priorityId)
      : [...boardFilters.priorityIds, priorityId];
    setBoardFilters({ priorityIds: newPriorityIds });
  };

  const toggleTag = (tagId: string) => {
    const newTagIds = boardFilters.tagIds.includes(tagId)
      ? boardFilters.tagIds.filter((t) => t !== tagId)
      : [...boardFilters.tagIds, tagId];
    setBoardFilters({ tagIds: newTagIds });
  };

  const toggleAssignee = (userId: string) => {
    const newAssignedTo = boardFilters.assignedTo.includes(userId)
      ? boardFilters.assignedTo.filter((id) => id !== userId)
      : [...boardFilters.assignedTo, userId];
    setBoardFilters({ assignedTo: newAssignedTo });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="h-5 w-5 rounded-full p-0">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filters</h4>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetBoardFilters}
                className="h-auto px-2 py-1 text-xs"
              >
                Clear all
              </Button>
            )}
          </div>

          <Separator />

          {/* Areas */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Area</Label>
            <div className="flex flex-wrap gap-2">
              {areas.map((area) => {
                const colors = getColorClasses(area.color);
                const isSelected = boardFilters.areaIds.includes(area.id);
                return (
                  <button
                    key={area.id}
                    onClick={() => toggleArea(area.id)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-medium transition-all',
                      isSelected
                        ? cn(colors.bg, colors.text, 'ring-2 ring-offset-1 ring-primary')
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {area.name}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Priorities */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Priority</Label>
            <div className="flex gap-2">
              {priorities.map((priority) => {
                const colors = getColorClasses(priority.color);
                const isSelected = boardFilters.priorityIds.includes(priority.id);
                return (
                  <button
                    key={priority.id}
                    onClick={() => togglePriority(priority.id)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-medium transition-all',
                      isSelected
                        ? cn(colors.bg, colors.text, 'ring-2 ring-offset-1 ring-primary')
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {priority.name}
                  </button>
                );
              })}
            </div>
          </div>

          {tags.length > 0 && (
            <>
              <Separator />

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const colors = getColorClasses(tag.color);
                    const isSelected = boardFilters.tagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-medium transition-all',
                          isSelected
                            ? cn(colors.bg, colors.text, 'ring-2 ring-offset-1 ring-primary')
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        )}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {members.length > 1 && (
            <>
              <Separator />

              {/* Assignee */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Assignee</Label>
                <div className="flex flex-wrap gap-2">
                  {members.map((member) => {
                    const isSelected = boardFilters.assignedTo.includes(member.userId);
                    return (
                      <button
                        key={member.userId}
                        onClick={() => toggleAssignee(member.userId)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium transition-all',
                          isSelected
                            ? 'bg-primary text-primary-foreground ring-2 ring-offset-1 ring-primary'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        )}
                      >
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={member.avatar || undefined} />
                          <AvatarFallback className="text-[8px]">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        {member.name.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Quick Filters */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">Quick filters</Label>

            <div className="flex items-center gap-2">
              <Checkbox
                id="dueSoon"
                checked={boardFilters.dueSoon}
                onCheckedChange={(checked) => setBoardFilters({ dueSoon: checked === true })}
              />
              <Label htmlFor="dueSoon" className="text-sm font-normal cursor-pointer">
                Due soon (next 14 days)
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="reviewDue"
                checked={boardFilters.reviewDue}
                onCheckedChange={(checked) => setBoardFilters({ reviewDue: checked === true })}
              />
              <Label htmlFor="reviewDue" className="text-sm font-normal cursor-pointer">
                Review due
              </Label>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
