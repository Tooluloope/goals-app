import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AiService } from './ai.service';
import {
  CreateConversationDto,
  SendMessageDto,
  GenerateSummaryDto,
  SummaryTypeEnum,
} from './dto/ai.dto';
import {
  SummaryType,
  InsightType,
  AiSummary,
  AiInsight,
  AiConversation,
  AiMessage,
} from '@goals/database';

interface UserWithoutPassword {
  id: string;
  email: string;
  name: string;
}

// Response types for explicit typing
interface SummaryResponse {
  summary: AiSummary;
  isNew: boolean;
}

interface ConversationWithMessages extends AiConversation {
  messages: AiMessage[];
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  // ============================================================
  // CONVERSATIONS
  // ============================================================

  @Get('conversations')
  getConversations(
    @CurrentUser() user: UserWithoutPassword,
    @Query('limit') limit?: string
  ): Promise<Array<AiConversation & { messages: AiMessage[] }>> {
    return this.aiService.getConversations(user.id, limit ? parseInt(limit, 10) : undefined);
  }

  @Get('conversations/:id')
  getConversation(
    @CurrentUser() user: UserWithoutPassword,
    @Param('id') id: string
  ): Promise<ConversationWithMessages> {
    return this.aiService.getConversation(user.id, id);
  }

  @Post('conversations')
  createConversation(@CurrentUser() user: UserWithoutPassword, @Body() dto: CreateConversationDto) {
    return this.aiService.createConversation(user.id, dto.title);
  }

  @Delete('conversations/:id')
  deleteConversation(@CurrentUser() user: UserWithoutPassword, @Param('id') id: string) {
    return this.aiService.deleteConversation(user.id, id);
  }

  @Post('conversations/:id/messages')
  @Sse()
  sendMessage(
    @CurrentUser() user: UserWithoutPassword,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto
  ): Observable<MessageEvent> {
    return this.aiService
      .streamChatResponse(user.id, conversationId, dto.message)
      .pipe(map((event) => ({ data: event.data })));
  }

  // ============================================================
  // SUMMARIES
  // ============================================================

  @Get('summaries')
  getSummaries(
    @CurrentUser() user: UserWithoutPassword,
    @Query('type') type?: SummaryTypeEnum,
    @Query('limit') limit?: string
  ): Promise<AiSummary[]> {
    const summaryType = type ? (type as unknown as SummaryType) : undefined;
    return this.aiService.getSummaries(
      user.id,
      summaryType,
      limit ? parseInt(limit, 10) : undefined
    );
  }

  @Get('summaries/weekly/:weekStart')
  getWeeklySummary(
    @CurrentUser() user: UserWithoutPassword,
    @Param('weekStart') weekStart: string,
    @Query('forceRegenerate') forceRegenerate?: string
  ): Promise<SummaryResponse> {
    return this.aiService.getOrGenerateSummary(
      user.id,
      SummaryType.weekly,
      weekStart,
      forceRegenerate === 'true'
    );
  }

  @Get('summaries/monthly/:month')
  getMonthlySummary(
    @CurrentUser() user: UserWithoutPassword,
    @Param('month') month: string,
    @Query('forceRegenerate') forceRegenerate?: string
  ): Promise<SummaryResponse> {
    return this.aiService.getOrGenerateSummary(
      user.id,
      SummaryType.monthly,
      month,
      forceRegenerate === 'true'
    );
  }

  @Get('summaries/yearly/:year')
  getYearlySummary(
    @CurrentUser() user: UserWithoutPassword,
    @Param('year') year: string,
    @Query('forceRegenerate') forceRegenerate?: string
  ): Promise<SummaryResponse> {
    // Convert year to start of year date
    const yearStart = `${year}-01-01`;
    return this.aiService.getOrGenerateSummary(
      user.id,
      SummaryType.yearly,
      yearStart,
      forceRegenerate === 'true'
    );
  }

  @Post('summaries/generate')
  generateSummary(
    @CurrentUser() user: UserWithoutPassword,
    @Body() dto: GenerateSummaryDto
  ): Promise<SummaryResponse> {
    const summaryType = dto.type as unknown as SummaryType;
    return this.aiService.getOrGenerateSummary(
      user.id,
      summaryType,
      dto.periodStart,
      dto.forceRegenerate
    );
  }

  // ============================================================
  // INSIGHTS
  // ============================================================

  @Get('insights')
  getInsights(
    @CurrentUser() user: UserWithoutPassword,
    @Query('type') type?: string,
    @Query('includeDismissed') includeDismissed?: string
  ): Promise<AiInsight[]> {
    const insightType = type ? (type as InsightType) : undefined;
    return this.aiService.getInsights(user.id, insightType, includeDismissed === 'true');
  }

  @Post('insights/generate')
  generateInsights(
    @CurrentUser() user: UserWithoutPassword,
    @Query('types') types?: string
  ): Promise<AiInsight[]> {
    const insightTypes = types ? (types.split(',') as InsightType[]) : undefined;
    return this.aiService.generateInsights(user.id, insightTypes);
  }

  @Patch('insights/:id/dismiss')
  dismissInsight(
    @CurrentUser() user: UserWithoutPassword,
    @Param('id') id: string
  ): Promise<AiInsight> {
    return this.aiService.dismissInsight(user.id, id);
  }
}
