import { ForbiddenException, Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

export type ResourceType = 'goals' | 'habits' | 'workspaces';

export interface UsageInfo {
  goalsCount: number;
  habitsCount: number;
  workspacesCount: number;
  limits: {
    goals: number;
    habits: number;
    workspaces: number;
  };
}

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(
    private prisma: PrismaService,
    private subscriptionsService: SubscriptionsService
  ) {}

  /**
   * Get or create usage quota for user
   */
  async getOrCreateUsageQuota(userId: string) {
    try {
      let quota = await this.prisma.usageQuota.findUnique({
        where: { userId },
      });

      if (!quota) {
        // Count actual usage
        const [goalsCount, habitsCount, workspacesCount] = await Promise.all([
          this.prisma.project.count({
            where: { workspace: { ownerId: userId } },
          }),
          this.prisma.habit.count({ where: { userId } }),
          this.prisma.workspace.count({ where: { ownerId: userId } }),
        ]);

        quota = await this.prisma.usageQuota.create({
          data: {
            userId,
            goalsCount,
            habitsCount,
            workspacesCount,
          },
        });

        this.logger.log(`Created usage quota for user ${userId}`);
      }

      return quota;
    } catch (error) {
      this.logger.error(`Failed to get/create usage quota: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get usage information for user
   */
  async getUsageInfo(userId: string): Promise<UsageInfo> {
    const [quota, limits] = await Promise.all([
      this.getOrCreateUsageQuota(userId),
      this.subscriptionsService.getPlanLimits(userId),
    ]);

    return {
      goalsCount: quota.goalsCount,
      habitsCount: quota.habitsCount,
      workspacesCount: quota.workspacesCount,
      limits,
    };
  }

  /**
   * Check if user can create more of a resource
   */
  async canCreate(userId: string, resource: ResourceType): Promise<boolean> {
    const usageInfo = await this.getUsageInfo(userId);

    switch (resource) {
      case 'goals':
        return usageInfo.goalsCount < usageInfo.limits.goals;
      case 'habits':
        return usageInfo.habitsCount < usageInfo.limits.habits;
      case 'workspaces':
        return usageInfo.workspacesCount < usageInfo.limits.workspaces;
      default:
        return false;
    }
  }

  /**
   * Enforce quota check - throw error if limit reached
   */
  async enforceQuota(userId: string, resource: ResourceType): Promise<void> {
    const canCreate = await this.canCreate(userId, resource);

    if (!canCreate) {
      const usageInfo = await this.getUsageInfo(userId);
      const subscription = await this.subscriptionsService.getSubscriptionStatus(userId);

      let currentCount: number;
      let limit: number;

      switch (resource) {
        case 'goals':
          currentCount = usageInfo.goalsCount;
          limit = usageInfo.limits.goals;
          break;
        case 'habits':
          currentCount = usageInfo.habitsCount;
          limit = usageInfo.limits.habits;
          break;
        case 'workspaces':
          currentCount = usageInfo.workspacesCount;
          limit = usageInfo.limits.workspaces;
          break;
      }

      throw new ForbiddenException(
        `You've reached your ${resource} limit (${currentCount}/${limit}) on the ${subscription.plan} plan. Upgrade to PRO for unlimited ${resource}.`
      );
    }
  }

  /**
   * Increment usage counter
   */
  async incrementUsage(userId: string, resource: ResourceType): Promise<void> {
    try {
      await this.getOrCreateUsageQuota(userId);

      const updateData: any = {};
      switch (resource) {
        case 'goals':
          updateData.goalsCount = { increment: 1 };
          break;
        case 'habits':
          updateData.habitsCount = { increment: 1 };
          break;
        case 'workspaces':
          updateData.workspacesCount = { increment: 1 };
          break;
      }

      await this.prisma.usageQuota.update({
        where: { userId },
        data: updateData,
      });

      this.logger.log(`Incremented ${resource} usage for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to increment usage: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Decrement usage counter
   */
  async decrementUsage(userId: string, resource: ResourceType): Promise<void> {
    try {
      await this.getOrCreateUsageQuota(userId);

      const updateData: any = {};
      switch (resource) {
        case 'goals':
          updateData.goalsCount = { decrement: 1 };
          break;
        case 'habits':
          updateData.habitsCount = { decrement: 1 };
          break;
        case 'workspaces':
          updateData.workspacesCount = { decrement: 1 };
          break;
      }

      await this.prisma.usageQuota.update({
        where: { userId },
        data: updateData,
      });

      this.logger.log(`Decremented ${resource} usage for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to decrement usage: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Sync usage counts from actual database counts
   * Useful for fixing discrepancies
   */
  async syncUsageCounts(userId: string): Promise<void> {
    try {
      const [goalsCount, habitsCount, workspacesCount] = await Promise.all([
        this.prisma.project.count({
          where: { workspace: { ownerId: userId } },
        }),
        this.prisma.habit.count({ where: { userId } }),
        this.prisma.workspace.count({ where: { ownerId: userId } }),
      ]);

      await this.prisma.usageQuota.upsert({
        where: { userId },
        create: {
          userId,
          goalsCount,
          habitsCount,
          workspacesCount,
        },
        update: {
          goalsCount,
          habitsCount,
          workspacesCount,
        },
      });

      this.logger.log(`Synced usage counts for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to sync usage counts: ${error.message}`, error.stack);
      throw error;
    }
  }
}
