'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import sanitizeHtml from 'sanitize-html';
import { cn } from '@/lib/utils';

export interface RichTextContentProps {
  children: string;
  className?: string;
}

/**
 * Check if content appears to be HTML (from rich text editor)
 * vs plain text or markdown
 */
function isHtmlContent(content: string): boolean {
  // Check for common HTML tags that would come from a rich text editor
  return /<(p|div|span|strong|em|ul|ol|li|h[1-6]|br|a|blockquote)[\s>]/i.test(content);
}

const proseClasses = cn(
  'prose prose-sm dark:prose-invert max-w-none',
  'prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0',
  'prose-blockquote:my-2 prose-blockquote:border-l-primary/30 prose-blockquote:italic prose-blockquote:text-muted-foreground',
  'prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono',
  'prose-strong:font-semibold prose-em:italic',
  'prose-a:text-primary prose-a:hover:underline'
);

const SANITIZE_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'div',
    'span',
    'strong',
    'em',
    's',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'br',
    'a',
    'blockquote',
    'code',
    'pre',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    '*': ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => {
      const cleaned: Record<string, string> = {};
      if (attribs.href) cleaned.href = attribs.href;
      if (attribs.title) cleaned.title = attribs.title;
      if (attribs.target === '_blank') {
        cleaned.target = '_blank';
        cleaned.rel = 'noopener noreferrer';
      }
      return { tagName, attribs: cleaned };
    },
  },
};

/**
 * Renders rich text/HTML content or markdown in a read-only format.
 * Automatically detects HTML vs markdown and renders appropriately.
 */
export function RichTextContent({ children, className }: RichTextContentProps) {
  const content = children || '';
  const sanitizedHtml = React.useMemo(() => sanitizeHtml(content, SANITIZE_CONFIG), [content]);

  if (!content || content.trim() === '' || content === '<p></p>') {
    return null;
  }

  // If content looks like HTML (from rich text editor), render as HTML
  if (isHtmlContent(content)) {
    if (!sanitizedHtml || sanitizedHtml.trim() === '' || sanitizedHtml === '<p></p>') {
      return null;
    }
    return (
      <div
        className={cn(proseClasses, className)}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }

  // Otherwise, render as markdown
  return (
    <div className={cn(proseClasses, className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
