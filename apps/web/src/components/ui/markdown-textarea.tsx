'use client';

import * as React from 'react';
import { Bold, Italic, List, ListOrdered, Heading2, Quote, Code, Eye, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Textarea } from './textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

export interface MarkdownTextareaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange'
> {
  value: string;
  onChange: (value: string) => void;
  showToolbar?: boolean;
  showPreview?: boolean;
  minHeight?: string;
}

const toolbarItems = [
  { icon: Bold, label: 'Bold', prefix: '**', suffix: '**', placeholder: 'bold text' },
  { icon: Italic, label: 'Italic', prefix: '_', suffix: '_', placeholder: 'italic text' },
  { icon: Heading2, label: 'Heading', prefix: '## ', suffix: '', placeholder: 'Heading' },
  {
    icon: List,
    label: 'Bullet List',
    prefix: '- ',
    suffix: '',
    placeholder: 'List item',
    isLine: true,
  },
  {
    icon: ListOrdered,
    label: 'Numbered List',
    prefix: '1. ',
    suffix: '',
    placeholder: 'List item',
    isLine: true,
  },
  { icon: Quote, label: 'Quote', prefix: '> ', suffix: '', placeholder: 'Quote', isLine: true },
  { icon: Code, label: 'Code', prefix: '`', suffix: '`', placeholder: 'code' },
];

const MarkdownTextarea = React.forwardRef<HTMLTextAreaElement, MarkdownTextareaProps>(
  (
    {
      className,
      value,
      onChange,
      showToolbar = true,
      showPreview = true,
      minHeight = '120px',
      placeholder,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isPreview, setIsPreview] = React.useState(false);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Merge refs
    React.useImperativeHandle(ref, () => textareaRef.current!);

    const insertFormatting = (
      prefix: string,
      suffix: string,
      placeholder: string,
      isLine?: boolean
    ) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const textToInsert = selectedText || placeholder;

      let newText: string;
      let newCursorPos: number;

      if (isLine) {
        // For line-based formatting (lists, quotes), insert at line start
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const beforeLine = value.substring(0, lineStart);
        const afterStart = value.substring(lineStart);
        newText = beforeLine + prefix + afterStart;
        newCursorPos = start + prefix.length;
      } else {
        // For inline formatting (bold, italic, code)
        newText = value.substring(0, start) + prefix + textToInsert + suffix + value.substring(end);
        newCursorPos = selectedText
          ? start + prefix.length + textToInsert.length + suffix.length
          : start + prefix.length;
      }

      onChange(newText);

      // Restore focus and cursor position
      setTimeout(() => {
        textarea.focus();
        if (!selectedText && !isLine) {
          textarea.setSelectionRange(
            start + prefix.length,
            start + prefix.length + placeholder.length
          );
        } else {
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Cmd/Ctrl + B for bold
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        insertFormatting('**', '**', 'bold text');
      }
      // Cmd/Ctrl + I for italic
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        insertFormatting('_', '_', 'italic text');
      }
    };

    return (
      <div className="space-y-2">
        {/* Toolbar */}
        {showToolbar && !disabled && (
          <div className="flex items-center gap-1 flex-wrap">
            <TooltipProvider delayDuration={300}>
              {toolbarItems.map((item) => (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() =>
                        insertFormatting(item.prefix, item.suffix, item.placeholder, item.isLine)
                      }
                      disabled={isPreview}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="sr-only">{item.label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}

              {/* Preview Toggle */}
              {showPreview && (
                <>
                  <div className="h-6 w-px bg-border mx-1" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={isPreview ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-8 px-2 gap-1"
                        onClick={() => setIsPreview(!isPreview)}
                      >
                        {isPreview ? (
                          <>
                            <Edit3 className="h-4 w-4" />
                            <span className="text-xs">Edit</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            <span className="text-xs">Preview</span>
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>{isPreview ? 'Switch to edit mode' : 'Preview markdown'}</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </TooltipProvider>
          </div>
        )}

        {/* Editor / Preview */}
        {isPreview ? (
          <div
            className={cn(
              'w-full rounded-xl border border-input bg-muted/30 px-4 py-3 text-sm prose prose-sm dark:prose-invert max-w-none overflow-auto',
              className
            )}
            style={{ minHeight }}
          >
            {value ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom styling for markdown elements
                  h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
                  h2: ({ children }) => (
                    <h2 className="text-lg font-semibold mt-3 mb-2">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold mt-2 mb-1">{children}</h3>
                  ),
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>
                  ),
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-2">
                      {children}
                    </blockquote>
                  ),
                  code: ({ className, children, ...props }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                        {children}
                      </code>
                    ) : (
                      <code
                        className={cn(
                          'block bg-muted p-3 rounded-lg text-sm font-mono overflow-x-auto',
                          className
                        )}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                }}
              >
                {value}
              </ReactMarkdown>
            ) : (
              <span className="text-muted-foreground">{placeholder || 'Nothing to preview'}</span>
            )}
          </div>
        ) : (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
            style={{ minHeight }}
            {...props}
          />
        )}

        {/* Help text */}
        {showToolbar && !disabled && !isPreview && (
          <p className="text-xs text-muted-foreground">
            Supports markdown: **bold**, _italic_, - lists, ## headings
          </p>
        )}
      </div>
    );
  }
);

MarkdownTextarea.displayName = 'MarkdownTextarea';

export { MarkdownTextarea };
