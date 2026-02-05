import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { endOfMonth, endOfWeek, endOfYear, format, parseISO, startOfDay } from 'date-fns';
import { Observable } from 'rxjs';

import type { AiConversation, AiInsight, AiMessage, AiSummary, InsightType } from '@goals/database';
import { MessageRole, SummaryType } from '@goals/database';
import type { SuggestedHabit } from '@goals/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

import type { StreamEvent } from './providers/anthropic.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import type {
  MonthlyData,
  UserContext,
  WeeklyData,
  YearlyData,
} from './services/data-aggregator.service';
import { DataAggregatorService } from './services/data-aggregator.service';

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
const BASE_SYSTEM_PROMPT = `You are a concise AI assistant for a goals and habits tracking app.

RESPONSE STYLE:
- Keep responses SHORT (2-4 sentences max for simple questions)
- Be direct and action-oriented - don't ask unnecessary clarifying questions
- Use the user's actual data to give specific, personalized answers
- Be warm but efficient

HANDLING REQUESTS:
- For unclear messages: Give a brief, helpful response about what you CAN help with
- For off-topic/inappropriate requests: Politely redirect to goals/habits topics in ONE sentence
- Don't lecture or give lengthy explanations unless explicitly asked
- If user asks to create/do something you can't do, say so briefly and suggest what you CAN help with`;

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

const HABIT_SUGGESTIONS_SYSTEM_PROMPT = `${BASE_SYSTEM_PROMPT}

You are generating habit suggestions based on a user's goal.

IMPORTANT: Return ONLY a valid JSON array with no additional text, no markdown code blocks, no explanation.
The response must be parseable by JSON.parse() directly.

JSON format:
[
  {
    "name": "Specific habit name (max 50 chars)",
    "frequency": "daily",
    "frequencyDays": [],
    "description": "Why this habit supports the goal",
    "icon": "dumbbell",
    "suggestedWeight": 25
  }
]

Rules:
- Generate 3-5 relevant habits that directly support achieving the goal
- Habits should be specific, measurable, and actionable
- frequency must be one of: "daily", "weekly", "specific_days"
- frequencyDays: array of numbers 0-6 (0=Sunday, 1=Monday, ..., 6=Saturday) - only used when frequency is "specific_days", otherwise empty array
- suggestedWeight: number 1-100 reflecting importance to goal (higher = more important, weights should roughly sum to 100)
- icon: use Lucide icon names (e.g., "dumbbell", "book-open", "dollar-sign", "heart", "brain", "target", "clock", "calendar", "check-circle", "trending-up")
- Keep habit names concise and action-oriented`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  // Rate limit constants
  private readonly FREE_TIER_DAILY_LIMIT = 1;
  private readonly RATE_LIMIT_TTL_SECONDS = 24 * 60 * 60; // 24 hours
  private readonly CACHE_TTL_SECONDS = 60 * 60; // 1 hour cache for suggestions

  constructor(
    private prisma: PrismaService,
    private anthropic: AnthropicProvider,
    private dataAggregator: DataAggregatorService,
    private workspacesService: WorkspacesService,
    private redisService: RedisService,
    private subscriptionsService: SubscriptionsService
  ) {}

  // ============================================================
  // DAILY TEXT
  // ============================================================

  async getDailyText(
    userId: string,
    workspaceId: string
  ): Promise<{ text: string; generatedAt: string; cached: boolean }> {
    const today = startOfDay(new Date());

    // Check for cached daily text first
    const cached = await this.prisma.aiDailyText.findUnique({
      where: {
        userId_workspaceId_date: {
          userId,
          workspaceId,
          date: today,
        },
      },
    });

    if (cached) {
      return {
        text: cached.content,
        generatedAt: cached.createdAt.toISOString(),
        cached: true,
      };
    }

    // Generate new daily text
    try {
      // Get user context for personalization (scoped to workspace)
      const userContext = await this.dataAggregator.getUserContext(userId, workspaceId);

      // Get user's name
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      const firstName = user?.name?.split(' ')[0] || 'there';

      // Build a personalized prompt based on user context
      const contextParts: string[] = [];

      if (userContext.habits.length > 0) {
        const completedToday = userContext.habits.filter((h) => h.completedToday).length;
        contextParts.push(`habits: ${completedToday}/${userContext.habits.length} completed today`);
      }

      // Get top streak from habits
      const habitsWithStreaks = userContext.habits.filter((h) => h.currentStreak > 0);
      if (habitsWithStreaks.length > 0) {
        const topStreak = habitsWithStreaks.sort((a, b) => b.currentStreak - a.currentStreak)[0];
        contextParts.push(`top streak: ${topStreak.currentStreak} days on "${topStreak.name}"`);
      }

      const contextStr =
        contextParts.length > 0 ? `\nUser context: ${contextParts.join(', ')}` : '';

      const prompt = `Generate a short (1-2 sentences) personalized daily motivational message for ${firstName}. ${contextStr}

Be warm, encouraging, and specific if context is available. Keep it brief and uplifting. Don't use emojis. Focus on progress and potential.`;

      const response = await this.anthropic.createMessage(
        prompt,
        'You are a supportive wellness coach. Generate brief, personalized daily messages that inspire action and celebrate progress. Keep messages under 30 words.'
      );

      const trimmedText = response.content.trim();

      // Cache the generated text for the day (per workspace)
      await this.prisma.aiDailyText.create({
        data: {
          userId,
          workspaceId,
          date: today,
          content: trimmedText,
        },
      });

      return {
        text: trimmedText,
        generatedAt: new Date().toISOString(),
        cached: false,
      };
    } catch (error) {
      this.logger.error('Failed to generate daily text', error);
      // Return a fallback message if AI fails
      return {
        text: 'Every day is a fresh start. Make today count with small, consistent actions toward your goals.',
        generatedAt: new Date().toISOString(),
        cached: false,
      };
    }
  }

  // ============================================================
  // CONVERSATIONS
  // ============================================================

  async getConversations(
    userId: string,
    workspaceId: string,
    limit = 20
  ): Promise<ConversationWithLastMessage[]> {
    return this.prisma.aiConversation.findMany({
      where: { userId, workspaceId },
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

  async createConversation(userId: string, workspaceId: string, title?: string) {
    return this.prisma.aiConversation.create({
      data: {
        userId,
        workspaceId,
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
   * Generate a short title for a conversation based on the first message
   */
  private async generateConversationTitle(
    conversationId: string,
    firstMessage: string
  ): Promise<void> {
    try {
      // Generate a concise title using AI
      const response = await this.anthropic.createMessage(
        `Generate a very short title (3-5 words max) for a conversation that starts with this message. Return ONLY the title, no quotes, no punctuation at the end.\n\nMessage: "${firstMessage.slice(0, 200)}"`,
        'You generate ultra-short conversation titles. Return only 3-5 words, no quotes or extra punctuation.'
      );

      const title = response.content.trim().slice(0, 50); // Limit to 50 chars

      if (title) {
        await this.prisma.aiConversation.update({
          where: { id: conversationId },
          data: { title },
        });
      }
    } catch (error) {
      // Fallback: use first few words of message
      const fallbackTitle = firstMessage.split(' ').slice(0, 4).join(' ').slice(0, 50);
      if (fallbackTitle) {
        await this.prisma.aiConversation.update({
          where: { id: conversationId },
          data: { title: fallbackTitle + '...' },
        });
      }
    }
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
      // Verify conversation ownership and get workspace context
      const conversation = await this.getConversation(userId, conversationId);

      // Check if this is the first message (conversation has default title)
      const isFirstMessage =
        conversation.messages.length === 0 &&
        (conversation.title === 'New conversation' || !conversation.title);

      // Get user context (scoped to the conversation's workspace)
      const userContext = await this.dataAggregator.getUserContext(
        userId,
        conversation.workspaceId
      );

      // Save user message
      await this.prisma.aiMessage.create({
        data: {
          conversationId,
          role: MessageRole.user,
          content: userMessage,
        },
      });

      // Auto-generate title for first message
      if (isFirstMessage) {
        this.generateConversationTitle(conversationId, userMessage).catch((err) =>
          this.logger.warn('Failed to generate conversation title:', err)
        );
      }

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
    const hasHabits = context.habits.length > 0;
    const hasTasks = context.pendingTasks > 0;
    const hasProjects = context.activeProjects > 0;

    return `${BASE_SYSTEM_PROMPT}

USER'S CURRENT DATA:
${hasHabits ? `- Habits: ${context.habits.map((h) => `${h.name} (${h.currentStreak} day streak)`).join(', ')}` : '- No habits set up yet'}
- Journal streak: ${context.journalStreak} days
${context.recentMoods.filter(Boolean).length > 0 ? `- Recent moods: ${context.recentMoods.filter(Boolean).join(', ')}` : ''}
${hasTasks ? `- ${context.pendingTasks} pending tasks` : '- No pending tasks'}
${hasProjects ? `- ${context.activeProjects} active projects` : '- No active projects'}

YOUR CAPABILITIES:
- Answer questions about their goals, habits, progress, and patterns
- Provide motivation and insights based on their data
- Suggest improvements to their routines

LIMITATIONS (be honest about these):
- You CANNOT create projects, tasks, or habits - they need to use the app's UI for that
- You CANNOT access data outside what's shown above
- If they ask you to "do" something you can't do, briefly explain and move on`;
  }

  // ============================================================
  // SUMMARIES
  // ============================================================

  async getSummaries(
    userId: string,
    workspaceId: string,
    type?: SummaryType,
    limit = 10
  ): Promise<AiSummary[]> {
    return this.prisma.aiSummary.findMany({
      where: {
        userId,
        workspaceId,
        ...(type ? { type } : {}),
      },
      orderBy: { periodStart: 'desc' },
      take: limit,
    });
  }

  async getOrGenerateSummary(
    userId: string,
    workspaceId: string,
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
          userId_workspaceId_type_periodStart: {
            userId,
            workspaceId,
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
    const summary = await this.generateSummary(userId, workspaceId, type, startDate, periodEnd);
    return { summary, isNew: true };
  }

  private async generateSummary(
    userId: string,
    workspaceId: string,
    type: SummaryType,
    periodStart: Date,
    periodEnd: Date
  ) {
    let data: WeeklyData | MonthlyData | YearlyData;
    let prompt: string;

    switch (type) {
      case SummaryType.weekly:
        data = await this.dataAggregator.getWeeklyData(userId, workspaceId, periodStart);
        prompt = this.buildWeeklySummaryPrompt(data as WeeklyData);
        break;
      case SummaryType.monthly:
        data = await this.dataAggregator.getMonthlyData(userId, workspaceId, periodStart);
        prompt = this.buildMonthlySummaryPrompt(data as MonthlyData);
        break;
      case SummaryType.yearly:
        data = await this.dataAggregator.getYearlyData(
          userId,
          workspaceId,
          periodStart.getFullYear()
        );
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
        userId_workspaceId_type_periodStart: {
          userId,
          workspaceId,
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
        workspaceId,
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
    workspaceId: string,
    type?: InsightType,
    includeDismissed = false
  ): Promise<AiInsight[]> {
    return this.prisma.aiInsight.findMany({
      where: {
        userId,
        workspaceId,
        ...(type ? { type } : {}),
        ...(includeDismissed ? {} : { dismissed: false }),
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateInsights(
    userId: string,
    workspaceId: string,
    types?: InsightType[]
  ): Promise<AiInsight[]> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const existingToday = await this.prisma.aiInsight.findMany({
      where: {
        userId,
        workspaceId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingToday.length > 0) {
      return types
        ? existingToday.filter((insight) => types.includes(insight.type))
        : existingToday;
    }

    const userContext = await this.dataAggregator.getUserContext(userId, workspaceId);

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

    // Discard previous insights before saving a new daily set
    await this.prisma.aiInsight.deleteMany({
      where: {
        userId,
        workspaceId,
        ...(types ? { type: { in: types } } : {}),
      },
    });

    // Save insights
    const savedInsights = await Promise.all(
      insights.map((insight) =>
        this.prisma.aiInsight.create({
          data: {
            userId,
            workspaceId,
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

  // ============================================================
  // HABIT SUGGESTIONS
  // ============================================================

  async generateHabitSuggestions(
    userId: string,
    workspaceId: string,
    projectId: string
  ): Promise<SuggestedHabit[]> {
    // Verify user has access to the workspace
    await this.workspacesService.verifyAccess(workspaceId, userId);

    // Check subscription and apply rate limiting for free users
    const subscription = await this.subscriptionsService.getOrCreateSubscription(userId);
    const isFreeUser = subscription.plan === 'FREE';

    if (isFreeUser) {
      const rateLimitKey = `habit_suggestions_usage:${userId}`;
      const usageCount = await this.redisService.get(rateLimitKey);

      if (usageCount && parseInt(usageCount, 10) >= this.FREE_TIER_DAILY_LIMIT) {
        // Get remaining TTL for the error message
        const ttl = await this.redisService.ttl(rateLimitKey);
        const hoursRemaining = ttl ? Math.ceil(ttl / 3600) : 24;

        throw new ForbiddenException(
          `Free plan allows ${this.FREE_TIER_DAILY_LIMIT} habit suggestion per day. ` +
            `Upgrade to Pro for unlimited suggestions, or try again in ${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}.`
        );
      }
    }

    // Check cache for existing suggestions (same project)
    const cacheKey = `habit_suggestions_cache:${projectId}`;
    const cached = await this.redisService.getJson<SuggestedHabit[]>(cacheKey);
    if (cached && cached.length > 0) {
      this.logger.debug(`Returning cached habit suggestions for project ${projectId}`);
      // Still count against rate limit even for cached results
      if (isFreeUser) {
        await this.redisService.incrementWithTTL(
          `habit_suggestions_usage:${userId}`,
          this.RATE_LIMIT_TTL_SECONDS
        );
      }
      return cached;
    }

    // Fetch project details
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        objective: true,
        successMetric: true,
        targetDate: true,
        workspaceId: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify project belongs to the specified workspace
    if (project.workspaceId !== workspaceId) {
      throw new NotFoundException('Project not found in this workspace');
    }

    // Build prompt with goal context
    const userPrompt = `Generate habit suggestions for this goal:

Goal Name: ${project.name}
Objective: ${project.objective}
Success Metric: ${project.successMetric || 'Not specified'}
Target Date: ${project.targetDate ? project.targetDate.toISOString().split('T')[0] : 'Not specified'}

Based on this goal, suggest 3-5 specific, actionable habits that will help achieve it. Consider the timeline and success metric when determining frequency and importance.`;

    try {
      const response = await this.anthropic.createMessage(
        HABIT_SUGGESTIONS_SYSTEM_PROMPT,
        userPrompt
      );

      // Parse JSON response
      let suggestions: SuggestedHabit[];
      try {
        let jsonContent = response.content.trim();
        // Handle potential markdown code blocks
        if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        suggestions = JSON.parse(jsonContent);
      } catch (parseError) {
        this.logger.warn(`Failed to parse habit suggestions JSON: ${parseError}`);
        return [];
      }

      // Validate and sanitize suggestions
      const validatedSuggestions = suggestions
        .filter(
          (s) =>
            s.name &&
            s.frequency &&
            ['daily', 'weekly', 'specific_days'].includes(s.frequency) &&
            typeof s.suggestedWeight === 'number'
        )
        .map((s) => ({
          name: s.name.substring(0, 50), // Enforce max length
          frequency: s.frequency,
          frequencyDays: Array.isArray(s.frequencyDays) ? s.frequencyDays : [],
          description: s.description || '',
          icon: s.icon || 'target',
          suggestedWeight: Math.min(100, Math.max(1, Math.round(s.suggestedWeight))),
        }));

      // Cache the suggestions
      if (validatedSuggestions.length > 0) {
        await this.redisService.setJson(cacheKey, validatedSuggestions, this.CACHE_TTL_SECONDS);
      }

      // Increment rate limit counter for free users
      if (isFreeUser) {
        await this.redisService.incrementWithTTL(
          `habit_suggestions_usage:${userId}`,
          this.RATE_LIMIT_TTL_SECONDS
        );
      }

      return validatedSuggestions;
    } catch (error) {
      // Don't count rate limit if the API call failed
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Failed to generate habit suggestions: ${error}`);
      return [];
    }
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
