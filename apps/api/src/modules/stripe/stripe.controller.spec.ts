import { BadRequestException, type RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Request } from 'express';

import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

describe('StripeController', () => {
  let controller: StripeController;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockStripeService = {
    createCheckoutSession: jest.fn(),
    createPortalSession: jest.fn(),
    cancelSubscription: jest.fn(),
    constructWebhookEvent: jest.fn(),
    handleSubscriptionUpdate: jest.fn(),
    handleSubscriptionDeleted: jest.fn(),
    handleCheckoutCompleted: jest.fn(),
    syncSubscriptionFromStripe: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        NEXT_PUBLIC_APP_URL: 'https://example.com',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeController],
      providers: [
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<StripeController>(StripeController);
    //   stripeService = module.get<StripeService>(StripeService);
    //   configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCheckoutSession', () => {
    const mockRequest = {
      user: mockUser,
    } as Request & { user: typeof mockUser };

    it('should create checkout session for PRO plan', async () => {
      const mockSession = {
        id: 'cs_123',
        url: 'https://checkout.stripe.com/test',
      };

      mockStripeService.createCheckoutSession.mockResolvedValue(mockSession);

      const result = await controller.createCheckoutSession(mockRequest, {
        plan: 'PRO',
      });

      expect(result).toEqual({
        sessionId: 'cs_123',
        url: 'https://checkout.stripe.com/test',
      });
      expect(mockStripeService.createCheckoutSession).toHaveBeenCalledWith(
        'user-123',
        'test@example.com',
        'Test User',
        'PRO',
        'https://example.com/billing/success?session_id={CHECKOUT_SESSION_ID}',
        'https://example.com/billing/cancel'
      );
    });

    it('should create checkout session for FAMILY plan', async () => {
      const mockSession = {
        id: 'cs_123',
        url: 'https://checkout.stripe.com/test',
      };

      mockStripeService.createCheckoutSession.mockResolvedValue(mockSession);

      await controller.createCheckoutSession(mockRequest, {
        plan: 'FAMILY',
      });

      expect(mockStripeService.createCheckoutSession).toHaveBeenCalledWith(
        'user-123',
        'test@example.com',
        'Test User',
        'FAMILY',
        expect.any(String),
        expect.any(String)
      );
    });

    it('should use custom success and cancel URLs when provided', async () => {
      const mockSession = {
        id: 'cs_123',
        url: 'https://checkout.stripe.com/test',
      };

      mockStripeService.createCheckoutSession.mockResolvedValue(mockSession);

      await controller.createCheckoutSession(mockRequest, {
        plan: 'PRO',
        successUrl: 'https://custom.com/success',
        cancelUrl: 'https://custom.com/cancel',
      });

      expect(mockStripeService.createCheckoutSession).toHaveBeenCalledWith(
        'user-123',
        'test@example.com',
        'Test User',
        'PRO',
        'https://custom.com/success',
        'https://custom.com/cancel'
      );
    });

    it('should throw BadRequestException if plan is invalid', async () => {
      await expect(
        controller.createCheckoutSession(mockRequest, {
          plan: 'INVALID' as any,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if plan is missing', async () => {
      await expect(
        controller.createCheckoutSession(mockRequest, {
          plan: undefined as any,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user details are missing', async () => {
      const incompleteRequest = {
        user: {
          id: 'user-123',
          email: null,
          name: null,
        },
      } as any;

      await expect(
        controller.createCheckoutSession(incompleteRequest, {
          plan: 'PRO',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle service errors', async () => {
      mockStripeService.createCheckoutSession.mockRejectedValue(new Error('Stripe API error'));

      await expect(
        controller.createCheckoutSession(mockRequest, {
          plan: 'PRO',
        })
      ).rejects.toThrow('Stripe API error');
    });
  });

  describe('createPortalSession', () => {
    const mockRequest = {
      user: { id: 'user-123' },
    } as Request & { user: { id: string } };

    it('should create billing portal session', async () => {
      const mockSession = {
        url: 'https://billing.stripe.com/test',
      };

      mockStripeService.createPortalSession.mockResolvedValue(mockSession);

      const result = await controller.createPortalSession(mockRequest);

      expect(result).toEqual({
        url: 'https://billing.stripe.com/test',
      });
      expect(mockStripeService.createPortalSession).toHaveBeenCalledWith(
        'user-123',
        'https://example.com/settings#billing'
      );
    });

    it('should handle service errors', async () => {
      mockStripeService.createPortalSession.mockRejectedValue(new Error('No customer found'));

      await expect(controller.createPortalSession(mockRequest)).rejects.toThrow(
        'No customer found'
      );
    });
  });

  describe('getSubscription', () => {
    const mockRequest = {
      user: { id: 'user-123' },
    } as Request & { user: { id: string } };

    it('should return placeholder message', async () => {
      const result = await controller.getSubscription(mockRequest);

      expect(result).toEqual({
        message: 'Use /api/subscriptions/status instead',
      });
    });
  });

  describe('cancelSubscription', () => {
    const mockRequest = {
      user: { id: 'user-123' },
    } as Request & { user: { id: string } };

    it('should cancel subscription at period end by default', async () => {
      mockStripeService.cancelSubscription.mockResolvedValue(undefined);

      const result = await controller.cancelSubscription(mockRequest, {});

      expect(result).toEqual({
        success: true,
        message: 'Subscription will be canceled at the end of the billing period',
      });
      expect(mockStripeService.cancelSubscription).toHaveBeenCalledWith('user-123', true);
    });

    it('should cancel subscription immediately when specified', async () => {
      mockStripeService.cancelSubscription.mockResolvedValue(undefined);

      const result = await controller.cancelSubscription(mockRequest, {
        cancelAtPeriodEnd: false,
      });

      expect(result).toEqual({
        success: true,
        message: 'Subscription canceled immediately',
      });
      expect(mockStripeService.cancelSubscription).toHaveBeenCalledWith('user-123', false);
    });

    it('should handle service errors', async () => {
      mockStripeService.cancelSubscription.mockRejectedValue(new Error('No active subscription'));

      await expect(controller.cancelSubscription(mockRequest, {})).rejects.toThrow(
        'No active subscription'
      );
    });
  });

  describe('handleWebhook', () => {
    const mockSignature = 'whsec_test_signature';

    it('should handle checkout.session.completed event', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
          },
        },
      };

      const mockRequest = {
        rawBody: Buffer.from('webhook payload'),
      } as RawBodyRequest<Request>;

      mockStripeService.constructWebhookEvent.mockReturnValue(mockEvent);

      const result = await controller.handleWebhook(mockRequest, mockSignature);

      expect(result).toEqual({ received: true });
      expect(mockStripeService.constructWebhookEvent).toHaveBeenCalledWith(
        mockRequest.rawBody,
        mockSignature
      );
    });

    it('should handle customer.subscription.created event', async () => {
      const mockSubscription = {
        id: 'sub_123',
        customer: 'cus_123',
      };

      const mockEvent = {
        type: 'customer.subscription.created',
        data: {
          object: mockSubscription,
        },
      };

      const mockRequest = {
        rawBody: Buffer.from('webhook payload'),
      } as RawBodyRequest<Request>;

      mockStripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      mockStripeService.handleSubscriptionUpdate.mockResolvedValue(undefined);

      const result = await controller.handleWebhook(mockRequest, mockSignature);

      expect(result).toEqual({ received: true });
      expect(mockStripeService.handleSubscriptionUpdate).toHaveBeenCalledWith(mockSubscription);
    });

    it('should handle customer.subscription.updated event', async () => {
      const mockSubscription = {
        id: 'sub_123',
        customer: 'cus_123',
      };

      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: mockSubscription,
        },
      };

      const mockRequest = {
        rawBody: Buffer.from('webhook payload'),
      } as RawBodyRequest<Request>;

      mockStripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      mockStripeService.handleSubscriptionUpdate.mockResolvedValue(undefined);

      const result = await controller.handleWebhook(mockRequest, mockSignature);

      expect(result).toEqual({ received: true });
      expect(mockStripeService.handleSubscriptionUpdate).toHaveBeenCalledWith(mockSubscription);
    });

    it('should handle customer.subscription.deleted event', async () => {
      const mockSubscription = {
        id: 'sub_123',
        customer: 'cus_123',
      };

      const mockEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: mockSubscription,
        },
      };

      const mockRequest = {
        rawBody: Buffer.from('webhook payload'),
      } as RawBodyRequest<Request>;

      mockStripeService.constructWebhookEvent.mockReturnValue(mockEvent);
      mockStripeService.handleSubscriptionDeleted.mockResolvedValue(undefined);

      const result = await controller.handleWebhook(mockRequest, mockSignature);

      expect(result).toEqual({ received: true });
      expect(mockStripeService.handleSubscriptionDeleted).toHaveBeenCalledWith(mockSubscription);
    });

    it('should handle invoice.payment_succeeded event', async () => {
      const mockEvent = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_123',
          },
        },
      };

      const mockRequest = {
        rawBody: Buffer.from('webhook payload'),
      } as RawBodyRequest<Request>;

      mockStripeService.constructWebhookEvent.mockReturnValue(mockEvent);

      const result = await controller.handleWebhook(mockRequest, mockSignature);

      expect(result).toEqual({ received: true });
    });

    it('should handle invoice.payment_failed event', async () => {
      const mockEvent = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_123',
          },
        },
      };

      const mockRequest = {
        rawBody: Buffer.from('webhook payload'),
      } as RawBodyRequest<Request>;

      mockStripeService.constructWebhookEvent.mockReturnValue(mockEvent);

      const result = await controller.handleWebhook(mockRequest, mockSignature);

      expect(result).toEqual({ received: true });
    });

    it('should handle unhandled event types', async () => {
      const mockEvent = {
        type: 'some.unhandled.event',
        data: {
          object: {},
        },
      };

      const mockRequest = {
        rawBody: Buffer.from('webhook payload'),
      } as RawBodyRequest<Request>;

      mockStripeService.constructWebhookEvent.mockReturnValue(mockEvent);

      const result = await controller.handleWebhook(mockRequest, mockSignature);

      expect(result).toEqual({ received: true });
    });

    it('should throw BadRequestException if signature is missing', async () => {
      const mockRequest = {
        rawBody: Buffer.from('webhook payload'),
      } as RawBodyRequest<Request>;

      await expect(controller.handleWebhook(mockRequest, '')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if raw body is missing', async () => {
      const mockRequest = {
        rawBody: undefined,
      } as RawBodyRequest<Request>;

      await expect(controller.handleWebhook(mockRequest, mockSignature)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException on webhook signature verification error', async () => {
      const mockRequest = {
        rawBody: Buffer.from('webhook payload'),
      } as RawBodyRequest<Request>;

      mockStripeService.constructWebhookEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(controller.handleWebhook(mockRequest, mockSignature)).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
