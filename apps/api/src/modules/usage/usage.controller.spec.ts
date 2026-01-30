import { Test, TestingModule } from '@nestjs/testing';
import { UsageController } from './usage.controller';
import { UsageService } from './usage.service';
import { Request } from 'express';

describe('UsageController', () => {
  let controller: UsageController;
  let usageService: UsageService;

  const mockUserId = 'user-123';
  const mockRequest = {
    user: { userId: mockUserId },
  } as Request & { user: { userId: string } };

  const mockUsageInfo = {
    goalsCount: 2,
    habitsCount: 3,
    workspacesCount: 1,
    limits: {
      goals: 3,
      habits: 5,
      workspaces: 1,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsageController],
      providers: [
        {
          provide: UsageService,
          useValue: {
            getUsageInfo: jest.fn(),
            syncUsageCounts: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsageController>(UsageController);
    usageService = module.get<UsageService>(UsageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUsage', () => {
    it('should return usage information', async () => {
      jest.spyOn(usageService, 'getUsageInfo').mockResolvedValue(mockUsageInfo);

      const result = await controller.getUsage(mockRequest);

      expect(result).toEqual(mockUsageInfo);
      expect(usageService.getUsageInfo).toHaveBeenCalledWith(mockUserId);
    });

    it('should handle FREE plan limits', async () => {
      jest.spyOn(usageService, 'getUsageInfo').mockResolvedValue(mockUsageInfo);

      const result = await controller.getUsage(mockRequest);

      expect(result.limits.goals).toBe(3);
      expect(result.limits.habits).toBe(5);
    });

    it('should handle PRO plan unlimited limits', async () => {
      const proUsageInfo = {
        ...mockUsageInfo,
        goalsCount: 100,
        habitsCount: 50,
        limits: {
          goals: Infinity,
          habits: Infinity,
          workspaces: 1,
        },
      };

      jest.spyOn(usageService, 'getUsageInfo').mockResolvedValue(proUsageInfo);

      const result = await controller.getUsage(mockRequest);

      expect(result.limits.goals).toBe(Infinity);
      expect(result.limits.habits).toBe(Infinity);
    });
  });

  describe('syncUsage', () => {
    it('should sync usage counts and return success', async () => {
      jest.spyOn(usageService, 'syncUsageCounts').mockResolvedValue(undefined);

      const result = await controller.syncUsage(mockRequest);

      expect(result).toEqual({
        success: true,
        message: 'Usage counts synchronized',
      });
      expect(usageService.syncUsageCounts).toHaveBeenCalledWith(mockUserId);
    });

    it('should handle sync errors', async () => {
      jest.spyOn(usageService, 'syncUsageCounts').mockRejectedValue(new Error('Sync failed'));

      await expect(controller.syncUsage(mockRequest)).rejects.toThrow('Sync failed');
    });
  });
});
