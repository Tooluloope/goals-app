import { ForbiddenException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';

import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prismaService: PrismaService;

  const mockUserId = 'user-123';

  const mockFreeSubscription = {
    id: '1',
    userId: mockUserId,
    stripeCustomerId: 'cus_123',
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
  };

  const mockProSubscription = {
    ...mockFreeSubscription,
    plan: 'PRO',
    stripeSubscriptionId: 'sub_123',
    stripePriceId: 'price_123',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };

  const mockFamilySubscription = {
    ...mockFreeSubscription,
    plan: 'FAMILY',
    stripeSubscriptionId: 'sub_456',
    stripePriceId: 'price_456',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: PrismaService,
          useValue: {
            subscription: {
              findUnique: jest.fn(),
              create: jest.fn(),
              upsert: jest.fn(),
            },
            usageQuota: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateSubscription', () => {
    it('should return existing subscription', async () => {
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockFreeSubscription as any);

      const result = await service.getOrCreateSubscription(mockUserId);

      expect(result.plan).toBe('FREE');
      expect(result.status).toBe('ACTIVE');
      expect(result.features.unlimitedGoals).toBe(false);
      expect(prismaService.subscription.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
    });

    it('should create FREE subscription if not found', async () => {
      jest.spyOn(prismaService.subscription, 'findUnique').mockResolvedValue(null);
      jest
        .spyOn(prismaService.subscription, 'create')
        .mockResolvedValue(mockFreeSubscription as any);

      const result = await service.getOrCreateSubscription(mockUserId);

      expect(result.plan).toBe('FREE');
      expect(prismaService.subscription.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          stripeCustomerId: `temp_${mockUserId}`,
          plan: 'FREE',
          status: 'ACTIVE',
        },
      });
    });

    it('should map PRO subscription with correct features', async () => {
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockProSubscription as any);

      const result = await service.getOrCreateSubscription(mockUserId);

      expect(result.plan).toBe('PRO');
      expect(result.features.unlimitedGoals).toBe(true);
      expect(result.features.unlimitedHabits).toBe(true);
      expect(result.features.aiFeatures).toBe(true);
      expect(result.features.familyWorkspaces).toBe(false);
      expect(result.features.advancedAnalytics).toBe(true);
      expect(result.features.prioritySupport).toBe(true);
    });

    it('should map FAMILY subscription with correct features', async () => {
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockFamilySubscription as any);

      const result = await service.getOrCreateSubscription(mockUserId);

      expect(result.plan).toBe('FAMILY');
      expect(result.features.unlimitedGoals).toBe(true);
      expect(result.features.familyWorkspaces).toBe(true);
      expect(result.features.aiFeatures).toBe(true);
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should return subscription status', async () => {
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockProSubscription as any);

      const result = await service.getSubscriptionStatus(mockUserId);

      expect(result.plan).toBe('PRO');
      expect(result.status).toBe('ACTIVE');
    });
  });

  describe('requiresPlan', () => {
    it('should return true for FREE user checking FREE access', async () => {
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockFreeSubscription as any);

      const result = await service.requiresPlan(mockUserId, 'FREE');

      expect(result).toBe(true);
    });

    it('should return false for FREE user checking PRO access', async () => {
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockFreeSubscription as any);

      const result = await service.requiresPlan(mockUserId, 'PRO');

      expect(result).toBe(false);
    });

    it('should return true for PRO user checking PRO access', async () => {
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockProSubscription as any);

      const result = await service.requiresPlan(mockUserId, 'PRO');

      expect(result).toBe(true);
    });

    it('should return true for PRO user checking FREE access', async () => {
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockProSubscription as any);

      const result = await service.requiresPlan(mockUserId, 'FREE');

      expect(result).toBe(true);
    });

    it('should return false for PRO user checking FAMILY access', async () => {
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockProSubscription as any);

      const result = await service.requiresPlan(mockUserId, 'FAMILY');

      expect(result).toBe(false);
    });

    it('should return true for FAMILY user checking any plan', async () => {
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockFamilySubscription as any);

      const results = await Promise.all([
        service.requiresPlan(mockUserId, 'FREE'),
        service.requiresPlan(mockUserId, 'PRO'),
        service.requiresPlan(mockUserId, 'FAMILY'),
      ]);

      expect(results).toEqual([true, true, true]);
    });

    it('should return true for TRIALING user', async () => {
      const trialingSubscription = {
        ...mockProSubscription,
        status: 'TRIALING',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(trialingSubscription as any);

      const result = await service.requiresPlan(mockUserId, 'PRO');

      expect(result).toBe(true);
    });

    it('should return false for CANCELED user', async () => {
      const canceledSubscription = {
        ...mockProSubscription,
        status: 'CANCELED',
      };

      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(canceledSubscription as any);

      const result = await service.requiresPlan(mockUserId, 'PRO');

      expect(result).toBe(false);
    });
  });

  describe('enforceplan', () => {
    it('should not throw error if user has required plan', async () => {
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockProSubscription as any);

      await expect(service.enforceplan(mockUserId, 'PRO')).resolves.not.toThrow();
    });

    it('should throw ForbiddenException if user lacks required plan', async () => {
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockFreeSubscription as any);

      await expect(service.enforceplan(mockUserId, 'PRO')).rejects.toThrow(ForbiddenException);
      await expect(service.enforceplan(mockUserId, 'PRO')).rejects.toThrow(
        'This feature requires PRO plan. Your current plan: FREE'
      );
    });

    it('should throw ForbiddenException with correct message for FAMILY plan', async () => {
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockProSubscription as any);

      await expect(service.enforceplan(mockUserId, 'FAMILY')).rejects.toThrow(
        'This feature requires FAMILY plan. Your current plan: PRO'
      );
    });
  });

  describe('canAccessAI', () => {
    it('should return false for FREE users', async () => {
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockFreeSubscription as any);

      const result = await service.canAccessAI(mockUserId);

      expect(result).toBe(false);
    });

    it('should return true for PRO users', async () => {
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockProSubscription as any);

      const result = await service.canAccessAI(mockUserId);

      expect(result).toBe(true);
    });

    it('should return true for FAMILY users', async () => {
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockFamilySubscription as any);

      const result = await service.canAccessAI(mockUserId);

      expect(result).toBe(true);
    });
  });

  describe('canCreateFamilyWorkspace', () => {
    it('should return false for FREE users', async () => {
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockFreeSubscription as any);

      const result = await service.canCreateFamilyWorkspace(mockUserId);

      expect(result).toBe(false);
    });

    it('should return false for PRO users', async () => {
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockProSubscription as any);

      const result = await service.canCreateFamilyWorkspace(mockUserId);

      expect(result).toBe(false);
    });

    it('should return true for FAMILY users', async () => {
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockFamilySubscription as any);

      const result = await service.canCreateFamilyWorkspace(mockUserId);

      expect(result).toBe(true);
    });
  });

  describe('getPlanLimits', () => {
    it('should return FREE plan limits', async () => {
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockFreeSubscription as any);

      const result = await service.getPlanLimits(mockUserId);

      expect(result).toEqual({
        goals: 3,
        habits: 5,
        workspaces: 1,
      });
    });

    it('should return PRO plan limits with infinity', async () => {
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockProSubscription as any);

      const result = await service.getPlanLimits(mockUserId);

      expect(result).toEqual({
        goals: Infinity,
        habits: Infinity,
        workspaces: 1,
      });
    });

    it('should return FAMILY plan limits with all infinity', async () => {
      jest
        .spyOn(prismaService.subscription, 'findUnique')
        .mockResolvedValue(mockFamilySubscription as any);

      const result = await service.getPlanLimits(mockUserId);

      expect(result).toEqual({
        goals: Infinity,
        habits: Infinity,
        workspaces: Infinity,
      });
    });
  });

  describe('initializeForNewUser', () => {
    it('should create subscription and usage quota for new user', async () => {
      const stripeCustomerId = 'cus_new_123';

      jest
        .spyOn(prismaService.subscription, 'create')
        .mockResolvedValue(mockFreeSubscription as any);
      jest.spyOn(prismaService.usageQuota, 'create').mockResolvedValue({} as any);

      await service.initializeForNewUser(mockUserId, stripeCustomerId);

      expect(prismaService.subscription.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          stripeCustomerId,
          plan: 'FREE',
          status: 'ACTIVE',
        },
      });

      expect(prismaService.usageQuota.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          goalsCount: 0,
          habitsCount: 0,
          workspacesCount: 1,
        },
      });
    });

    it('should create subscription with specified plan', async () => {
      const stripeCustomerId = 'cus_new_123';

      jest
        .spyOn(prismaService.subscription, 'create')
        .mockResolvedValue(mockProSubscription as any);
      jest.spyOn(prismaService.usageQuota, 'create').mockResolvedValue({} as any);

      await service.initializeForNewUser(mockUserId, stripeCustomerId, 'PRO');

      expect(prismaService.subscription.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          stripeCustomerId,
          plan: 'PRO',
          status: 'ACTIVE',
        },
      });
    });
  });
});
