import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';

import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let prismaService: {
    user: { count: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
    subscription: {
      groupBy: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const mockUserId = 'user-123';
  const mockAdminId = 'admin-456';

  const mockSubscription = {
    id: 'sub-1',
    userId: mockAdminId,
    stripeCustomerId: 'cus_123',
    plan: 'FREE',
    status: 'ACTIVE',
    cancelAtPeriodEnd: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prismaService = {
      user: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      subscription: {
        groupBy: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService, { provide: PrismaService, useValue: prismaService }],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('activatePlan', () => {
    it('should update existing subscription to PRO', async () => {
      prismaService.subscription.findUnique.mockResolvedValue(mockSubscription);
      prismaService.subscription.update.mockResolvedValue({ plan: 'PRO', status: 'ACTIVE' });

      const result = await service.activatePlan(mockAdminId, 'PRO');

      expect(prismaService.subscription.update).toHaveBeenCalledWith({
        where: { userId: mockAdminId },
        data: { plan: 'PRO', status: 'ACTIVE', cancelAtPeriodEnd: false },
        select: { plan: true, status: true },
      });
      expect(result).toEqual({ plan: 'PRO', status: 'ACTIVE' });
    });

    it('should update existing subscription to FAMILY', async () => {
      prismaService.subscription.findUnique.mockResolvedValue(mockSubscription);
      prismaService.subscription.update.mockResolvedValue({ plan: 'FAMILY', status: 'ACTIVE' });

      const result = await service.activatePlan(mockAdminId, 'FAMILY');

      expect(prismaService.subscription.update).toHaveBeenCalledWith({
        where: { userId: mockAdminId },
        data: { plan: 'FAMILY', status: 'ACTIVE', cancelAtPeriodEnd: false },
        select: { plan: true, status: true },
      });
      expect(result).toEqual({ plan: 'FAMILY', status: 'ACTIVE' });
    });

    it('should create a new subscription when none exists', async () => {
      prismaService.subscription.findUnique.mockResolvedValue(null);
      prismaService.subscription.create.mockResolvedValue({ plan: 'PRO', status: 'ACTIVE' });

      const result = await service.activatePlan(mockAdminId, 'PRO');

      expect(prismaService.subscription.create).toHaveBeenCalledWith({
        data: {
          userId: mockAdminId,
          stripeCustomerId: `admin_${mockAdminId}`,
          plan: 'PRO',
          status: 'ACTIVE',
        },
        select: { plan: true, status: true },
      });
      expect(result).toEqual({ plan: 'PRO', status: 'ACTIVE' });
    });

    it('should not call create when subscription already exists', async () => {
      prismaService.subscription.findUnique.mockResolvedValue(mockSubscription);
      prismaService.subscription.update.mockResolvedValue({ plan: 'PRO', status: 'ACTIVE' });

      await service.activatePlan(mockAdminId, 'PRO');

      expect(prismaService.subscription.create).not.toHaveBeenCalled();
    });

    it('should not call update when subscription does not exist', async () => {
      prismaService.subscription.findUnique.mockResolvedValue(null);
      prismaService.subscription.create.mockResolvedValue({ plan: 'FAMILY', status: 'ACTIVE' });

      await service.activatePlan(mockAdminId, 'FAMILY');

      expect(prismaService.subscription.update).not.toHaveBeenCalled();
    });

    it('should reset cancelAtPeriodEnd when upgrading existing subscription', async () => {
      const cancelingSubscription = { ...mockSubscription, cancelAtPeriodEnd: true };
      prismaService.subscription.findUnique.mockResolvedValue(cancelingSubscription);
      prismaService.subscription.update.mockResolvedValue({ plan: 'PRO', status: 'ACTIVE' });

      await service.activatePlan(mockAdminId, 'PRO');

      expect(prismaService.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ cancelAtPeriodEnd: false }),
        })
      );
    });
  });

  describe('updateUserRole', () => {
    it('should update user role to ADMIN', async () => {
      prismaService.user.findUnique.mockResolvedValue({ id: mockUserId, role: 'USER' });
      prismaService.user.update.mockResolvedValue({ id: mockUserId, role: 'ADMIN' });

      const result = await service.updateUserRole(mockUserId, 'ADMIN');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { role: 'ADMIN' },
        select: { id: true, role: true },
      });
      expect(result).toEqual({ id: mockUserId, role: 'ADMIN' });
    });

    it('should throw BadRequestException for invalid role', async () => {
      await expect(service.updateUserRole(mockUserId, 'INVALID' as any)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw NotFoundException for unknown user', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.updateUserRole('unknown', 'ADMIN')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when trying to change SUPER_ADMIN role', async () => {
      prismaService.user.findUnique.mockResolvedValue({ id: mockUserId, role: 'SUPER_ADMIN' });
      await expect(service.updateUserRole(mockUserId, 'ADMIN')).rejects.toThrow(
        BadRequestException
      );
      await expect(service.updateUserRole(mockUserId, 'ADMIN')).rejects.toThrow(
        'Cannot change SUPER_ADMIN role'
      );
    });
  });
});
