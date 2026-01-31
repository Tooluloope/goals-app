import { ForbiddenException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

import { UsageService } from './usage.service';

describe('UsageService', () => {
  let service: UsageService;
  let prismaService: PrismaService;
  let subscriptionsService: SubscriptionsService;

  const mockUserId = 'user-123';

  const mockUsageQuota = {
    id: '1',
    userId: mockUserId,
    goalsCount: 2,
    habitsCount: 3,
    workspacesCount: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFreePlanLimits = {
    goals: 3,
    habits: 5,
    workspaces: 1,
  };

  const mockProPlanLimits = {
    goals: Infinity,
    habits: Infinity,
    workspaces: 1,
  };

  const mockFreeSubscription = {
    plan: 'FREE' as const,
    status: 'ACTIVE' as const,
    trialEndsAt: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageService,
        {
          provide: PrismaService,
          useValue: {
            usageQuota: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              upsert: jest.fn(),
            },
            project: {
              count: jest.fn(),
            },
            habit: {
              count: jest.fn(),
            },
            workspace: {
              count: jest.fn(),
            },
          },
        },
        {
          provide: SubscriptionsService,
          useValue: {
            getPlanLimits: jest.fn(),
            getSubscriptionStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsageService>(UsageService);
    prismaService = module.get<PrismaService>(PrismaService);
    subscriptionsService = module.get<SubscriptionsService>(SubscriptionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateUsageQuota', () => {
    it('should return existing usage quota', async () => {
      jest.spyOn(prismaService.usageQuota, 'findUnique').mockResolvedValue(mockUsageQuota as any);

      const result = await service.getOrCreateUsageQuota(mockUserId);

      expect(result).toEqual(mockUsageQuota);
      expect(prismaService.usageQuota.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
    });

    it('should create usage quota if not found', async () => {
      jest.spyOn(prismaService.usageQuota, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.project, 'count').mockResolvedValue(2);
      jest.spyOn(prismaService.habit, 'count').mockResolvedValue(3);
      jest.spyOn(prismaService.workspace, 'count').mockResolvedValue(1);
      jest.spyOn(prismaService.usageQuota, 'create').mockResolvedValue(mockUsageQuota as any);

      const result = await service.getOrCreateUsageQuota(mockUserId);

      expect(result).toEqual(mockUsageQuota);
      expect(prismaService.usageQuota.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          goalsCount: 2,
          habitsCount: 3,
          workspacesCount: 1,
        },
      });
    });
  });

  describe('getUsageInfo', () => {
    it('should return usage information with limits', async () => {
      jest.spyOn(prismaService.usageQuota, 'findUnique').mockResolvedValue(mockUsageQuota as any);
      jest.spyOn(subscriptionsService, 'getPlanLimits').mockResolvedValue(mockFreePlanLimits);

      const result = await service.getUsageInfo(mockUserId);

      expect(result).toEqual({
        goalsCount: 2,
        habitsCount: 3,
        workspacesCount: 1,
        limits: mockFreePlanLimits,
      });
    });

    it('should create quota if not exists', async () => {
      jest.spyOn(prismaService.usageQuota, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.project, 'count').mockResolvedValue(0);
      jest.spyOn(prismaService.habit, 'count').mockResolvedValue(0);
      jest.spyOn(prismaService.workspace, 'count').mockResolvedValue(1);
      jest.spyOn(prismaService.usageQuota, 'create').mockResolvedValue({
        ...mockUsageQuota,
        goalsCount: 0,
        habitsCount: 0,
      } as any);
      jest.spyOn(subscriptionsService, 'getPlanLimits').mockResolvedValue(mockFreePlanLimits);

      const result = await service.getUsageInfo(mockUserId);

      expect(result.goalsCount).toBe(0);
      expect(result.habitsCount).toBe(0);
    });
  });

  describe('canCreate', () => {
    beforeEach(() => {
      jest.spyOn(prismaService.usageQuota, 'findUnique').mockResolvedValue(mockUsageQuota as any);
    });

    it('should return true when under goals limit', async () => {
      jest.spyOn(subscriptionsService, 'getPlanLimits').mockResolvedValue(mockFreePlanLimits);

      const result = await service.canCreate(mockUserId, 'goals');

      expect(result).toBe(true); // 2 < 3
    });

    it('should return false when at goals limit', async () => {
      jest.spyOn(prismaService.usageQuota, 'findUnique').mockResolvedValue({
        ...mockUsageQuota,
        goalsCount: 3,
      } as any);
      jest.spyOn(subscriptionsService, 'getPlanLimits').mockResolvedValue(mockFreePlanLimits);

      const result = await service.canCreate(mockUserId, 'goals');

      expect(result).toBe(false); // 3 >= 3
    });

    it('should return true for unlimited plan', async () => {
      jest.spyOn(prismaService.usageQuota, 'findUnique').mockResolvedValue({
        ...mockUsageQuota,
        goalsCount: 100,
      } as any);
      jest.spyOn(subscriptionsService, 'getPlanLimits').mockResolvedValue(mockProPlanLimits);

      const result = await service.canCreate(mockUserId, 'goals');

      expect(result).toBe(true); // 100 < Infinity
    });

    it('should return true when under habits limit', async () => {
      jest.spyOn(subscriptionsService, 'getPlanLimits').mockResolvedValue(mockFreePlanLimits);

      const result = await service.canCreate(mockUserId, 'habits');

      expect(result).toBe(true); // 3 < 5
    });

    it('should return false when at habits limit', async () => {
      jest.spyOn(prismaService.usageQuota, 'findUnique').mockResolvedValue({
        ...mockUsageQuota,
        habitsCount: 5,
      } as any);
      jest.spyOn(subscriptionsService, 'getPlanLimits').mockResolvedValue(mockFreePlanLimits);

      const result = await service.canCreate(mockUserId, 'habits');

      expect(result).toBe(false); // 5 >= 5
    });

    it('should return false when at workspaces limit', async () => {
      jest.spyOn(subscriptionsService, 'getPlanLimits').mockResolvedValue(mockFreePlanLimits);

      const result = await service.canCreate(mockUserId, 'workspaces');

      expect(result).toBe(false); // 1 >= 1
    });
  });

  describe('enforceQuota', () => {
    beforeEach(() => {
      jest.spyOn(prismaService.usageQuota, 'findUnique').mockResolvedValue(mockUsageQuota as any);
      jest
        .spyOn(subscriptionsService, 'getSubscriptionStatus')
        .mockResolvedValue(mockFreeSubscription);
    });

    it('should not throw when user can create resource', async () => {
      jest.spyOn(subscriptionsService, 'getPlanLimits').mockResolvedValue(mockFreePlanLimits);

      await expect(service.enforceQuota(mockUserId, 'goals')).resolves.not.toThrow();
    });

    it('should throw ForbiddenException when goals limit reached', async () => {
      jest.spyOn(prismaService.usageQuota, 'findUnique').mockResolvedValue({
        ...mockUsageQuota,
        goalsCount: 3,
      } as any);
      jest.spyOn(subscriptionsService, 'getPlanLimits').mockResolvedValue(mockFreePlanLimits);

      await expect(service.enforceQuota(mockUserId, 'goals')).rejects.toThrow(ForbiddenException);
      await expect(service.enforceQuota(mockUserId, 'goals')).rejects.toThrow(
        "You've reached your goals limit (3/3) on the FREE plan. Upgrade to PRO for unlimited goals."
      );
    });

    it('should throw ForbiddenException when habits limit reached', async () => {
      jest.spyOn(prismaService.usageQuota, 'findUnique').mockResolvedValue({
        ...mockUsageQuota,
        habitsCount: 5,
      } as any);
      jest.spyOn(subscriptionsService, 'getPlanLimits').mockResolvedValue(mockFreePlanLimits);

      await expect(service.enforceQuota(mockUserId, 'habits')).rejects.toThrow(
        "You've reached your habits limit (5/5) on the FREE plan. Upgrade to PRO for unlimited habits."
      );
    });

    it('should throw ForbiddenException when workspaces limit reached', async () => {
      jest.spyOn(subscriptionsService, 'getPlanLimits').mockResolvedValue(mockFreePlanLimits);

      await expect(service.enforceQuota(mockUserId, 'workspaces')).rejects.toThrow(
        "You've reached your workspaces limit (1/1) on the FREE plan. Upgrade to PRO for unlimited workspaces."
      );
    });

    it('should not throw for unlimited PRO plan', async () => {
      jest.spyOn(prismaService.usageQuota, 'findUnique').mockResolvedValue({
        ...mockUsageQuota,
        goalsCount: 100,
      } as any);
      jest.spyOn(subscriptionsService, 'getPlanLimits').mockResolvedValue(mockProPlanLimits);

      await expect(service.enforceQuota(mockUserId, 'goals')).resolves.not.toThrow();
    });
  });

  describe('incrementUsage', () => {
    beforeEach(() => {
      jest.spyOn(prismaService.usageQuota, 'findUnique').mockResolvedValue(mockUsageQuota as any);
      jest.spyOn(prismaService.usageQuota, 'update').mockResolvedValue({} as any);
    });

    it('should increment goals count', async () => {
      await service.incrementUsage(mockUserId, 'goals');

      expect(prismaService.usageQuota.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: { goalsCount: { increment: 1 } },
      });
    });

    it('should increment habits count', async () => {
      await service.incrementUsage(mockUserId, 'habits');

      expect(prismaService.usageQuota.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: { habitsCount: { increment: 1 } },
      });
    });

    it('should increment workspaces count', async () => {
      await service.incrementUsage(mockUserId, 'workspaces');

      expect(prismaService.usageQuota.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: { workspacesCount: { increment: 1 } },
      });
    });

    it('should create quota if not exists before incrementing', async () => {
      jest.spyOn(prismaService.usageQuota, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.project, 'count').mockResolvedValue(0);
      jest.spyOn(prismaService.habit, 'count').mockResolvedValue(0);
      jest.spyOn(prismaService.workspace, 'count').mockResolvedValue(1);
      jest.spyOn(prismaService.usageQuota, 'create').mockResolvedValue(mockUsageQuota as any);

      await service.incrementUsage(mockUserId, 'goals');

      expect(prismaService.usageQuota.create).toHaveBeenCalled();
      expect(prismaService.usageQuota.update).toHaveBeenCalled();
    });
  });

  describe('decrementUsage', () => {
    beforeEach(() => {
      jest.spyOn(prismaService.usageQuota, 'findUnique').mockResolvedValue(mockUsageQuota as any);
      jest.spyOn(prismaService.usageQuota, 'update').mockResolvedValue({} as any);
    });

    it('should decrement goals count', async () => {
      await service.decrementUsage(mockUserId, 'goals');

      expect(prismaService.usageQuota.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: { goalsCount: { decrement: 1 } },
      });
    });

    it('should decrement habits count', async () => {
      await service.decrementUsage(mockUserId, 'habits');

      expect(prismaService.usageQuota.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: { habitsCount: { decrement: 1 } },
      });
    });

    it('should decrement workspaces count', async () => {
      await service.decrementUsage(mockUserId, 'workspaces');

      expect(prismaService.usageQuota.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: { workspacesCount: { decrement: 1 } },
      });
    });
  });

  describe('syncUsageCounts', () => {
    it('should sync usage counts from database', async () => {
      jest.spyOn(prismaService.project, 'count').mockResolvedValue(5);
      jest.spyOn(prismaService.habit, 'count').mockResolvedValue(8);
      jest.spyOn(prismaService.workspace, 'count').mockResolvedValue(2);
      jest.spyOn(prismaService.usageQuota, 'upsert').mockResolvedValue({} as any);

      await service.syncUsageCounts(mockUserId);

      expect(prismaService.usageQuota.upsert).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        create: {
          userId: mockUserId,
          goalsCount: 5,
          habitsCount: 8,
          workspacesCount: 2,
        },
        update: {
          goalsCount: 5,
          habitsCount: 8,
          workspacesCount: 2,
        },
      });
    });

    it('should sync even when counts are zero', async () => {
      jest.spyOn(prismaService.project, 'count').mockResolvedValue(0);
      jest.spyOn(prismaService.habit, 'count').mockResolvedValue(0);
      jest.spyOn(prismaService.workspace, 'count').mockResolvedValue(0);
      jest.spyOn(prismaService.usageQuota, 'upsert').mockResolvedValue({} as any);

      await service.syncUsageCounts(mockUserId);

      expect(prismaService.usageQuota.upsert).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        create: expect.objectContaining({
          goalsCount: 0,
          habitsCount: 0,
          workspacesCount: 0,
        }),
        update: expect.objectContaining({
          goalsCount: 0,
          habitsCount: 0,
          workspacesCount: 0,
        }),
      });
    });
  });
});
