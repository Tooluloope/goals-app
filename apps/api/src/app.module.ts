import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ConfigModule as AppConfigModule } from './modules/config/config.module';
import { JournalModule } from './modules/journal/journal.module';
import { HabitsModule } from './modules/habits/habits.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { AiModule } from './modules/ai/ai.module';
import { EmailModule } from './modules/email/email.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env'],
    }),
    PrismaModule,
    EmailModule,
    AuthModule,
    UsersModule,
    WorkspacesModule,
    ProjectsModule,
    TasksModule,
    NotificationsModule,
    AppConfigModule,
    JournalModule,
    HabitsModule,
    ReviewsModule,
    AiModule,
    SchedulerModule,
  ],
})
export class AppModule {}
