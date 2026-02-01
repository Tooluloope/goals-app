import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  type RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

import { StripeService } from './stripe.service';

import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@Controller('stripe')
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(
    private stripeService: StripeService,
    private configService: ConfigService
  ) {}

  /**
   * Create a Checkout Session for subscription
   * POST /api/stripe/create-checkout-session
   */
  @Post('create-checkout-session')
  @UseGuards(JwtAuthGuard)
  async createCheckoutSession(
    @Req() req: Request & { user: { id: string; email?: string | null; name?: string | null } },
    @Body()
    body: { plan: 'PRO' | 'FAMILY'; successUrl?: string; cancelUrl?: string }
  ) {
    try {
      const { id, email, name } = req.user;
      const { plan, successUrl: providedSuccessUrl, cancelUrl: providedCancelUrl } = body;

      if (!plan || !['PRO', 'FAMILY'].includes(plan)) {
        throw new BadRequestException('Invalid plan. Must be PRO or FAMILY');
      }

      if (!id || !email || !name) {
        throw new BadRequestException('Missing user details for checkout session');
      }

      const appUrl = this.configService.get<string>('NEXT_PUBLIC_APP_URL');
      const fallbackSuccessUrl = `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
      const fallbackCancelUrl = `${appUrl}/billing/cancel`;
      const successUrl = providedSuccessUrl || fallbackSuccessUrl;
      const cancelUrl = providedCancelUrl || fallbackCancelUrl;

      const session = await this.stripeService.createCheckoutSession(
        id,
        email,
        name,
        plan,
        successUrl,
        cancelUrl
      );

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error) {
      this.logger.error(`Failed to create checkout session: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a Billing Portal Session
   * POST /api/stripe/create-portal-session
   */
  @Post('create-portal-session')
  @UseGuards(JwtAuthGuard)
  async createPortalSession(@Req() req: Request & { user: { id: string } }) {
    try {
      const { id } = req.user;
      const appUrl = this.configService.get<string>('NEXT_PUBLIC_APP_URL');
      const returnUrl = `${appUrl}/settings#subscription`;

      const session = await this.stripeService.createPortalSession(id, returnUrl);

      return {
        url: session.url,
      };
    } catch (error) {
      this.logger.error(`Failed to create portal session: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get current subscription status
   * GET /api/stripe/subscription
   */
  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  async getSubscription(@Req() _req: Request & { user: { id: string } }) {
    // This will be handled by the subscriptions module
    // Just a placeholder for now
    return { message: 'Use /api/subscriptions/status instead' };
  }

  /**
   * Cancel subscription
   * POST /api/stripe/cancel-subscription
   */
  @Post('cancel-subscription')
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(
    @Req() req: Request & { user: { id: string } },
    @Body() body: { cancelAtPeriodEnd?: boolean }
  ) {
    try {
      const { id } = req.user;
      const { cancelAtPeriodEnd = true } = body;

      await this.stripeService.cancelSubscription(id, cancelAtPeriodEnd);

      return {
        success: true,
        message: cancelAtPeriodEnd
          ? 'Subscription will be canceled at the end of the billing period'
          : 'Subscription canceled immediately',
      };
    } catch (error) {
      this.logger.error(`Failed to cancel subscription: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Sync subscription status from Stripe
   * POST /api/stripe/sync-subscription
   * Useful if webhooks are delayed or missed
   */
  @Post('sync-subscription')
  @UseGuards(JwtAuthGuard)
  async syncSubscription(@Req() req: Request & { user: { id: string } }) {
    try {
      const { id } = req.user;

      await this.stripeService.syncSubscriptionFromStripe(id);

      return {
        success: true,
        message: 'Subscription synced successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to sync subscription: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Stripe Webhook Handler
   * POST /api/stripe/webhook
   *
   * IMPORTANT: This endpoint must be excluded from body parsing middleware
   * to receive the raw body for signature verification
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string
  ) {
    if (!signature) {
      this.logger.error('Missing stripe-signature header');
      throw new BadRequestException('Missing stripe-signature header');
    }

    try {
      const rawBody = req.rawBody;
      if (!rawBody) {
        throw new BadRequestException('Missing raw body');
      }

      const event = this.stripeService.constructWebhookEvent(rawBody, signature);

      this.logger.log(`Received webhook event: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed': {
          const checkoutSession = event.data.object;
          this.logger.log(`Checkout completed for session: ${checkoutSession.id}`);
          // Immediately update subscription for faster user experience
          await this.stripeService.handleCheckoutCompleted(checkoutSession);
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.stripeService.handleSubscriptionUpdate(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.stripeService.handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object;
          this.logger.log(`Payment succeeded for invoice: ${invoice.id}`);
          break;
        }

        case 'invoice.payment_failed': {
          const failedInvoice = event.data.object;
          this.logger.warn(`Payment failed for invoice: ${failedInvoice.id}`);
          // TODO: Send email notification to user
          break;
        }

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Webhook error: ${error.message}`, error.stack);
      throw new BadRequestException(`Webhook error: ${error.message}`);
    }
  }
}
