import { Module } from '@nestjs/common';

import { EmailModule } from '../email/email.module';
import { UsageModule } from '../usage/usage.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';

@Module({
  imports: [UsageModule, EmailModule, WorkspacesModule],
  providers: [HabitsService],
  controllers: [HabitsController],
  exports: [HabitsService],
})
export class HabitsModule {}
