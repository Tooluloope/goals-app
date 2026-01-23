import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AnthropicProvider } from './providers/anthropic.provider';
import { DataAggregatorService } from './services/data-aggregator.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [AiController],
  providers: [AiService, AnthropicProvider, DataAggregatorService],
  exports: [AiService],
})
export class AiModule {}
