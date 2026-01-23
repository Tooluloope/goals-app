'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Search,
  LayoutDashboard,
  Columns3,
  FolderKanban,
  Calendar,
  Bell,
  Settings,
  Plus,
  Target,
  CheckSquare,
  FileText,
  LogOut,
  X,
} from 'lucide-react';
import { useProjects } from '@/hooks/use-projects';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { useConfigStore } from '@/store/config-store';
import { cn } from '@/lib/utils';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [search, setSearch] = React.useState('');

  const { data: projects } = useProjects();
  const { logout, currentWorkspace } = useAuthStore();
  const { setAddProjectModalOpen, openAddTaskModal } = useUIStore();
  const { getAreasForWorkspace, getStatusesForWorkspace } = useConfigStore();

  const areas = currentWorkspace ? getAreasForWorkspace(currentWorkspace.id) : [];
  const statuses = currentWorkspace ? getStatusesForWorkspace(currentWorkspace.id) : [];

  // Focus input when opened
  React.useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const runCommand = React.useCallback(
    (command: () => void) => {
      onOpenChange(false);
      command();
    },
    [onOpenChange]
  );

  // Navigation commands
  const navigationCommands = [
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      icon: LayoutDashboard,
      shortcut: 'G D',
      action: () => router.push('/dashboard'),
    },
    {
      id: 'board',
      label: 'Go to Board',
      icon: Columns3,
      shortcut: 'G B',
      action: () => router.push('/board'),
    },
    {
      id: 'projects',
      label: 'Go to Projects',
      icon: FolderKanban,
      shortcut: 'G P',
      action: () => router.push('/projects'),
    },
    {
      id: 'calendar',
      label: 'Go to Calendar',
      icon: Calendar,
      shortcut: 'G C',
      action: () => router.push('/calendar'),
    },
    {
      id: 'notifications',
      label: 'Go to Notifications',
      icon: Bell,
      shortcut: 'G N',
      action: () => router.push('/notifications'),
    },
    {
      id: 'settings',
      label: 'Go to Settings',
      icon: Settings,
      shortcut: 'G S',
      action: () => router.push('/settings'),
    },
  ];

  // Action commands
  const actionCommands = [
    {
      id: 'new-project',
      label: 'Create New Project',
      icon: Plus,
      shortcut: 'N P',
      action: () => setAddProjectModalOpen(true),
    },
    {
      id: 'logout',
      label: 'Sign Out',
      icon: LogOut,
      action: () => logout(),
    },
  ];

  // Get active projects for quick task creation
  const activeProjects =
    projects?.filter((p) => {
      const status = statuses.find((s) => s.id === p.statusId);
      return status?.name === 'Doing';
    }) || [];

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command Palette"
      className={cn(
        'fixed inset-0 z-50',
        'flex items-start justify-center pt-[20vh]',
        'bg-black/50 backdrop-blur-sm'
      )}
    >
      <div
        className={cn(
          'w-full max-w-xl',
          'overflow-hidden rounded-2xl border bg-background shadow-2xl',
          'animate-in fade-in-0 zoom-in-95 duration-200'
        )}
      >
        {/* Search Input */}
        <div className="flex items-center border-b px-4">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Command.Input
            ref={inputRef}
            value={search}
            onValueChange={setSearch}
            placeholder="Search projects, actions, or type a command..."
            className={cn(
              'flex h-12 w-full bg-transparent py-3 text-sm outline-none',
              'placeholder:text-muted-foreground',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          />
          {/* Close button for mobile, ESC hint for desktop */}
          <button
            onClick={() => onOpenChange(false)}
            className="ml-2 flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted sm:hidden"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <Command.List className="max-h-[400px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            No results found.
          </Command.Empty>

          {/* Projects */}
          {projects && projects.length > 0 && (
            <Command.Group heading="Projects">
              {projects.slice(0, 5).map((project) => {
                const area = areas.find((a) => a.id === project.areaId);
                return (
                  <Command.Item
                    key={project.id}
                    value={`project ${project.name} ${area?.name || ''}`}
                    onSelect={() => runCommand(() => router.push(`/project/${project.id}`))}
                    onClick={() => runCommand(() => router.push(`/project/${project.id}`))}
                    className={cn(
                      'relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2',
                      'text-sm outline-none',
                      'aria-selected:bg-accent aria-selected:text-accent-foreground',
                      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                    )}
                  >
                    <Target className="mr-3 h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <span>{project.name}</span>
                      {area && (
                        <span className="ml-2 text-xs text-muted-foreground">{area.name}</span>
                      )}
                    </div>
                  </Command.Item>
                );
              })}
            </Command.Group>
          )}

          {/* Quick Task Creation */}
          {activeProjects.length > 0 && (
            <Command.Group heading="Add Task To">
              {activeProjects.slice(0, 3).map((project) => (
                <Command.Item
                  key={`task-${project.id}`}
                  value={`add task to ${project.name}`}
                  onSelect={() => runCommand(() => openAddTaskModal(project.id))}
                  onClick={() => runCommand(() => openAddTaskModal(project.id))}
                  className={cn(
                    'relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2',
                    'text-sm outline-none',
                    'aria-selected:bg-accent aria-selected:text-accent-foreground'
                  )}
                >
                  <CheckSquare className="mr-3 h-4 w-4 text-muted-foreground" />
                  <span>Add task to {project.name}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Navigation */}
          <Command.Group heading="Navigation">
            {navigationCommands.map((cmd) => (
              <Command.Item
                key={cmd.id}
                value={cmd.label}
                onSelect={() => runCommand(cmd.action)}
                onClick={() => runCommand(cmd.action)}
                className={cn(
                  'relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2',
                  'text-sm outline-none',
                  'aria-selected:bg-accent aria-selected:text-accent-foreground'
                )}
              >
                <cmd.icon className="mr-3 h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{cmd.label}</span>
                {cmd.shortcut && (
                  <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
                    {cmd.shortcut}
                  </kbd>
                )}
              </Command.Item>
            ))}
          </Command.Group>

          {/* Actions */}
          <Command.Group heading="Actions">
            {actionCommands.map((cmd) => (
              <Command.Item
                key={cmd.id}
                value={cmd.label}
                onSelect={() => runCommand(cmd.action)}
                onClick={() => runCommand(cmd.action)}
                className={cn(
                  'relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2',
                  'text-sm outline-none',
                  'aria-selected:bg-accent aria-selected:text-accent-foreground'
                )}
              >
                <cmd.icon className="mr-3 h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{cmd.label}</span>
                {cmd.shortcut && (
                  <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
                    {cmd.shortcut}
                  </kbd>
                )}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>

        {/* Footer - hidden on mobile since we have the X button */}
        <div className="hidden items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground sm:flex">
          <div className="flex items-center gap-2">
            <span>Navigate</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono">↑↓</kbd>
          </div>
          <div className="flex items-center gap-2">
            <span>Select</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono">↵</kbd>
          </div>
          <div className="flex items-center gap-2">
            <span>Close</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono">ESC</kbd>
          </div>
        </div>
      </div>
    </Command.Dialog>
  );
}
