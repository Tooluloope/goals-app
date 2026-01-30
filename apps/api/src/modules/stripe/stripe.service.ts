import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2026-01-28.clover',
    });
  }

  /**
   * Create or retrieve a Stripe customer for a user
   */
  async createOrGetCustomer(userId: string, email: string, name: string): Promise<string> {
    try {
      // Check if customer already exists in our database
      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
      });

      if (subscription?.stripeCustomerId && !subscription.stripeCustomerId.startsWith('temp_')) {
        return subscription.stripeCustomerId;
      }

      // Create new Stripe customer
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
        },
      });

      if (subscription) {
        await this.prisma.subscription.update({
          where: { userId },
          data: { stripeCustomerId: customer.id },
        });
      }

      this.logger.log(`Created Stripe customer ${customer.id} for user ${userId}`);

      return customer.id;
    } catch (error) {
      this.logger.error(`Failed to create Stripe customer: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a Checkout Session for subscription
   */
  async createCheckoutSession(
    userId: string,
    email: string,
    name: string,
    plan: 'PRO' | 'FAMILY',
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    try {
      const customerId = await this.createOrGetCustomer(userId, email, name);

      // Get price ID based on plan
      const priceId =
        plan === 'PRO'
          ? this.configService.get<string>('STRIPE_PRO_PRICE_ID')
          : this.configService.get<string>('STRIPE_FAMILY_PRICE_ID');

      if (!priceId) {
        throw new Error(`Price ID not configured for plan: ${plan}`);
      }

      const trialPeriodDays = parseInt(
        this.configService.get<string>('TRIAL_PERIOD_DAYS') || '14',
        10
      );

      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          trial_period_days: trialPeriodDays,
          metadata: {
            userId,
            plan,
          },
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          plan,
        },
      });

      this.logger.log(`Created checkout session ${session.id} for user ${userId}`);

      return session;
    } catch (error) {
      this.logger.error(`Failed to create checkout session: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a Billing Portal Session
   */
  async createPortalSession(
    userId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription?.stripeCustomerId) {
        throw new Error('No Stripe customer found for user');
      }

      const session = await this.stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: returnUrl,
      });

      this.logger.log(`Created portal session for user ${userId}`);

      return session;
    } catch (error) {
      this.logger.error(`Failed to create portal session: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true): Promise<void> {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription?.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      });

      await this.prisma.subscription.update({
        where: { userId },
        data: {
          cancelAtPeriodEnd,
          canceledAt: cancelAtPeriodEnd ? new Date() : null,
        },
      });

      this.logger.log(`Updated subscription cancellation for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to cancel subscription: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle subscription created/updated webhook
   */
  async handleSubscriptionUpdate(stripeSubscription: Stripe.Subscription): Promise<void> {
    try {
      const userId = stripeSubscription.metadata.userId;
      const plan = stripeSubscription.metadata.plan as 'FREE' | 'PRO' | 'FAMILY';
      const effectivePlan: 'FREE' | 'PRO' | 'FAMILY' = plan || 'PRO';

      if (!userId) {
        this.logger.warn(`Subscription ${stripeSubscription.id} has no userId in metadata`);
        return;
      }

      // Determine subscription status
      let status:
        | 'ACTIVE'
        | 'TRIALING'
        | 'PAST_DUE'
        | 'CANCELED'
        | 'INCOMPLETE'
        | 'INCOMPLETE_EXPIRED'
        | 'UNPAID';
      switch (stripeSubscription.status) {
        case 'active':
          status = 'ACTIVE';
          break;
        case 'trialing':
          status = 'TRIALING';
          break;
        case 'past_due':
          status = 'PAST_DUE';
          break;
        case 'canceled':
          status = 'CANCELED';
          break;
        case 'incomplete':
          status = 'INCOMPLETE';
          break;
        case 'incomplete_expired':
          status = 'INCOMPLETE_EXPIRED';
          break;
        case 'unpaid':
          status = 'UNPAID';
          break;
        default:
          status = 'ACTIVE';
      }

      const trialEnd = stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null;

      const subData = stripeSubscription as Stripe.Subscription & {
        current_period_start?: number;
        current_period_end?: number;
      };
      const currentPeriodStart = subData.current_period_start
        ? new Date(subData.current_period_start * 1000)
        : null;
      const currentPeriodEnd = subData.current_period_end
        ? new Date(subData.current_period_end * 1000)
        : null;

      await this.prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeCustomerId: stripeSubscription.customer as string,
          stripeSubscriptionId: stripeSubscription.id,
          stripePriceId: stripeSubscription.items.data[0]?.price.id,
          plan: effectivePlan,
          status,
          trialEndsAt: trialEnd,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        },
        update: {
          stripeSubscriptionId: stripeSubscription.id,
          stripePriceId: stripeSubscription.items.data[0]?.price.id,
          plan: effectivePlan,
          status,
          trialEndsAt: trialEnd,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        },
      });

      try {
        await this.ensureDefaultViewMode(userId, effectivePlan);
      } catch (error) {
        this.logger.warn(
          `Failed to set default view mode for user ${userId}: ${error.message}`,
          error.stack
        );
      }

      this.logger.log(`Updated subscription for user ${userId}: ${status}`);
    } catch (error) {
      this.logger.error(`Failed to handle subscription update: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async ensureDefaultViewMode(
    userId: string,
    plan: 'FREE' | 'PRO' | 'FAMILY'
  ): Promise<void> {
    if (plan === 'FREE') return;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    });

    if (!user?.settings || typeof user.settings !== 'object') return;

    const settings = user.settings as Record<string, unknown>;
    const viewMode = settings.viewMode;

    if (viewMode === 'focus' || viewMode === 'power') return;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        settings: {
          ...settings,
          viewMode: 'power',
        },
      },
    });
  }

  /**
   * Handle checkout session completed webhook
   * This provides immediate feedback when payment succeeds
   */
  async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    try {
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan as 'PRO' | 'FAMILY' | undefined;

      if (!userId || !plan) {
        this.logger.warn(`Checkout session ${session.id} missing userId or plan in metadata`);
        return;
      }

      // If the checkout created a subscription, fetch it and update immediately
      if (session.subscription) {
        const subscriptionId =
          typeof session.subscription === 'string' ? session.subscription : session.subscription.id;

        const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
        await this.handleSubscriptionUpdate(subscription);
        this.logger.log(`Immediately updated subscription from checkout for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle checkout completion: ${error.message}`, error.stack);
      // Don't throw - subscription.created webhook will handle it as fallback
    }
  }

  /**
   * Sync subscription from Stripe
   * Useful when webhooks are delayed or missed
   */
  async syncSubscriptionFromStripe(userId: string): Promise<void> {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription?.stripeSubscriptionId) {
        this.logger.warn(`No Stripe subscription found for user ${userId}`);
        return;
      }

      // Fetch latest subscription data from Stripe
      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );

      // Update local database with latest data
      await this.handleSubscriptionUpdate(stripeSubscription);

      this.logger.log(`Synced subscription from Stripe for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to sync subscription from Stripe: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle subscription deleted webhook
   */
  async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      const userId = subscription.metadata.userId;

      if (!userId) {
        this.logger.warn(`Subscription ${subscription.id} has no userId in metadata`);
        return;
      }

      // Downgrade to FREE plan
      await this.prisma.subscription.update({
        where: { userId },
        data: {
          plan: 'FREE',
          status: 'CANCELED',
          stripeSubscriptionId: null,
          stripePriceId: null,
          canceledAt: new Date(),
        },
      });

      this.logger.log(`Subscription deleted for user ${userId}, downgraded to FREE`);
    } catch (error) {
      this.logger.error(`Failed to handle subscription deletion: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Construct webhook event from raw body
   */
  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      throw error;
    }
  }
}
