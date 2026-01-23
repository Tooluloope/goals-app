'use client';

import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import type { MessageRole } from '@goals/shared';

interface AiChatMessageProps {
  role: MessageRole;
  content: string;
  isStreaming?: boolean;
}

export function AiChatMessage({ role, content, isStreaming }: AiChatMessageProps) {
  const isAssistant = role === 'assistant';

  return (
    <div className={cn('flex gap-3 p-4', isAssistant ? 'bg-muted/50' : 'bg-background')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isAssistant ? 'bg-primary text-primary-foreground' : 'bg-secondary'
        )}
      >
        {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>

      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="text-sm font-medium">{isAssistant ? 'Assistant' : 'You'}</div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap">{content}</p>
          {isStreaming && <span className="inline-block h-4 w-1 animate-pulse bg-foreground" />}
        </div>
      </div>
    </div>
  );
}
