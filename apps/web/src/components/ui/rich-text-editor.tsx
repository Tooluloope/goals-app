'use client';

import * as React from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Code,
  Undo,
  Redo,
  Strikethrough,
  Type,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  className?: string;
  showToolbar?: boolean;
}

interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
  compact?: boolean;
}

function ToolbarButton({
  icon: Icon,
  label,
  isActive,
  onClick,
  disabled,
  compact,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={isActive ? 'secondary' : 'ghost'}
          size="sm"
          className={cn(
            compact ? 'h-7 w-7 p-0' : 'h-8 w-8 p-0',
            isActive && 'bg-primary/20 text-primary'
          )}
          onClick={onClick}
          disabled={disabled}
        >
          <Icon className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function FloatingToolbar({
  editor,
  disabled,
  isVisible,
}: {
  editor: Editor | null;
  disabled?: boolean;
  isVisible: boolean;
}) {
  if (!editor) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'flex items-center gap-0.5 rounded-lg border bg-background/95 backdrop-blur-sm p-1 shadow-lg',
          'transition-all duration-200 ease-out',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        )}
      >
        <ToolbarButton
          icon={Bold}
          label="Bold (⌘B)"
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          compact
        />
        <ToolbarButton
          icon={Italic}
          label="Italic (⌘I)"
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          compact
        />
        <ToolbarButton
          icon={Strikethrough}
          label="Strikethrough"
          isActive={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={disabled}
          compact
        />

        <div className="h-5 w-px bg-border mx-0.5" />

        <ToolbarButton
          icon={Heading2}
          label="Heading"
          isActive={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
          compact
        />
        <ToolbarButton
          icon={List}
          label="Bullet List"
          isActive={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          compact
        />
        <ToolbarButton
          icon={ListOrdered}
          label="Numbered List"
          isActive={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          compact
        />
        <ToolbarButton
          icon={Quote}
          label="Quote"
          isActive={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={disabled}
          compact
        />
        <ToolbarButton
          icon={Code}
          label="Code"
          isActive={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={disabled}
          compact
        />

        <div className="h-5 w-px bg-border mx-0.5" />

        <ToolbarButton
          icon={Undo}
          label="Undo (⌘Z)"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled || !editor.can().undo()}
          compact
        />
        <ToolbarButton
          icon={Redo}
          label="Redo (⌘⇧Z)"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled || !editor.can().redo()}
          compact
        />
      </div>
    </TooltipProvider>
  );
}

const RichTextEditor = React.forwardRef<HTMLDivElement, RichTextEditorProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Start writing...',
      disabled = false,
      minHeight = '120px',
      className,
      showToolbar = true,
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [toolbarVisible, setToolbarVisible] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [2, 3],
          },
        }),
        Placeholder.configure({
          placeholder,
          emptyEditorClass: 'is-editor-empty',
        }),
      ],
      content: value,
      editable: !disabled,
      immediatelyRender: false,
      onUpdate: ({ editor }) => {
        // Get HTML content
        const html = editor.getHTML();
        // Convert to a simple format (we store HTML, render with the same)
        onChange(html === '<p></p>' ? '' : html);
      },
      onFocus: () => setIsFocused(true),
      onBlur: () => {
        // Delay hiding to allow toolbar button clicks
        setTimeout(() => {
          if (!containerRef.current?.contains(document.activeElement)) {
            setIsFocused(false);
          }
        }, 150);
      },
      editorProps: {
        attributes: {
          class: cn(
            'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
            'prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0',
            'prose-blockquote:my-2 prose-blockquote:border-l-primary/30',
            disabled && 'opacity-60 cursor-not-allowed'
          ),
        },
        // Prevent jarring scroll jumps on mobile when focusing the editor
        scrollThreshold: 100,
        scrollMargin: 50,
      },
    });

    // Show toolbar when focused or manually toggled
    const isToolbarVisible = showToolbar && !disabled && (isFocused || toolbarVisible);

    // Update editor content when value prop changes externally
    React.useEffect(() => {
      if (
        editor &&
        value !== editor.getHTML() &&
        value !== (editor.getHTML() === '<p></p>' ? '' : editor.getHTML())
      ) {
        editor.commands.setContent(value || '');
      }
    }, [value, editor]);

    // Update editable state when disabled changes
    React.useEffect(() => {
      if (editor) {
        editor.setEditable(!disabled);
      }
    }, [disabled, editor]);

    // Handle clicks outside to close toolbar
    React.useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setToolbarVisible(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div ref={ref} className={cn('relative scroll-mt-20 scroll-mb-24', className)}>
        <div ref={containerRef} className="relative">
          {/* Floating Toolbar */}
          {showToolbar && !disabled && (
            <div className="absolute -top-1 left-0 right-0 z-10 -translate-y-full">
              <FloatingToolbar editor={editor} disabled={disabled} isVisible={isToolbarVisible} />
            </div>
          )}

          {/* Editor Container */}
          <div
            className={cn(
              'w-full rounded-xl border bg-background text-sm transition-all duration-200',
              isFocused
                ? 'border-primary/50 ring-2 ring-primary/20'
                : 'border-input hover:border-muted-foreground/30',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {/* Top bar with format toggle */}
            {showToolbar && !disabled && (
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
                <button
                  type="button"
                  onClick={() => {
                    setToolbarVisible(!toolbarVisible);
                    editor?.chain().focus().run();
                  }}
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-medium transition-colors',
                    isToolbarVisible
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Type className="h-3.5 w-3.5" />
                  <span>Format</span>
                  <ChevronDown
                    className={cn('h-3 w-3 transition-transform', isToolbarVisible && 'rotate-180')}
                  />
                </button>
                <span className="text-[10px] text-muted-foreground">⌘B bold · ⌘I italic</span>
              </div>
            )}

            {/* Editor Content */}
            <div className="px-4 py-3" style={{ minHeight }}>
              <EditorContent editor={editor} className="min-h-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';

export { RichTextEditor };
