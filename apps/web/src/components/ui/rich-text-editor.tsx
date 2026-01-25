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
}

function ToolbarButton({ icon: Icon, label, isActive, onClick, disabled }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={isActive ? 'secondary' : 'ghost'}
          size="sm"
          className={cn('h-8 w-8 p-0', isActive && 'bg-primary/20')}
          onClick={onClick}
          disabled={disabled}
        >
          <Icon className="h-4 w-4" />
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function EditorToolbar({ editor, disabled }: { editor: Editor | null; disabled?: boolean }) {
  if (!editor) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 flex-wrap border-b pb-2 mb-2">
        <ToolbarButton
          icon={Bold}
          label="Bold (⌘B)"
          isActive={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
        />
        <ToolbarButton
          icon={Italic}
          label="Italic (⌘I)"
          isActive={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
        />
        <ToolbarButton
          icon={Strikethrough}
          label="Strikethrough"
          isActive={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={disabled}
        />
        <ToolbarButton
          icon={Code}
          label="Code"
          isActive={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={disabled}
        />

        <div className="h-6 w-px bg-border mx-1" />

        <ToolbarButton
          icon={Heading2}
          label="Heading"
          isActive={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
        />
        <ToolbarButton
          icon={List}
          label="Bullet List"
          isActive={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
        />
        <ToolbarButton
          icon={ListOrdered}
          label="Numbered List"
          isActive={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
        />
        <ToolbarButton
          icon={Quote}
          label="Quote"
          isActive={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={disabled}
        />

        <div className="h-6 w-px bg-border mx-1" />

        <ToolbarButton
          icon={Undo}
          label="Undo (⌘Z)"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled || !editor.can().undo()}
        />
        <ToolbarButton
          icon={Redo}
          label="Redo (⌘⇧Z)"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled || !editor.can().redo()}
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
      editorProps: {
        attributes: {
          class: cn(
            'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
            'prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0',
            'prose-blockquote:my-2 prose-blockquote:border-l-primary/30',
            disabled && 'opacity-60 cursor-not-allowed'
          ),
        },
      },
    });

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

    return (
      <div ref={ref} className={cn('space-y-0', className)}>
        {showToolbar && !disabled && <EditorToolbar editor={editor} disabled={disabled} />}
        <div
          className={cn(
            'w-full rounded-xl border border-input bg-background px-4 py-3 text-sm',
            'ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
            disabled && 'cursor-not-allowed opacity-50',
            // Hide toolbar border radius when toolbar is shown
            showToolbar && !disabled && 'rounded-t-none border-t-0'
          )}
          style={{ minHeight }}
        >
          <EditorContent editor={editor} className="min-h-full" />
        </div>
        {showToolbar && !disabled && (
          <p className="text-xs text-muted-foreground mt-2">
            Use toolbar or shortcuts: ⌘B bold, ⌘I italic
          </p>
        )}
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';

export { RichTextEditor };
