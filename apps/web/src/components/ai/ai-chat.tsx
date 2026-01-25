'use client';

import { useRef, useEffect } from 'react';
import { useAiConversation } from '@/hooks/use-ai';
import { useAiStream } from '@/hooks/use-ai-stream';
import { AiChatMessage } from './ai-chat-message';
import { AiChatInput } from './ai-chat-input';
import { Loader2 } from 'lucide-react';

interface AiChatProps {
  conversationId: string;
}

export function AiChat({ conversationId }: AiChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: conversation, isLoading } = useAiConversation(conversationId);
  const {
    content: streamingContent,
    isStreaming,
    error,
    pendingUserMessage,
    sendMessage,
    stopStream,
  } = useAiStream(conversationId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages, streamingContent, pendingUserMessage]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Conversation not found
      </div>
    );
  }

  const messages = conversation.messages || [];
  const showEmptyState = messages.length === 0 && !pendingUserMessage && !streamingContent;

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {showEmptyState ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Start a conversation</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Ask me about your goals, habits, or progress. I can help you understand patterns and
                provide personalized insights.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <SuggestionChip onClick={(text) => sendMessage(text)}>
                How am I doing this week?
              </SuggestionChip>
              <SuggestionChip onClick={(text) => sendMessage(text)}>
                What habits should I focus on?
              </SuggestionChip>
              <SuggestionChip onClick={(text) => sendMessage(text)}>
                Show me my progress patterns
              </SuggestionChip>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((msg) => (
              <AiChatMessage key={msg.id} role={msg.role} content={msg.content} />
            ))}

            {/* Pending user message (shown immediately before server confirms) */}
            {pendingUserMessage && <AiChatMessage role="user" content={pendingUserMessage} />}

            {/* Loading indicator while waiting for AI response */}
            {isStreaming && !streamingContent && (
              <div className="flex items-center gap-2 px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" />
                </div>
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            )}

            {/* Streaming response */}
            {streamingContent && (
              <AiChatMessage
                role="assistant"
                content={streamingContent}
                isStreaming={isStreaming}
              />
            )}

            {/* Error message */}
            {error && <div className="p-4 bg-destructive/10 text-destructive text-sm">{error}</div>}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <AiChatInput onSend={sendMessage} onStop={stopStream} isStreaming={isStreaming} />
    </div>
  );
}

function SuggestionChip({
  children,
  onClick,
}: {
  children: string;
  onClick: (text: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(children)}
      className="rounded-full border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {children}
    </button>
  );
}
