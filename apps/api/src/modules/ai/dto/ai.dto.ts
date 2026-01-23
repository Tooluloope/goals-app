import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsBoolean,
  IsEnum,
  IsUUID,
} from 'class-validator';

export class CreateConversationDto {
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
  @IsEnum(InsightTypeEnum, { each: true })
  @IsOptional()
  types?: InsightTypeEnum[];
}

export class DismissInsightDto {
  @IsUUID()
  insightId: string;
}
