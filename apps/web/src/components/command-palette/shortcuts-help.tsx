'use client';

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getShortcutDefinitions } from '@/hooks/use-keyboard-shortcuts';
import { cn } from '@/lib/utils';

interface ShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ShortcutKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-6 min-w-6 items-center justify-center rounded border',
        'bg-muted px-1.5 font-mono text-xs font-medium'
      )}
    >
      {children}
    </kbd>
  );
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <ShortcutKey key={i}>{key}</ShortcutKey>
        ))}
      </div>
    </div>
  );
}

interface ShortcutDefinition {
  keys: string[];
  description: string;
}

function ShortcutGroup({ title, shortcuts }: { title: string; shortcuts: ShortcutDefinition[] }) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="divide-y">
        {shortcuts.map((shortcut, i) => (
          <ShortcutRow key={i} keys={shortcut.keys} description={shortcut.description} />
        ))}
      </div>
    </div>
  );
}

export function ShortcutsHelp({ open, onOpenChange }: ShortcutsHelpProps) {
  // Get OS-aware shortcut definitions
  const shortcuts = useMemo(() => getShortcutDefinitions(), []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate quickly around the app.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <ShortcutGroup title="General" shortcuts={shortcuts.general} />
          <ShortcutGroup title="Navigation" shortcuts={shortcuts.navigation} />
          <ShortcutGroup title="Actions" shortcuts={shortcuts.actions} />
        </div>
        <div className="border-t pt-4 text-center text-xs text-muted-foreground">
          Press <ShortcutKey>?</ShortcutKey> to toggle this help
        </div>
      </DialogContent>
    </Dialog>
  );
}
