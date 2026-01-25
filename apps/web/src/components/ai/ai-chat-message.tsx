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
    <div className={cn('flex gap-3 p-4', isAssistant ? 'justify-start' : 'justify-end')}>
      {/* AI avatar - only show on left for assistant */}
      {isAssistant && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isAssistant
            ? 'bg-muted text-foreground rounded-tl-sm'
            : 'bg-primary text-primary-foreground rounded-tr-sm'
        )}
      >
        <div
          className={cn(
            'prose prose-sm max-w-none',
            isAssistant ? 'dark:prose-invert' : 'prose-invert'
          )}
        >
          <p className="whitespace-pre-wrap m-0">{content}</p>
          {isStreaming && <span className="inline-block h-4 w-1 ml-1 animate-pulse bg-current" />}
        </div>
      </div>

      {/* User avatar - only show on right for user */}
      {!isAssistant && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
