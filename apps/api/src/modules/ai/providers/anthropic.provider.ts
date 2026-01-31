import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Observable } from 'rxjs';
import { Subject } from 'rxjs';

import Anthropic from '@anthropic-ai/sdk';

export interface StreamEvent {
  type: 'chunk' | 'done' | 'error';
  content?: string;
  error?: string;
}

@Injectable()
export class AnthropicProvider {
  private client: Anthropic;
  private readonly logger = new Logger(AnthropicProvider.name);
  private readonly model: string;
  private readonly maxTokens: number;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (!apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY not configured - AI features will be disabled');
    }

    this.client = new Anthropic({
      apiKey: apiKey || 'dummy-key', // SDK requires a key even if not used
    });

    this.model = this.configService.get<string>('ANTHROPIC_MODEL') || 'claude-3-5-sonnet-20241022';
    this.maxTokens = parseInt(this.configService.get<string>('AI_MAX_TOKENS') || '2000', 10);
  }

  /**
   * Check if AI features are enabled (API key configured)
   */
  isEnabled(): boolean {
    return !!this.configService.get<string>('ANTHROPIC_API_KEY');
  }

  /**
   * Create a message (non-streaming)
   */
  async createMessage(
    systemPrompt: string,
    userMessage: string,
    maxTokens?: number
  ): Promise<{ content: string; tokensUsed: number }> {
    if (!this.isEnabled()) {
      throw new InternalServerErrorException('AI features are not configured');
    }

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: maxTokens || this.maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });

      const textContent = response.content.find((block) => block.type === 'text');
      const content = textContent && 'text' in textContent ? textContent.text : '';

      return {
        content,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      };
    } catch (error) {
      this.logger.error('Anthropic API error:', error);
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Create a message with conversation history (non-streaming)
   */
  async createMessageWithHistory(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    maxTokens?: number
  ): Promise<{ content: string; tokensUsed: number }> {
    if (!this.isEnabled()) {
      throw new InternalServerErrorException('AI features are not configured');
    }

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: maxTokens || this.maxTokens,
        system: systemPrompt,
        messages,
      });

      const textContent = response.content.find((block) => block.type === 'text');
      const content = textContent && 'text' in textContent ? textContent.text : '';

      return {
        content,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      };
    } catch (error) {
      this.logger.error('Anthropic API error:', error);
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Stream a message response
   */
  streamMessage(
    systemPrompt: string,
    userMessage: string,
    maxTokens?: number
  ): Observable<StreamEvent> {
    const subject = new Subject<StreamEvent>();

    if (!this.isEnabled()) {
      setTimeout(() => {
        subject.next({ type: 'error', error: 'AI features are not configured' });
        subject.complete();
      }, 0);
      return subject.asObservable();
    }

    this.streamMessageAsync(subject, systemPrompt, userMessage, maxTokens);

    return subject.asObservable();
  }

  /**
   * Stream a message with conversation history
   */
  streamMessageWithHistory(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    maxTokens?: number
  ): Observable<StreamEvent> {
    const subject = new Subject<StreamEvent>();

    if (!this.isEnabled()) {
      setTimeout(() => {
        subject.next({ type: 'error', error: 'AI features are not configured' });
        subject.complete();
      }, 0);
      return subject.asObservable();
    }

    this.streamMessageWithHistoryAsync(subject, systemPrompt, messages, maxTokens);

    return subject.asObservable();
  }

  private async streamMessageAsync(
    subject: Subject<StreamEvent>,
    systemPrompt: string,
    userMessage: string,
    maxTokens?: number
  ): Promise<void> {
    try {
      const stream = this.client.messages.stream({
        model: this.model,
        max_tokens: maxTokens || this.maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });

      stream.on('text', (text) => {
        subject.next({ type: 'chunk', content: text });
      });

      stream.on('error', (error) => {
        this.logger.error('Streaming error:', error);
        subject.next({ type: 'error', error: error.message || 'Streaming failed' });
        subject.complete();
      });

      stream.on('end', () => {
        subject.next({ type: 'done' });
        subject.complete();
      });
    } catch (error) {
      this.logger.error('Stream initialization error:', error);
      subject.next({ type: 'error', error: 'Failed to initialize stream' });
      subject.complete();
    }
  }

  private async streamMessageWithHistoryAsync(
    subject: Subject<StreamEvent>,
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    maxTokens?: number
  ): Promise<void> {
    try {
      const stream = this.client.messages.stream({
        model: this.model,
        max_tokens: maxTokens || this.maxTokens,
        system: systemPrompt,
        messages,
      });

      stream.on('text', (text) => {
        subject.next({ type: 'chunk', content: text });
      });

      stream.on('error', (error) => {
        this.logger.error('Streaming error:', error);
        subject.next({ type: 'error', error: error.message || 'Streaming failed' });
        subject.complete();
      });

      stream.on('end', () => {
        subject.next({ type: 'done' });
        subject.complete();
      });
    } catch (error) {
      this.logger.error('Stream initialization error:', error);
      subject.next({ type: 'error', error: 'Failed to initialize stream' });
      subject.complete();
    }
  }

  private handleApiError(error: unknown): never {
    if (error instanceof Anthropic.APIError) {
      const status = error.status;
      const message = error.message;

      if (status === 401) {
        throw new InternalServerErrorException('AI service authentication failed');
      }
      if (status === 429) {
        throw new InternalServerErrorException(
          'AI service rate limit exceeded. Please try again later.'
        );
      }
      if (status === 500 || status === 503) {
        throw new InternalServerErrorException('AI service temporarily unavailable');
      }

      throw new InternalServerErrorException(`AI service error: ${message}`);
    }

    throw new InternalServerErrorException('AI service unavailable');
  }
}
