import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

import { UsageController } from './usage.controller';
import { UsageService } from './usage.service';

@Module({
  imports: [PrismaModule, SubscriptionsModule],
  controllers: [UsageController],
  providers: [UsageService],
  exports: [UsageService],
})
export class UsageModule {}
