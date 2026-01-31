import { ConfigService } from '@nestjs/config';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import Stripe from 'stripe';

import { PrismaService } from '../../prisma/prisma.service';

import { StripeService } from './stripe.service';

type PrismaSubscription = {
  id: string;
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  plan: string;
  status: string;
  trialEndsAt: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

jest.mock('stripe');

describe('StripeService', () => {
  let service: StripeService;
  let configService: ConfigService;
  let prismaService: PrismaService;
  let mockStripeCustomersCreate: jest.Mock;
  let mockStripeCheckoutSessionsCreate: jest.Mock;
  let mockStripeBillingPortalSessionsCreate: jest.Mock;
  let mockStripeSubscriptionsUpdate: jest.Mock;
  let mockStripeSubscriptionsRetrieve: jest.Mock;
  let mockStripeWebhooksConstructEvent: jest.Mock;

  const mockUserId = 'user-123';
  const mockEmail = 'test@example.com';
  const mockName = 'Test User';
  const mockCustomerId = 'cus_123';
  const mockSubscriptionId = 'sub_123';
  const mockPriceId = 'price_123';

  const createMockSubscription = (
    overrides: Partial<PrismaSubscription> = {}
  ): PrismaSubscription => ({
    id: '1',
    userId: mockUserId,
    stripeCustomerId: mockCustomerId,
    stripeSubscriptionId: null,
    stripePriceId: null,
    plan: 'FREE',
    status: 'ACTIVE',
    trialEndsAt: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    // Create mock functions
    mockStripeCustomersCreate = jest.fn();
    mockStripeCheckoutSessionsCreate = jest.fn();
    mockStripeBillingPortalSessionsCreate = jest.fn();
    mockStripeSubscriptionsUpdate = jest.fn();
    mockStripeSubscriptionsRetrieve = jest.fn();
    mockStripeWebhooksConstructEvent = jest.fn();

    // Mock Stripe constructor
    (Stripe as unknown as jest.Mock).mockImplementation(() => ({
      customers: {
        create: mockStripeCustomersCreate,
      },
      checkout: {
        sessions: {
          create: mockStripeCheckoutSessionsCreate,
        },
      },
      billingPortal: {
        sessions: {
          create: mockStripeBillingPortalSessionsCreate,
        },
      },
      subscriptions: {
        update: mockStripeSubscriptionsUpdate,
        retrieve: mockStripeSubscriptionsRetrieve,
      },
      webhooks: {
        constructEvent: mockStripeWebhooksConstructEvent,
      },
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                STRIPE_SECRET_KEY: 'sk_test_123',
                STRIPE_PRO_PRICE_ID: 'price_pro_123',
                STRIPE_FAMILY_PRICE_ID: 'price_family_123',
                STRIPE_WEBHOOK_SECRET: 'whsec_123',
                TRIAL_PERIOD_DAYS: '14',
              };
              return config[key];
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            subscription: {
              findUnique: jest.fn(),
              update: jest.fn(),
              upsert: jest.fn(),
              create: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
    configService = module.get<ConfigService>(ConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrGetCustomer', () => {
    it('should return existing customer ID if found', async () => {
      const mockSubscription = createMockSubscription();
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockSubscription as any);

      const result = await service.createOrGetCustomer(mockUserId, mockEmail, mockName);

      expect(result).toBe(mockCustomerId);
      expect(prismaService.subscription.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(mockStripeCustomersCreate).not.toHaveBeenCalled();
    });

    it('should create new customer if not found', async () => {
      jest.spyOn(prismaService.subscription, 'findUnique').mockResolvedValue(null);
      mockStripeCustomersCreate.mockResolvedValue({
        id: mockCustomerId,
      });

      const result = await service.createOrGetCustomer(mockUserId, mockEmail, mockName);

      expect(result).toBe(mockCustomerId);
      expect(mockStripeCustomersCreate).toHaveBeenCalledWith({
        email: mockEmail,
        name: mockName,
        metadata: { userId: mockUserId },
      });
    });

    it('should create new customer if subscription exists but no customer ID', async () => {
      const mockSubscription = createMockSubscription({ stripeCustomerId: null });
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockSubscription as any);
      mockStripeCustomersCreate.mockResolvedValue({
        id: mockCustomerId,
      });

      const result = await service.createOrGetCustomer(mockUserId, mockEmail, mockName);

      expect(result).toBe(mockCustomerId);
      expect(mockStripeCustomersCreate).toHaveBeenCalled();
      expect(prismaService.subscription.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: { stripeCustomerId: mockCustomerId },
      });
    });

    it('should replace temporary customer ID with a real Stripe customer', async () => {
      const mockSubscription = createMockSubscription({ stripeCustomerId: `temp_${mockUserId}` });
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockSubscription as any);
      mockStripeCustomersCreate.mockResolvedValue({
        id: mockCustomerId,
      });

      const result = await service.createOrGetCustomer(mockUserId, mockEmail, mockName);

      expect(result).toBe(mockCustomerId);
      expect(mockStripeCustomersCreate).toHaveBeenCalled();
      expect(prismaService.subscription.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: { stripeCustomerId: mockCustomerId },
      });
    });
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session for PRO plan', async () => {
      const mockSession = {
        id: 'cs_123',
        url: 'https://checkout.stripe.com/test',
      };

      jest.spyOn(service, 'createOrGetCustomer').mockResolvedValue(mockCustomerId);
      mockStripeCheckoutSessionsCreate.mockResolvedValue(mockSession);

      const result = await service.createCheckoutSession(
        mockUserId,
        mockEmail,
        mockName,
        'PRO',
        'https://example.com/success',
        'https://example.com/cancel'
      );

      expect(result).toEqual(mockSession);
      expect(mockStripeCheckoutSessionsCreate).toHaveBeenCalledWith({
        customer: mockCustomerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_pro_123',
            quantity: 1,
          },
        ],
        subscription_data: {
          trial_period_days: 14,
          metadata: {
            userId: mockUserId,
            plan: 'PRO',
          },
        },
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        metadata: {
          userId: mockUserId,
          plan: 'PRO',
        },
      });
    });

    it('should create checkout session for FAMILY plan', async () => {
      jest.spyOn(service, 'createOrGetCustomer').mockResolvedValue(mockCustomerId);
      mockStripeCheckoutSessionsCreate.mockResolvedValue({
        id: 'cs_123',
        url: 'https://checkout.stripe.com/test',
      });

      await service.createCheckoutSession(
        mockUserId,
        mockEmail,
        mockName,
        'FAMILY',
        'https://example.com/success',
        'https://example.com/cancel'
      );

      expect(mockStripeCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            {
              price: 'price_family_123',
              quantity: 1,
            },
          ],
        })
      );
    });

    it('should throw error if price ID not configured', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);
      jest.spyOn(service, 'createOrGetCustomer').mockResolvedValue(mockCustomerId);

      await expect(
        service.createCheckoutSession(
          mockUserId,
          mockEmail,
          mockName,
          'PRO',
          'https://example.com/success',
          'https://example.com/cancel'
        )
      ).rejects.toThrow('Price ID not configured for plan: PRO');
    });
  });

  describe('createPortalSession', () => {
    it('should create billing portal session', async () => {
      const mockSession = {
        url: 'https://billing.stripe.com/test',
      };

      const mockSubscription = createMockSubscription({
        stripeSubscriptionId: mockSubscriptionId,
        stripePriceId: mockPriceId,
        plan: 'PRO',
      });

      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockSubscription as any);
      mockStripeBillingPortalSessionsCreate.mockResolvedValue(mockSession);

      const result = await service.createPortalSession(mockUserId, 'https://example.com/return');

      expect(result).toEqual(mockSession);
      expect(mockStripeBillingPortalSessionsCreate).toHaveBeenCalledWith({
        customer: mockCustomerId,
        return_url: 'https://example.com/return',
      });
    });

    it('should throw error if no customer found', async () => {
      jest.spyOn(prismaService.subscription, 'findUnique').mockResolvedValue(null);

      await expect(
        service.createPortalSession(mockUserId, 'https://example.com/return')
      ).rejects.toThrow('No Stripe customer found for user');
    });

    it('should throw error if no customer ID in subscription', async () => {
      const mockSubscription = createMockSubscription({ stripeCustomerId: null });
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockSubscription as any);

      await expect(
        service.createPortalSession(mockUserId, 'https://example.com/return')
      ).rejects.toThrow('No Stripe customer found for user');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription at period end', async () => {
      const mockSubscription = createMockSubscription({
        stripeSubscriptionId: mockSubscriptionId,
        stripePriceId: mockPriceId,
        plan: 'PRO',
      });

      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockSubscription as any);
      mockStripeSubscriptionsUpdate.mockResolvedValue({});
      jest.spyOn(prismaService.subscription, 'update').mockResolvedValue(mockSubscription as any);

      await service.cancelSubscription(mockUserId, true);

      expect(mockStripeSubscriptionsUpdate).toHaveBeenCalledWith(mockSubscriptionId, {
        cancel_at_period_end: true,
      });
      expect(prismaService.subscription.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: {
          cancelAtPeriodEnd: true,
          canceledAt: expect.any(Date),
        },
      });
    });

    it('should cancel subscription immediately', async () => {
      const mockSubscription = createMockSubscription({
        stripeSubscriptionId: mockSubscriptionId,
        stripePriceId: mockPriceId,
        plan: 'PRO',
      });

      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockSubscription as any);
      mockStripeSubscriptionsUpdate.mockResolvedValue({});
      jest.spyOn(prismaService.subscription, 'update').mockResolvedValue(mockSubscription as any);

      await service.cancelSubscription(mockUserId, false);

      expect(mockStripeSubscriptionsUpdate).toHaveBeenCalledWith(mockSubscriptionId, {
        cancel_at_period_end: false,
      });
      expect(prismaService.subscription.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: {
          cancelAtPeriodEnd: false,
          canceledAt: null,
        },
      });
    });

    it('should throw error if no active subscription', async () => {
      const mockSubscription = createMockSubscription();
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockSubscription as any);

      await expect(service.cancelSubscription(mockUserId, true)).rejects.toThrow(
        'No active subscription found'
      );
    });
  });

  describe('handleSubscriptionUpdate', () => {
    it('should create new subscription for ACTIVE status', async () => {
      const mockStripeSubscription = {
        id: mockSubscriptionId,
        customer: mockCustomerId,
        status: 'active',
        metadata: {
          userId: mockUserId,
          plan: 'PRO',
        },
        items: {
          data: [{ price: { id: mockPriceId } }],
        },
        trial_end: null,
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
        cancel_at_period_end: false,
      } as unknown as Stripe.Subscription;

      const mockSubscription = createMockSubscription();
      jest.spyOn(prismaService.subscription, 'upsert').mockResolvedValue(mockSubscription as any);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({ id: mockUserId } as any);

      await service.handleSubscriptionUpdate(mockStripeSubscription);

      expect(prismaService.subscription.upsert).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        create: expect.objectContaining({
          userId: mockUserId,
          stripeCustomerId: mockCustomerId,
          stripeSubscriptionId: mockSubscriptionId,
          stripePriceId: mockPriceId,
          plan: 'PRO',
          status: 'ACTIVE',
          cancelAtPeriodEnd: false,
        }),
        update: expect.objectContaining({
          stripeSubscriptionId: mockSubscriptionId,
          stripePriceId: mockPriceId,
          plan: 'PRO',
          status: 'ACTIVE',
          cancelAtPeriodEnd: false,
        }),
      });
    });

    it('should handle TRIALING status', async () => {
      const trialEnd = Math.floor(Date.now() / 1000) + 1209600;
      const mockStripeSubscription = {
        id: mockSubscriptionId,
        customer: mockCustomerId,
        status: 'trialing',
        metadata: {
          userId: mockUserId,
          plan: 'PRO',
        },
        items: {
          data: [{ price: { id: mockPriceId } }],
        },
        trial_end: trialEnd,
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: trialEnd,
        cancel_at_period_end: false,
      } as unknown as Stripe.Subscription;

      const mockSubscription = createMockSubscription();
      jest.spyOn(prismaService.subscription, 'upsert').mockResolvedValue(mockSubscription as any);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({ id: mockUserId } as any);

      await service.handleSubscriptionUpdate(mockStripeSubscription);

      expect(prismaService.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            status: 'TRIALING',
            trialEndsAt: new Date(trialEnd * 1000),
          }),
          update: expect.objectContaining({
            status: 'TRIALING',
            trialEndsAt: new Date(trialEnd * 1000),
          }),
        })
      );
    });

    it('should default view mode to power for paid plans without view mode set', async () => {
      const mockStripeSubscription = {
        id: mockSubscriptionId,
        customer: mockCustomerId,
        status: 'active',
        metadata: {
          userId: mockUserId,
          plan: 'PRO',
        },
        items: {
          data: [{ price: { id: mockPriceId } }],
        },
        trial_end: null,
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
        cancel_at_period_end: false,
      } as unknown as Stripe.Subscription;

      const mockSubscription = createMockSubscription();
      (prismaService.subscription.upsert as jest.Mock).mockResolvedValue(mockSubscription as any);
      // First call checks user exists (getExistingUserId), second call gets user settings
      (prismaService.user.findUnique as jest.Mock).mockImplementation(async (args: any) => {
        if (args?.select?.id) {
          return { id: mockUserId } as any;
        }
        return {
          settings: { theme: 'light', compactMode: false, showWelcomeOnLogin: true },
        } as any;
      });
      (prismaService.user.update as jest.Mock).mockResolvedValue({} as any);

      await service.handleSubscriptionUpdate(mockStripeSubscription);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          settings: {
            theme: 'light',
            compactMode: false,
            showWelcomeOnLogin: true,
            viewMode: 'power',
          },
        },
      });
    });

    it('should handle subscription with no userId in metadata', async () => {
      const mockStripeSubscription = {
        id: mockSubscriptionId,
        customer: mockCustomerId,
        status: 'active',
        metadata: {},
        items: {
          data: [{ price: { id: mockPriceId } }],
        },
        cancel_at_period_end: false,
      } as unknown as Stripe.Subscription;

      await service.handleSubscriptionUpdate(mockStripeSubscription);

      expect(prismaService.subscription.upsert).not.toHaveBeenCalled();
    });

    it('should fallback to existing subscription by customer ID when metadata is missing', async () => {
      const mockStripeSubscription = {
        id: mockSubscriptionId,
        customer: mockCustomerId,
        status: 'active',
        metadata: {},
        items: {
          data: [{ price: { id: mockPriceId } }],
        },
        trial_end: null,
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
        cancel_at_period_end: false,
      } as unknown as Stripe.Subscription;

      (prismaService.subscription.findUnique as jest.Mock).mockImplementation(async (args: any) => {
        if (args?.where?.stripeCustomerId === mockCustomerId) {
          return { userId: mockUserId } as any;
        }
        return null;
      });
      // Mock user existence check
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({ id: mockUserId } as any);

      const mockSubscription = createMockSubscription();
      (prismaService.subscription.upsert as jest.Mock).mockResolvedValue(mockSubscription as any);

      await service.handleSubscriptionUpdate(mockStripeSubscription);

      expect(prismaService.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUserId },
        })
      );
    });

    it('should skip update when metadata userId is missing and no fallback exists', async () => {
      const mockStripeSubscription = {
        id: mockSubscriptionId,
        customer: mockCustomerId,
        status: 'active',
        metadata: {
          userId: 'missing-user',
          plan: 'PRO',
        },
        items: {
          data: [{ price: { id: mockPriceId } }],
        },
        cancel_at_period_end: false,
      } as unknown as Stripe.Subscription;

      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null as any);
      jest.spyOn(prismaService.subscription, 'findUnique').mockResolvedValue(null as any);

      await service.handleSubscriptionUpdate(mockStripeSubscription);

      expect(prismaService.subscription.upsert).not.toHaveBeenCalled();
    });

    it('should skip update when fallback subscription user does not exist', async () => {
      const mockStripeSubscription = {
        id: mockSubscriptionId,
        customer: mockCustomerId,
        status: 'active',
        metadata: {},
        items: {
          data: [{ price: { id: mockPriceId } }],
        },
        cancel_at_period_end: false,
      } as unknown as Stripe.Subscription;

      (prismaService.subscription.findUnique as jest.Mock).mockImplementation(async (args: any) => {
        if (args?.where?.stripeCustomerId === mockCustomerId) {
          return { userId: 'missing-user' } as any;
        }
        return null;
      });
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null as any);

      await service.handleSubscriptionUpdate(mockStripeSubscription);

      expect(prismaService.subscription.upsert).not.toHaveBeenCalled();
    });
  });

  describe('handleSubscriptionDeleted', () => {
    it('should downgrade to FREE plan', async () => {
      const mockStripeSubscription = {
        id: mockSubscriptionId,
        metadata: {
          userId: mockUserId,
        },
      } as unknown as Stripe.Subscription;

      const mockSubscription = createMockSubscription();
      jest.spyOn(prismaService.subscription, 'update').mockResolvedValue(mockSubscription as any);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({ id: mockUserId } as any);

      await service.handleSubscriptionDeleted(mockStripeSubscription);

      expect(prismaService.subscription.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: {
          plan: 'FREE',
          status: 'CANCELED',
          stripeSubscriptionId: null,
          stripePriceId: null,
          canceledAt: expect.any(Date),
        },
      });
    });

    it('should handle subscription with no userId in metadata', async () => {
      const mockStripeSubscription = {
        id: mockSubscriptionId,
        metadata: {},
      } as unknown as Stripe.Subscription;

      await service.handleSubscriptionDeleted(mockStripeSubscription);

      expect(prismaService.subscription.update).not.toHaveBeenCalled();
    });

    it('should fallback to existing subscription by subscription ID', async () => {
      const mockStripeSubscription = {
        id: mockSubscriptionId,
        metadata: {},
      } as unknown as Stripe.Subscription;

      (prismaService.subscription.findUnique as jest.Mock).mockImplementation(async (args: any) => {
        if (args?.where?.stripeSubscriptionId === mockSubscriptionId) {
          return { userId: mockUserId } as any;
        }
        return null;
      });

      const mockSubscription = createMockSubscription();
      jest.spyOn(prismaService.subscription, 'update').mockResolvedValue(mockSubscription as any);
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({ id: mockUserId } as any);

      await service.handleSubscriptionDeleted(mockStripeSubscription);

      expect(prismaService.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUserId },
        })
      );
    });

    it('should skip delete when fallback user does not exist', async () => {
      const mockStripeSubscription = {
        id: mockSubscriptionId,
        metadata: {},
      } as unknown as Stripe.Subscription;

      (prismaService.subscription.findUnique as jest.Mock).mockImplementation(async (args: any) => {
        if (args?.where?.stripeSubscriptionId === mockSubscriptionId) {
          return { userId: 'missing-user' } as any;
        }
        return null;
      });
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null as any);

      await service.handleSubscriptionDeleted(mockStripeSubscription);

      expect(prismaService.subscription.update).not.toHaveBeenCalled();
    });
  });

  describe('constructWebhookEvent', () => {
    it('should construct webhook event successfully', () => {
      const mockPayload = Buffer.from('test');
      const mockSignature = 'sig_123';
      const mockEvent = { type: 'test.event', data: {} } as unknown as Stripe.Event;

      mockStripeWebhooksConstructEvent.mockReturnValue(mockEvent);

      const result = service.constructWebhookEvent(mockPayload, mockSignature);

      expect(result).toEqual(mockEvent);
      expect(mockStripeWebhooksConstructEvent).toHaveBeenCalledWith(
        mockPayload,
        mockSignature,
        'whsec_123'
      );
    });

    it('should throw error if webhook secret not configured', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      expect(() => {
        service.constructWebhookEvent(Buffer.from('test'), 'sig_123');
      }).toThrow('STRIPE_WEBHOOK_SECRET is not configured');
    });

    it('should throw error on signature verification failure', () => {
      mockStripeWebhooksConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      expect(() => {
        service.constructWebhookEvent(Buffer.from('test'), 'invalid_sig');
      }).toThrow('Invalid signature');
    });
  });

  describe('handleCheckoutCompleted', () => {
    it('should immediately update subscription when checkout completes', async () => {
      const mockSession = {
        id: 'cs_123',
        subscription: mockSubscriptionId,
        metadata: {
          userId: mockUserId,
          plan: 'PRO',
        },
      } as unknown as Stripe.Checkout.Session;

      const mockStripeSubscription = {
        id: mockSubscriptionId,
        customer: mockCustomerId,
        status: 'active',
        metadata: {
          userId: mockUserId,
          plan: 'PRO',
        },
        items: {
          data: [{ price: { id: mockPriceId } }],
        },
        trial_end: null,
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
        cancel_at_period_end: false,
      } as unknown as Stripe.Subscription;

      mockStripeSubscriptionsRetrieve.mockResolvedValue(mockStripeSubscription);
      const mockSubscription = createMockSubscription();
      jest.spyOn(prismaService.subscription, 'upsert').mockResolvedValue(mockSubscription as any);

      await service.handleCheckoutCompleted(mockSession);

      // Verify subscription was retrieved and updated
      expect(mockStripeSubscriptionsRetrieve).toHaveBeenCalledWith(mockSubscriptionId);
    });

    it('should handle checkout session without userId', async () => {
      const mockSession = {
        id: 'cs_123',
        subscription: mockSubscriptionId,
        metadata: {},
      } as unknown as Stripe.Checkout.Session;

      await service.handleCheckoutCompleted(mockSession);

      // Should not throw, just log warning
      expect(prismaService.subscription.upsert).not.toHaveBeenCalled();
    });
  });

  describe('syncSubscriptionFromStripe', () => {
    it('should sync subscription from Stripe', async () => {
      const mockSubscription = createMockSubscription({
        stripeSubscriptionId: mockSubscriptionId,
      });

      const mockStripeSubscription = {
        id: mockSubscriptionId,
        customer: mockCustomerId,
        status: 'active',
        metadata: {
          userId: mockUserId,
          plan: 'PRO',
        },
        items: {
          data: [{ price: { id: mockPriceId } }],
        },
        trial_end: null,
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
        cancel_at_period_end: false,
      } as unknown as Stripe.Subscription;

      (prismaService.subscription.findUnique as jest.Mock).mockResolvedValue(
        mockSubscription as any
      );
      // Mock user existence check
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({ id: mockUserId } as any);
      mockStripeSubscriptionsRetrieve.mockResolvedValue(mockStripeSubscription);
      (prismaService.subscription.upsert as jest.Mock).mockResolvedValue(mockSubscription as any);

      await service.syncSubscriptionFromStripe(mockUserId);

      expect(mockStripeSubscriptionsRetrieve).toHaveBeenCalledWith(mockSubscriptionId);
      expect(prismaService.subscription.upsert).toHaveBeenCalled();
    });

    it('should handle user with no Stripe subscription', async () => {
      const mockSubscription = createMockSubscription({
        stripeSubscriptionId: null,
      });

      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockSubscription as any);

      await service.syncSubscriptionFromStripe(mockUserId);

      // Should not throw, just log warning
      expect(mockStripeSubscriptionsRetrieve).not.toHaveBeenCalled();
    });
  });
});
