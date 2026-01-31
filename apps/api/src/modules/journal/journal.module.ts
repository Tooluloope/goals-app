import { Module } from '@nestjs/common';

import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

import { JournalController } from './journal.controller';
import { JournalService } from './journal.service';

@Module({
  imports: [SubscriptionsModule],
  providers: [JournalService],
  controllers: [JournalController],
  exports: [JournalService],
})
export class JournalModule {}
