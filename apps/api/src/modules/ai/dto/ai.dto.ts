import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateConversationDto {
  @IsUUID()
  workspaceId: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  title?: string;
}

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message: string;
}

export enum SummaryTypeEnum {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class GenerateSummaryDto {
  @IsUUID()
  workspaceId: string;

  @IsEnum(SummaryTypeEnum)
  type: SummaryTypeEnum;

  @IsString()
  periodStart: string; // YYYY-MM-DD format

  @IsBoolean()
  @IsOptional()
  forceRegenerate?: boolean;
}

export enum InsightTypeEnum {
  PATTERN = 'pattern',
  RECOMMENDATION = 'recommendation',
  CELEBRATION = 'celebration',
  WARNING = 'warning',
  MILESTONE = 'milestone',
}

export class GenerateInsightsDto {
  @IsUUID()
  workspaceId: string;

  @IsEnum(InsightTypeEnum, { each: true })
  @IsOptional()
  types?: InsightTypeEnum[];
}

export class DismissInsightDto {
  @IsUUID()
  insightId: string;
}

// Query params DTO for workspace-scoped endpoints
export class WorkspaceQueryDto {
  @IsUUID()
  workspaceId: string;
}
