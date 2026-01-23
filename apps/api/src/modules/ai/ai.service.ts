import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnthropicProvider, StreamEvent } from './providers/anthropic.provider';
import {
  DataAggregatorService,
  WeeklyData,
  MonthlyData,
  YearlyData,
  UserContext,
} from './services/data-aggregator.service';
import { Observable, map } from 'rxjs';
import {
  SummaryType,
  MessageRole,
  InsightType,
  AiSummary,
  AiInsight,
  AiConversation,
  AiMessage,
} from '@goals/database';
import {
  startOfWeek,
  startOfMonth,
  parseISO,
  format,
  endOfWeek,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';

// Explicit return types for Prisma queries
interface ConversationWithLastMessage extends AiConversation {
  messages: AiMessage[];
}

interface ConversationWithMessages extends AiConversation {
  messages: AiMessage[];
}

interface SummaryResponse {
  summary: AiSummary;
  isNew: boolean;
}

// System prompts
const BASE_SYSTEM_PROMPT = `You are an AI assistant for a personal goals and habits tracking application.
You help users understand their progress, identify patterns, and improve their habits.

IMPORTANT GUIDELINES:
- Be encouraging but honest
- Focus on actionable insights
- Use specific data from the user's history when available
- Keep responses concise unless asked for detail
- Use a warm, supportive tone`;

const SUMMARY_SYSTEM_PROMPT = `${BASE_SYSTEM_PROMPT}

You are generating a summary of the user's progress. Focus on:
1. Highlighting achievements and wins
2. Identifying patterns (positive and areas for improvement)
3. Providing encouragement
4. Suggesting focus areas for the next period

IMPORTANT: Return ONLY a valid JSON object with no additional text, no markdown code blocks, no explanation.
The response must be parseable by JSON.parse() directly.

JSON format:
{
  "highlights": ["key highlight 1", "key highlight 2"],
  "moodTrend": "improving",
  "topAchievements": ["achievement 1", "achievement 2"],
  "areasForImprovement": ["area 1", "area 2"],
  "habitInsights": "brief analysis of habit performance",
  "encouragement": "personalized encouraging message",
  "suggestedFocus": ["focus area 1", "focus area 2"]
}

Valid moodTrend values: "improving", "stable", "declining"`;

const INSIGHTS_SYSTEM_PROMPT = `${BASE_SYSTEM_PROMPT}

You are analyzing the user's data to identify patterns and insights.

IMPORTANT: Return ONLY a valid JSON array with no additional text, no markdown code blocks, no explanation.
The response must be parseable by JSON.parse() directly.

JSON format:
[
  {
    "type": "pattern",
    "title": "Brief title here",
    "content": "Detailed insight here",
    "confidence": 0.85,
    "actionable": true
  }
]

Valid types: "pattern", "recommendation", "celebration", "warning", "milestone"
Confidence should be a number between 0.0 and 1.0`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    private anthropic: AnthropicProvider,
    private dataAggregator: DataAggregatorService
  ) {}

  // ============================================================
  // CONVERSATIONS
  // ============================================================

  async getConversations(userId: string, limit = 20): Promise<ConversationWithLastMessage[]> {
    return this.prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async getConversation(userId: string, conversationId: string): Promise<ConversationWithMessages> {
    const conversation = await this.prisma.aiConversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async createConversation(userId: string, title?: string) {
    return this.prisma.aiConversation.create({
      data: {
        userId,
        title: title || 'New conversation',
      },
    });
  }

  async deleteConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.aiConversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.prisma.aiConversation.delete({
      where: { id: conversationId },
    });
  }

  /**
   * Send a message and stream the response
   */
  streamChatResponse(
    userId: string,
    conversationId: string,
    userMessage: string
  ): Observable<{ data: string }> {
    return new Observable((subscriber) => {
      this.handleChatStream(userId, conversationId, userMessage, subscriber);
    });
  }

  private async handleChatStream(
    userId: string,
    conversationId: string,
    userMessage: string,
    subscriber: {
      next: (value: { data: string }) => void;
      complete: () => void;
      error: (err: Error) => void;
    }
  ) {
    try {
      // Verify conversation ownership
      const conversation = await this.getConversation(userId, conversationId);

      // Get user context
      const userContext = await this.dataAggregator.getUserContext(userId);

      // Save user message
      await this.prisma.aiMessage.create({
        data: {
          conversationId,
          role: MessageRole.user,
          content: userMessage,
        },
      });

      // Build system prompt with user context
      const systemPrompt = this.buildChatSystemPrompt(userContext);

      // Build message history
      const messages = conversation.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
      messages.push({ role: 'user', content: userMessage });

      // Stream response
      let fullResponse = '';

      const stream = this.anthropic.streamMessageWithHistory(systemPrompt, messages);

      stream.subscribe({
        next: (event: StreamEvent) => {
          if (event.type === 'chunk' && event.content) {
            fullResponse += event.content;
            subscriber.next({ data: JSON.stringify({ type: 'chunk', content: event.content }) });
          } else if (event.type === 'done') {
            subscriber.next({ data: JSON.stringify({ type: 'done' }) });
          } else if (event.type === 'error') {
            subscriber.next({ data: JSON.stringify({ type: 'error', error: event.error }) });
          }
        },
        complete: async () => {
          // Save assistant message
          if (fullResponse) {
            await this.prisma.aiMessage.create({
              data: {
                conversationId,
                role: MessageRole.assistant,
                content: fullResponse,
              },
            });

            // Update conversation timestamp
            await this.prisma.aiConversation.update({
              where: { id: conversationId },
              data: { updatedAt: new Date() },
            });
          }
          subscriber.complete();
        },
        error: (err) => {
          this.logger.error('Chat stream error:', err);
          subscriber.error(err);
        },
      });
    } catch (error) {
      this.logger.error('Chat error:', error);
      subscriber.next({
        data: JSON.stringify({ type: 'error', error: 'Failed to process message' }),
      });
      subscriber.complete();
    }
  }

  private buildChatSystemPrompt(context: UserContext): string {
    return `${BASE_SYSTEM_PROMPT}

USER CONTEXT (current data):
- Active habits: ${context.habits.map((h) => h.name).join(', ') || 'None'}
- Habit streaks: ${context.habits.map((h) => `${h.name}: ${h.currentStreak} days`).join(', ') || 'N/A'}
- Journal streak: ${context.journalStreak} days
- Recent moods: ${context.recentMoods.filter(Boolean).join(', ') || 'N/A'}
- Pending tasks: ${context.pendingTasks}
- Active projects: ${context.activeProjects}

Answer questions about the user's goals, habits, and progress.
Be specific when referencing their data.
If asked about something you don't have data for, say so honestly.`;
  }

  // ============================================================
  // SUMMARIES
  // ============================================================

  async getSummaries(userId: string, type?: SummaryType, limit = 10): Promise<AiSummary[]> {
    return this.prisma.aiSummary.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
      },
      orderBy: { periodStart: 'desc' },
      take: limit,
    });
  }

  async getOrGenerateSummary(
    userId: string,
    type: SummaryType,
    periodStart: string,
    forceRegenerate = false
  ): Promise<SummaryResponse> {
    const startDate = parseISO(periodStart);
    let periodEnd: Date;

    switch (type) {
      case SummaryType.weekly:
        periodEnd = endOfWeek(startDate, { weekStartsOn: 1 });
        break;
      case SummaryType.monthly:
        periodEnd = endOfMonth(startDate);
        break;
      case SummaryType.yearly:
        periodEnd = endOfYear(startDate);
        break;
    }

    // Check for existing summary
    if (!forceRegenerate) {
      const existing = await this.prisma.aiSummary.findUnique({
        where: {
          userId_type_periodStart: {
            userId,
            type,
            periodStart: startDate,
          },
        },
      });

      if (existing) {
        return { summary: existing, isNew: false };
      }
    }

    // Generate new summary
    const summary = await this.generateSummary(userId, type, startDate, periodEnd);
    return { summary, isNew: true };
  }

  private async generateSummary(
    userId: string,
    type: SummaryType,
    periodStart: Date,
    periodEnd: Date
  ) {
    let data: WeeklyData | MonthlyData | YearlyData;
    let prompt: string;

    switch (type) {
      case SummaryType.weekly:
        data = await this.dataAggregator.getWeeklyData(userId, periodStart);
        prompt = this.buildWeeklySummaryPrompt(data as WeeklyData);
        break;
      case SummaryType.monthly:
        data = await this.dataAggregator.getMonthlyData(userId, periodStart);
        prompt = this.buildMonthlySummaryPrompt(data as MonthlyData);
        break;
      case SummaryType.yearly:
        data = await this.dataAggregator.getYearlyData(userId, periodStart.getFullYear());
        prompt = this.buildYearlySummaryPrompt(data as YearlyData);
        break;
    }

    const response = await this.anthropic.createMessage(SUMMARY_SYSTEM_PROMPT, prompt);

    // Parse response - handle potential markdown code blocks
    let metadata = {};
    try {
      let jsonContent = response.content.trim();

      // Remove markdown code blocks if present
      if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      metadata = JSON.parse(jsonContent);
    } catch {
      // If not valid JSON, store raw content
      this.logger.warn('Failed to parse summary response, storing raw content');
      metadata = { raw: response.content };
    }

    // Save summary
    const summary = await this.prisma.aiSummary.upsert({
      where: {
        userId_type_periodStart: {
          userId,
          type,
          periodStart,
        },
      },
      update: {
        content: response.content,
        metadata: { ...metadata, tokensUsed: response.tokensUsed },
        periodEnd,
      },
      create: {
        userId,
        type,
        periodStart,
        periodEnd,
        content: response.content,
        metadata: { ...metadata, tokensUsed: response.tokensUsed },
      },
    });

    return summary;
  }

  private buildWeeklySummaryPrompt(data: WeeklyData): string {
    const journalSummary = data.journalEntries
      .map(
        (j) =>
          `- ${format(j.date, 'EEE')}: Mood=${j.mood || 'N/A'}, ${(j.content || '').slice(0, 100)}...`
      )
      .join('\n');

    const habitsSummary = data.habits
      .map(
        (h) =>
          `- ${h.name}: ${h.completedToday ? 'Completed' : 'Pending'}, Streak: ${h.currentStreak} days`
      )
      .join('\n');

    return `Generate a weekly summary for the week of ${data.weekStart}.

JOURNAL ENTRIES (${data.journalEntries.length}):
${journalSummary || 'No journal entries this week'}

HABITS:
${habitsSummary || 'No habits tracked'}

TASKS: ${data.tasksCompleted}/${data.totalTasks} completed

${
  data.weeklyReview
    ? `USER'S SELF-REVIEW:
- What went well: ${data.weeklyReview.wentWell || 'N/A'}
- To improve: ${data.weeklyReview.toImprove || 'N/A'}
- Rating: ${data.weeklyReview.rating || 'N/A'}/5`
    : 'No weekly review submitted'
}

Based on this data, generate a helpful weekly summary.`;
  }

  private buildMonthlySummaryPrompt(data: MonthlyData): string {
    const weeklyRatings = data.weeklyReviews.filter((r) => r.rating).map((r) => r.rating as number);
    const avgRating =
      weeklyRatings.length > 0
        ? (weeklyRatings.reduce((a, b) => a + b, 0) / weeklyRatings.length).toFixed(1)
        : 'N/A';

    return `Generate a monthly summary for ${data.month}.

OVERVIEW:
- Journal entries: ${data.journalEntries.length}
- Weekly reviews completed: ${data.weeklyReviews.length}
- Tasks completed: ${data.tasksCompleted}/${data.totalTasks}
- Average weekly rating: ${avgRating}/5

HABIT PERFORMANCE:
${data.habits.map((h) => `- ${h.name}: ${h.completionRate}% completion rate`).join('\n') || 'No habits tracked'}

KEY LESSONS FROM WEEKLY REVIEWS:
${
  data.weeklyReviews
    .map((r) => r.lessonsLearned)
    .filter(Boolean)
    .join('\n') || 'None recorded'
}

${
  data.monthlyReview
    ? `USER'S MONTHLY REFLECTION:
- Highlights: ${data.monthlyReview.highlights || 'N/A'}
- Challenges: ${data.monthlyReview.challenges || 'N/A'}
- Goals achieved: ${data.monthlyReview.goalsAchieved || 'N/A'}`
    : ''
}

Generate a comprehensive monthly summary with insights and recommendations.`;
  }

  private buildYearlySummaryPrompt(data: YearlyData): string {
    const moodSummary = Object.entries(data.moodDistribution)
      .map(([mood, count]) => `${mood}: ${count}`)
      .join(', ');

    return `Generate a year in review for ${data.year}.

OVERVIEW:
- Total journal entries: ${data.journalEntriesCount}
- Tasks completed: ${data.tasksCompleted}
- Monthly reviews: ${data.monthlyReviews.length}

MOOD DISTRIBUTION:
${moodSummary}

HIGHLIGHT MONTHS (highest rated):
${data.highlightMonths.map((m) => `- ${m.month}: ${m.rating}/5`).join('\n') || 'No rated months'}

HABITS:
${data.habits.map((h) => `- ${h.name}: ${h.completionRate}% completion`).join('\n') || 'No habits'}

KEY ACHIEVEMENTS FROM MONTHLY REVIEWS:
${
  data.monthlyReviews
    .map((r) => r.goalsAchieved)
    .filter(Boolean)
    .slice(0, 5)
    .join('\n') || 'None recorded'
}

Generate a comprehensive year in review celebrating achievements and identifying growth patterns.`;
  }

  // ============================================================
  // INSIGHTS
  // ============================================================

  async getInsights(
    userId: string,
    type?: InsightType,
    includeDismissed = false
  ): Promise<AiInsight[]> {
    return this.prisma.aiInsight.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
        ...(includeDismissed ? {} : { dismissed: false }),
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateInsights(userId: string, types?: InsightType[]): Promise<AiInsight[]> {
    const userContext = await this.dataAggregator.getUserContext(userId);

    const prompt = `Analyze this user's data and generate insights:

HABITS:
${userContext.habits.map((h) => `- ${h.name}: ${h.currentStreak} day streak, ${h.completionRate}% completion`).join('\n') || 'No habits'}

JOURNAL:
- Streak: ${userContext.journalStreak} days
- Recent moods: ${userContext.recentMoods.filter(Boolean).join(', ') || 'N/A'}

TASKS & PROJECTS:
- Pending tasks: ${userContext.pendingTasks}
- Active projects: ${userContext.activeProjects}

Generate 2-4 meaningful insights about patterns, achievements, or recommendations.
${types ? `Focus on these types: ${types.join(', ')}` : ''}`;

    const response = await this.anthropic.createMessage(INSIGHTS_SYSTEM_PROMPT, prompt);

    // Parse insights - handle potential markdown code blocks
    let insights: Array<{
      type: InsightType;
      title: string;
      content: string;
      confidence: number;
      actionable: boolean;
    }> = [];

    try {
      let jsonContent = response.content.trim();

      // Remove markdown code blocks if present
      if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      insights = JSON.parse(jsonContent);

      // Ensure it's an array
      if (!Array.isArray(insights)) {
        this.logger.warn('Insights response is not an array');
        return [];
      }
    } catch (error) {
      this.logger.warn('Failed to parse insights response:', response.content.substring(0, 200));
      return [];
    }

    // Save insights
    const savedInsights = await Promise.all(
      insights.map((insight) =>
        this.prisma.aiInsight.create({
          data: {
            userId,
            type: insight.type as InsightType,
            title: insight.title,
            content: insight.content,
            confidence: insight.confidence,
            actionable: insight.actionable,
            metadata: { tokensUsed: response.tokensUsed },
          },
        })
      )
    );

    return savedInsights;
  }

  async dismissInsight(userId: string, insightId: string): Promise<AiInsight> {
    const insight = await this.prisma.aiInsight.findFirst({
      where: { id: insightId, userId },
    });

    if (!insight) {
      throw new NotFoundException('Insight not found');
    }

    return this.prisma.aiInsight.update({
      where: { id: insightId },
      data: { dismissed: true },
    });
  }
}
