import { NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';

import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;

  const mockNotification = {
    id: 'notification-1',
    userId: 'user-1',
    type: 'task_due',
    title: 'Task Due',
    body: 'Your task is due soon',
    projectId: 'project-1',
    taskId: 'task-1',
    readAt: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      notification: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get(PrismaService);
  });

  describe('findAllForUser', () => {
    it('should return all notifications for user', async () => {
      const notifications = [mockNotification, { ...mockNotification, id: 'notification-2' }];
      prisma.notification.findMany.mockResolvedValue(notifications);

      const result = await service.findAllForUser('user-1');

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      expect(result).toEqual(notifications);
    });

    it('should return empty array when no notifications', async () => {
      prisma.notification.findMany.mockResolvedValue([]);

      const result = await service.findAllForUser('user-1');

      expect(result).toEqual([]);
    });

    it('should limit to 50 notifications', async () => {
      prisma.notification.findMany.mockResolvedValue([]);

      await service.findAllForUser('user-1');

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 })
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      prisma.notification.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-1');

      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', readAt: null },
      });
      expect(result).toBe(5);
    });

    it('should return 0 when all notifications are read', async () => {
      prisma.notification.count.mockResolvedValue(0);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      prisma.notification.findUnique.mockResolvedValue(mockNotification);
      prisma.notification.update.mockResolvedValue({
        ...mockNotification,
        readAt: new Date(),
      });

      const result = await service.markAsRead('notification-1', 'user-1');

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notification-1' },
        data: { readAt: expect.any(Date) },
      });
      expect(result.readAt).toBeDefined();
    });

    it('should throw NotFoundException when notification not found', async () => {
      prisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user does not own notification', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        ...mockNotification,
        userId: 'other-user',
      });

      await expect(service.markAsRead('notification-1', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 3 });

      await service.markAllAsRead('user-1');

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', readAt: null },
        data: { readAt: expect.any(Date) },
      });
    });

    it('should not throw when no unread notifications', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.markAllAsRead('user-1')).resolves.not.toThrow();
    });
  });

  describe('create', () => {
    it('should create notification with all fields', async () => {
      prisma.notification.create.mockResolvedValue(mockNotification);

      const result = await service.create(
        'user-1',
        'task_due' as any,
        'Task Due',
        'Your task is due soon',
        'project-1',
        'task-1'
      );

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'task_due',
          title: 'Task Due',
          body: 'Your task is due soon',
          projectId: 'project-1',
          taskId: 'task-1',
        },
      });
      expect(result).toEqual(mockNotification);
    });

    it('should create notification without optional fields', async () => {
      const notificationWithoutOptional = {
        ...mockNotification,
        projectId: undefined,
        taskId: undefined,
      };
      prisma.notification.create.mockResolvedValue(notificationWithoutOptional);

      await service.create('user-1', 'system' as any, 'System Alert', 'This is a system message');

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'system',
          title: 'System Alert',
          body: 'This is a system message',
          projectId: undefined,
          taskId: undefined,
        },
      });
    });

    it('should create different notification types', async () => {
      prisma.notification.create.mockResolvedValue(mockNotification);

      const types = ['task_due', 'project_completed', 'habit_reminder', 'system'];

      for (const type of types) {
        await service.create('user-1', type as any, 'Title', 'Body');
        expect(prisma.notification.create).toHaveBeenCalledWith({
          data: expect.objectContaining({ type }),
        });
      }
    });
  });

  describe('delete', () => {
    it('should delete notification when user owns it', async () => {
      prisma.notification.findUnique.mockResolvedValue(mockNotification);
      prisma.notification.delete.mockResolvedValue(mockNotification);

      await service.delete('notification-1', 'user-1');

      expect(prisma.notification.delete).toHaveBeenCalledWith({
        where: { id: 'notification-1' },
      });
    });

    it('should throw NotFoundException when notification not found', async () => {
      prisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.delete('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user does not own notification', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        ...mockNotification,
        userId: 'other-user',
      });

      await expect(service.delete('notification-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
