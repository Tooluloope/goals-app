import { Module } from '@nestjs/common';

import { HabitsModule } from '../habits/habits.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsageModule } from '../usage/usage.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [WorkspacesModule, NotificationsModule, UsageModule, HabitsModule],
  providers: [ProjectsService],
  controllers: [ProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}
