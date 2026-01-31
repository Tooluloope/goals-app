import { ForbiddenException, Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

export type SubscriptionPlan = 'FREE' | 'PRO' | 'FAMILY';
export type SubscriptionStatus =
  | 'ACTIVE'
  | 'TRIALING'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'INCOMPLETE'
  | 'INCOMPLETE_EXPIRED'
  | 'UNPAID';

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  features: {
    unlimitedGoals: boolean;
    unlimitedHabits: boolean;
    aiFeatures: boolean;
    familyWorkspaces: boolean;
    advancedAnalytics: boolean;
    dataExport: boolean;
    prioritySupport: boolean;
  };
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  // Plan limits
  private readonly PLAN_LIMITS = {
    FREE: {
      goals: 3,
      habits: 5,
      workspaces: 1,
    },
    PRO: {
      goals: Infinity,
      habits: Infinity,
      workspaces: 1,
    },
    FAMILY: {
      goals: Infinity,
      habits: Infinity,
      workspaces: Infinity,
    },
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Get or create subscription for user
   */
  async getOrCreateSubscription(userId: string): Promise<SubscriptionInfo> {
    try {
      let subscription = await this.prisma.subscription.findUnique({
        where: { userId },
      });

      // Create FREE subscription if doesn't exist
      if (!subscription) {
        subscription = await this.prisma.subscription.create({
          data: {
            userId,
            stripeCustomerId: `temp_${userId}`, // Temporary until Stripe customer created
            plan: 'FREE',
            status: 'ACTIVE',
          },
        });
        this.logger.log(`Created FREE subscription for user ${userId}`);
      }

      return this.mapSubscriptionToInfo(subscription);
    } catch (error) {
      this.logger.error(`Failed to get/create subscription: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get subscription status for user
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionInfo> {
    return this.getOrCreateSubscription(userId);
  }

  /**
   * Check if user has access to a specific plan or higher
   */
  async requiresPlan(userId: string, requiredPlan: SubscriptionPlan): Promise<boolean> {
    const subscription = await this.getOrCreateSubscription(userId);

    const planHierarchy = { FREE: 0, PRO: 1, FAMILY: 2 };
    const userPlanLevel = planHierarchy[subscription.plan];
    const requiredPlanLevel = planHierarchy[requiredPlan];

    // Check if subscription is active (including trial)
    const isActive = ['ACTIVE', 'TRIALING'].includes(subscription.status);

    return isActive && userPlanLevel >= requiredPlanLevel;
  }

  /**
   * Throw error if user doesn't have required plan
   */
  async enforceplan(userId: string, requiredPlan: SubscriptionPlan): Promise<void> {
    const hasAccess = await this.requiresPlan(userId, requiredPlan);

    if (!hasAccess) {
      const subscription = await this.getOrCreateSubscription(userId);
      throw new ForbiddenException(
        `This feature requires ${requiredPlan} plan. Your current plan: ${subscription.plan}`
      );
    }
  }

  /**
   * Check if user can access AI features
   */
  async canAccessAI(userId: string): Promise<boolean> {
    return this.requiresPlan(userId, 'PRO');
  }

  /**
   * Check if user can create family workspaces
   */
  async canCreateFamilyWorkspace(userId: string): Promise<boolean> {
    return this.requiresPlan(userId, 'FAMILY');
  }

  /**
   * Get plan limits for user
   */
  async getPlanLimits(
    userId: string
  ): Promise<{ goals: number; habits: number; workspaces: number }> {
    const subscription = await this.getOrCreateSubscription(userId);
    return this.PLAN_LIMITS[subscription.plan];
  }

  /**
   * Initialize subscription and usage quota for new user
   */
  async initializeForNewUser(
    userId: string,
    stripeCustomerId: string,
    plan: SubscriptionPlan = 'FREE'
  ): Promise<void> {
    try {
      // Create subscription
      await this.prisma.subscription.create({
        data: {
          userId,
          stripeCustomerId,
          plan,
          status: 'ACTIVE',
        },
      });

      // Create usage quota
      await this.prisma.usageQuota.create({
        data: {
          userId,
          goalsCount: 0,
          habitsCount: 0,
          workspacesCount: 1, // Default workspace
        },
      });

      this.logger.log(
        `Initialized subscription and usage quota for user ${userId} with plan ${plan}`
      );
    } catch (error) {
      this.logger.error(`Failed to initialize subscription: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Map database subscription to SubscriptionInfo
   */
  private mapSubscriptionToInfo(subscription: any): SubscriptionInfo {
    const plan = subscription.plan as SubscriptionPlan;
    const status = subscription.status as SubscriptionStatus;

    return {
      plan,
      status,
      trialEndsAt: subscription.trialEndsAt,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      features: {
        unlimitedGoals: plan !== 'FREE',
        unlimitedHabits: plan !== 'FREE',
        aiFeatures: plan === 'PRO' || plan === 'FAMILY',
        familyWorkspaces: plan === 'FAMILY',
        advancedAnalytics: plan === 'PRO' || plan === 'FAMILY',
        dataExport: plan === 'PRO' || plan === 'FAMILY',
        prioritySupport: plan === 'PRO' || plan === 'FAMILY',
      },
    };
  }
}
