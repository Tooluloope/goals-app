import { Module } from '@nestjs/common';
import { HabitsService } from './habits.service';
import { HabitsController } from './habits.controller';
import { UsageModule } from '../usage/usage.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [UsageModule, EmailModule],
  providers: [HabitsService],
  controllers: [HabitsController],
  exports: [HabitsService],
})
export class HabitsModule {}
