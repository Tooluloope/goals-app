import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../../prisma/prisma.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AnthropicProvider } from './providers/anthropic.provider';
import { DataAggregatorService } from './services/data-aggregator.service';

@Module({
  imports: [PrismaModule, ConfigModule, SubscriptionsModule],
  controllers: [AiController],
  providers: [AiService, AnthropicProvider, DataAggregatorService],
  exports: [AiService],
})
export class AiModule {}
