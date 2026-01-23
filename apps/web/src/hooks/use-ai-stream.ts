'use client';

import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient, getApiBaseUrl } from '@/lib/api-client';
import { aiKeys } from './use-ai';

interface StreamState {
  content: string;
  isStreaming: boolean;
  error: string | null;
}

interface StreamEvent {
  type: 'chunk' | 'done' | 'error';
  content?: string;
  error?: string;
}

/**
 * Hook for streaming AI chat responses via SSE.
 * Handles the connection lifecycle and updates conversation cache.
 */
export function useAiStream(conversationId: string) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<StreamState>({
    content: '',
    isStreaming: false,
    error: null,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!conversationId || state.isStreaming) return;

      // Reset state
      setState({ content: '', isStreaming: true, error: null });

      // Create abort controller
      abortControllerRef.current = new AbortController();

      try {
        const baseUrl = getApiBaseUrl();
        const url = `${baseUrl}/api/ai/conversations/${conversationId}/messages`;

        // Get auth headers
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...apiClient.getAuthHeaders(),
        };

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ message }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (!data) continue;

              try {
                const event: StreamEvent = JSON.parse(data);

                if (event.type === 'chunk' && event.content) {
                  fullContent += event.content;
                  setState((prev) => ({
                    ...prev,
                    content: fullContent,
                  }));
                } else if (event.type === 'done') {
                  // Stream complete
                } else if (event.type === 'error') {
                  setState((prev) => ({
                    ...prev,
                    error: event.error || 'Unknown error',
                    isStreaming: false,
                  }));
                  return;
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        // Mark streaming as complete
        setState((prev) => ({
          ...prev,
          isStreaming: false,
        }));

        // Invalidate conversation cache to fetch updated messages
        queryClient.invalidateQueries({
          queryKey: aiKeys.conversationDetail(conversationId),
        });
        queryClient.invalidateQueries({
          queryKey: aiKeys.conversations(),
        });
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // User cancelled the stream
          setState((prev) => ({
            ...prev,
            isStreaming: false,
          }));
          return;
        }

        setState({
          content: '',
          isStreaming: false,
          error: error instanceof Error ? error.message : 'Failed to send message',
        });
      }
    },
    [conversationId, state.isStreaming, queryClient]
  );

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isStreaming: false,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      content: '',
      isStreaming: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    sendMessage,
    stopStream,
    reset,
  };
}
