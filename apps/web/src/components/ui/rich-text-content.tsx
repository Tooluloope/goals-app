'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface RichTextContentProps {
  children: string;
  className?: string;
}

/**
 * Renders rich text/HTML content in a read-only format.
 * Use this component to display saved rich text content from the editor.
 */
export function RichTextContent({ children, className }: RichTextContentProps) {
  if (!children || children.trim() === '' || children === '<p></p>') {
    return null;
  }

  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        'prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0',
        'prose-blockquote:my-2 prose-blockquote:border-l-primary/30 prose-blockquote:italic prose-blockquote:text-muted-foreground',
        'prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono',
        'prose-strong:font-semibold prose-em:italic',
        'prose-a:text-primary prose-a:hover:underline',
        className
      )}
      dangerouslySetInnerHTML={{ __html: children }}
    />
  );
}
