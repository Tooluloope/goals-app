import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule as AppConfigModule } from './modules/config/config.module';
import { EmailModule } from './modules/email/email.module';
import { HabitsModule } from './modules/habits/habits.module';
import { HealthModule } from './modules/health/health.module';
import { JournalModule } from './modules/journal/journal.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { UsageModule } from './modules/usage/usage.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { PrismaModule } from './prisma/prisma.module';

// Conditionally include scheduler (default: enabled for backward compatibility)
const schedulerEnabled = process.env.ENABLE_SCHEDULER !== 'false';

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
    ...(schedulerEnabled ? [SchedulerModule] : []),
    HealthModule,
    StripeModule,
    SubscriptionsModule,
    UsageModule,
  ],
})
export class AppModule {}
