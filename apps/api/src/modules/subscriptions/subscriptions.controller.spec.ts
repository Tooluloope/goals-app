import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { Request } from 'express';

import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;
  let subscriptionsService: SubscriptionsService;

  const mockUserId = 'user-123';
  const mockRequest = {
    user: { id: mockUserId },
  } as Request & { user: { id: string } };

  const mockSubscriptionInfo = {
    plan: 'PRO' as const,
    status: 'ACTIVE' as const,
    trialEndsAt: null,
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
    features: {
      unlimitedGoals: true,
      unlimitedHabits: true,
      aiFeatures: true,
      familyWorkspaces: false,
      advancedAnalytics: true,
      dataExport: true,
      prioritySupport: true,
    },
  };

  const mockPlanLimits = {
    goals: Infinity,
    habits: Infinity,
    workspaces: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [
        {
          provide: SubscriptionsService,
          useValue: {
            getSubscriptionStatus: jest.fn(),
            getPlanLimits: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SubscriptionsController>(SubscriptionsController);
    subscriptionsService = module.get<SubscriptionsService>(SubscriptionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStatus', () => {
    it('should return subscription status', async () => {
      jest
        .spyOn(subscriptionsService, 'getSubscriptionStatus')
        .mockResolvedValue(mockSubscriptionInfo);

      const result = await controller.getStatus(mockRequest);

      expect(result).toEqual(mockSubscriptionInfo);
      expect(subscriptionsService.getSubscriptionStatus).toHaveBeenCalledWith(mockUserId);
    });

    it('should handle FREE plan users', async () => {
      const freeSubscriptionInfo = {
        ...mockSubscriptionInfo,
        plan: 'FREE' as const,
        features: {
          unlimitedGoals: false,
          unlimitedHabits: false,
          aiFeatures: false,
          familyWorkspaces: false,
          advancedAnalytics: false,
          dataExport: false,
          prioritySupport: false,
        },
      };

      jest
        .spyOn(subscriptionsService, 'getSubscriptionStatus')
        .mockResolvedValue(freeSubscriptionInfo);

      const result = await controller.getStatus(mockRequest);

      expect(result.plan).toBe('FREE');
      expect(result.features.aiFeatures).toBe(false);
    });

    it('should handle FAMILY plan users', async () => {
      const familySubscriptionInfo = {
        ...mockSubscriptionInfo,
        plan: 'FAMILY' as const,
        features: {
          ...mockSubscriptionInfo.features,
          familyWorkspaces: true,
        },
      };

      jest
        .spyOn(subscriptionsService, 'getSubscriptionStatus')
        .mockResolvedValue(familySubscriptionInfo);

      const result = await controller.getStatus(mockRequest);

      expect(result.plan).toBe('FAMILY');
      expect(result.features.familyWorkspaces).toBe(true);
    });
  });

  describe('getLimits', () => {
    it('should return plan limits', async () => {
      jest.spyOn(subscriptionsService, 'getPlanLimits').mockResolvedValue(mockPlanLimits);

      const result = await controller.getLimits(mockRequest);

      expect(result).toEqual(mockPlanLimits);
      expect(subscriptionsService.getPlanLimits).toHaveBeenCalledWith(mockUserId);
    });

    it('should return FREE plan limits', async () => {
      const freeLimits = {
        goals: 3,
        habits: 5,
        workspaces: 1,
      };

      jest.spyOn(subscriptionsService, 'getPlanLimits').mockResolvedValue(freeLimits);

      const result = await controller.getLimits(mockRequest);

      expect(result).toEqual(freeLimits);
    });

    it('should return FAMILY plan limits', async () => {
      const familyLimits = {
        goals: Infinity,
        habits: Infinity,
        workspaces: Infinity,
      };

      jest.spyOn(subscriptionsService, 'getPlanLimits').mockResolvedValue(familyLimits);

      const result = await controller.getLimits(mockRequest);

      expect(result).toEqual(familyLimits);
    });
  });
});
