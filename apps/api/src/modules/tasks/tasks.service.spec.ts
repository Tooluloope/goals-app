import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: any;
  let projectsService: any;

  const mockTask = {
    id: 'task-1',
    projectId: 'project-1',
    title: 'Test Task',
    statusId: 'status-1',
    dueDate: new Date('2024-06-15'),
    assignedToId: 'user-1',
    isRecurring: false,
    recurrenceType: 'none',
    recurrenceInterval: 1,
    recurrenceDays: [],
    nextOccurrence: null,
    parentTaskId: null,
    streak: 0,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    blockedBy: [],
    blocking: [],
  };

  const mockRecurringTask = {
    ...mockTask,
    id: 'recurring-task-1',
    isRecurring: true,
    recurrenceType: 'daily',
    recurrenceInterval: 1,
  };

  const makeDataUrl = (mime: string, bytes: number[]) =>
    `data:${mime};base64,${Buffer.from(bytes).toString('base64')}`;
  const PNG_BYTES = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

  beforeEach(async () => {
    const mockPrismaService = {
      task: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      } as any,
      taskDependency: {
        create: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      } as any,
    };

    const mockProjectsService = {
      findById: jest.fn().mockResolvedValue({ id: 'project-1', workspaceId: 'workspace-1' }),
      findAllForUser: jest.fn().mockResolvedValue([{ id: 'project-1' }, { id: 'project-2' }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrismaService } as any,
        { provide: ProjectsService, useValue: mockProjectsService } as any,
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get(PrismaService);
    projectsService = module.get(ProjectsService);
  });

  describe('create', () => {
    it('should create a basic task', async () => {
      prisma.task.create.mockResolvedValue(mockTask);

      const result = await service.create(
        {
          projectId: 'project-1',
          title: 'Test Task',
          statusId: 'status-1',
        } as any,
        'user-1'
      );

      expect(projectsService.findById).toHaveBeenCalledWith('project-1', 'user-1');
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: 'project-1',
          title: 'Test Task',
          statusId: 'status-1',
          isRecurring: false,
          recurrenceType: 'none',
        }),
        include: { images: true },
      });
      expect(result).toEqual(mockTask);
    });

    it('should create a recurring daily task with next occurrence', async () => {
      const recurringTask = { ...mockTask, isRecurring: true, recurrenceType: 'daily' };
      prisma.task.create.mockResolvedValue(recurringTask);

      await service.create(
        {
          projectId: 'project-1',
          title: 'Daily Task',
          statusId: 'status-1',
          isRecurring: true,
          recurrenceType: 'daily',
          recurrenceInterval: 1,
        } as any,
        'user-1'
      );

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isRecurring: true,
          recurrenceType: 'daily',
          recurrenceInterval: 1,
          nextOccurrence: expect.any(Date),
        }),
        include: { images: true },
      });
    });

    it('should create a weekly recurring task', async () => {
      const weeklyTask = { ...mockTask, isRecurring: true, recurrenceType: 'weekly' };
      prisma.task.create.mockResolvedValue(weeklyTask);

      await service.create(
        {
          projectId: 'project-1',
          title: 'Weekly Task',
          statusId: 'status-1',
          isRecurring: true,
          recurrenceType: 'weekly',
          recurrenceInterval: 2,
          recurrenceDays: [1, 3, 5], // Mon, Wed, Fri
        } as any,
        'user-1'
      );

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isRecurring: true,
          recurrenceType: 'weekly',
          recurrenceInterval: 2,
          recurrenceDays: [1, 3, 5],
        }),
        include: { images: true },
      });
    });

    it('should create a monthly recurring task', async () => {
      const monthlyTask = { ...mockTask, isRecurring: true, recurrenceType: 'monthly' };
      prisma.task.create.mockResolvedValue(monthlyTask);

      await service.create(
        {
          projectId: 'project-1',
          title: 'Monthly Task',
          statusId: 'status-1',
          isRecurring: true,
          recurrenceType: 'monthly',
        } as any,
        'user-1'
      );

      expect(prisma.task.create).toHaveBeenCalled();
    });

    it('should create task with due date', async () => {
      prisma.task.create.mockResolvedValue(mockTask);

      await service.create(
        {
          projectId: 'project-1',
          title: 'Task with due date',
          statusId: 'status-1',
          dueDate: '2024-06-20',
        } as any,
        'user-1'
      );

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          dueDate: new Date('2024-06-20'),
        }),
        include: { images: true },
      });
    });

    it('should create task with image attachments', async () => {
      const pngDataUrl = makeDataUrl('image/png', PNG_BYTES);
      prisma.task.create.mockResolvedValue({ ...mockTask, images: [] });

      await service.create(
        {
          projectId: 'project-1',
          title: 'Task with images',
          statusId: 'status-1',
          images: [
            {
              id: 'img-1',
              name: 'proof',
              data: pngDataUrl,
              type: 'image/png',
              size: 100,
              caption: 'Progress',
            },
          ],
        } as any,
        'user-1'
      );

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          images: {
            create: [
              expect.objectContaining({
                filename: 'proof.png',
                url: pngDataUrl,
                mimeType: 'image/png',
                size: Buffer.from(PNG_BYTES).length,
                caption: 'Progress',
              }),
            ],
          },
        }),
        include: { images: true },
      });
    });

    it('should reject invalid image data', async () => {
      await expect(
        service.create(
          {
            projectId: 'project-1',
            title: 'Bad image task',
            statusId: 'status-1',
            images: [
              {
                id: 'img-1',
                name: 'proof',
                data: 'not-a-data-url',
                type: 'image/png',
                size: 100,
              },
            ],
          } as any,
          'user-1'
        )
      ).rejects.toThrow(BadRequestException);

      expect(prisma.task.create).not.toHaveBeenCalled();
    });

    it('should reject too many images', async () => {
      const pngDataUrl = makeDataUrl('image/png', PNG_BYTES);
      const images = Array.from({ length: 6 }, (_, index) => ({
        id: `img-${index}`,
        name: `proof-${index}`,
        data: pngDataUrl,
        type: 'image/png',
        size: 100,
      }));

      await expect(
        service.create(
          {
            projectId: 'project-1',
            title: 'Too many images',
            statusId: 'status-1',
            images,
          } as any,
          'user-1'
        )
      ).rejects.toThrow(BadRequestException);

      expect(prisma.task.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update task title', async () => {
      prisma.task.findUnique.mockResolvedValue(mockTask);
      prisma.task.update.mockResolvedValue({ ...mockTask, title: 'Updated Title' });

      const result = await service.update('task-1', { title: 'Updated Title' }, 'user-1');

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' } as any,
        data: expect.objectContaining({ title: 'Updated Title' }),
      });
      expect(result.title).toBe('Updated Title');
    });

    it('should update task due date', async () => {
      prisma.task.findUnique.mockResolvedValue(mockTask);
      prisma.task.update.mockResolvedValue(mockTask);

      await service.update('task-1', { dueDate: '2024-07-01' }, 'user-1');

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' } as any,
        data: expect.objectContaining({
          dueDate: new Date('2024-07-01'),
        }),
      });
    });

    it('should recalculate next occurrence when recurrence settings change', async () => {
      prisma.task.findUnique.mockResolvedValue(mockTask);
      prisma.task.update.mockResolvedValue({ ...mockTask, isRecurring: true });

      await service.update(
        'task-1',
        {
          isRecurring: true,
          recurrenceType: 'daily',
          recurrenceInterval: 2,
        } as any,
        'user-1'
      );

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' } as any,
        data: expect.objectContaining({
          nextOccurrence: expect.any(Date),
        }),
      });
    });

    it('should clear next occurrence when recurrence is disabled', async () => {
      prisma.task.findUnique.mockResolvedValue(mockRecurringTask);
      prisma.task.update.mockResolvedValue({ ...mockRecurringTask, isRecurring: false });

      await service.update('recurring-task-1', { isRecurring: false }, 'user-1');

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'recurring-task-1' } as any,
        data: expect.objectContaining({
          nextOccurrence: null,
        }),
      });
    });
  });

  describe('updateStatus', () => {
    it('should update task status', async () => {
      prisma.task.findUnique.mockResolvedValue(mockTask);
      prisma.task.update.mockResolvedValue({ ...mockTask, statusId: 'status-2' });

      const result = await service.updateStatus('task-1', 'status-2', 'user-1');

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' } as any,
        data: { statusId: 'status-2' } as any,
      });
      expect(result.statusId).toBe('status-2');
    });
  });

  describe('completeRecurringTask', () => {
    it('should complete recurring task and create next occurrence', async () => {
      prisma.task.findUnique.mockResolvedValue(mockRecurringTask);
      prisma.task.update.mockResolvedValue({
        ...mockRecurringTask,
        completedAt: new Date(),
        streak: 1,
      });
      prisma.task.create.mockResolvedValue({
        ...mockRecurringTask,
        id: 'next-task',
        streak: 1,
      });

      const result = await service.completeRecurringTask('recurring-task-1', 'user-1', true);

      expect(result.completedTask).toBeDefined();
      expect(result.nextTask).toBeDefined();
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'recurring-task-1' } as any,
        data: expect.objectContaining({
          completedAt: expect.any(Date),
          streak: 1,
        }),
      });
      expect(prisma.task.create).toHaveBeenCalled();
    });

    it('should complete recurring task without creating next occurrence', async () => {
      prisma.task.findUnique.mockResolvedValue(mockRecurringTask);
      prisma.task.update.mockResolvedValue({
        ...mockRecurringTask,
        completedAt: new Date(),
        streak: 1,
      });

      const result = await service.completeRecurringTask('recurring-task-1', 'user-1', false);

      expect(result.completedTask).toBeDefined();
      expect(result.nextTask).toBeUndefined();
      expect(prisma.task.create).not.toHaveBeenCalled();
    });

    it('should throw error for non-recurring task', async () => {
      prisma.task.findUnique.mockResolvedValue(mockTask);

      await expect(service.completeRecurringTask('task-1', 'user-1')).rejects.toThrow(
        'Task is not recurring'
      );
    });

    it('should increment streak on completion', async () => {
      const taskWithStreak = { ...mockRecurringTask, streak: 5 };
      prisma.task.findUnique.mockResolvedValue(taskWithStreak);
      prisma.task.update.mockResolvedValue({ ...taskWithStreak, streak: 6 });
      prisma.task.create.mockResolvedValue({ ...taskWithStreak, id: 'next', streak: 6 });

      await service.completeRecurringTask('recurring-task-1', 'user-1', true);

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'recurring-task-1' } as any,
        data: expect.objectContaining({ streak: 6 }),
      });
    });
  });

  describe('delete', () => {
    it('should delete a task', async () => {
      prisma.task.findUnique.mockResolvedValue(mockTask);
      prisma.task.delete.mockResolvedValue(mockTask);

      await service.delete('task-1', 'user-1');

      expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: 'task-1' } });
    });
  });

  describe('findById', () => {
    it('should return task when found', async () => {
      prisma.task.findUnique.mockResolvedValue(mockTask);

      const result = await service.findById('task-1');

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException when task not found', async () => {
      prisma.task.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return task with project info when found', async () => {
      const taskWithProject = {
        ...mockTask,
        project: { id: 'project-1', name: 'Test Project', workspaceId: 'ws-1' } as any,
        images: [],
      };
      prisma.task.findUnique.mockResolvedValue(taskWithProject);

      const result = await service.findOne('task-1', 'user-1');

      expect(result).toEqual(taskWithProject);
      expect(projectsService.findById).toHaveBeenCalledWith('project-1', 'user-1');
    });

    it('should throw NotFoundException when task not found', async () => {
      prisma.task.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllForUser', () => {
    it('should return all tasks for user projects', async () => {
      const tasks = [mockTask, { ...mockTask, id: 'task-2' }];
      prisma.task.findMany.mockResolvedValue(tasks);

      const result = await service.findAllForUser('user-1');

      expect(projectsService.findAllForUser).toHaveBeenCalledWith('user-1');
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { projectId: { in: ['project-1', 'project-2'] } } as any,
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' } as any,
      });
      expect(result).toEqual(tasks);
    });
  });

  describe('getBlockers', () => {
    it('should return blocker relationships', async () => {
      const taskWithBlockers = {
        ...mockTask,
        blockedBy: [{ id: 'dep-1', blocker: { id: 'blocker-task', title: 'Blocker' } }],
        blocking: [{ id: 'dep-2', dependent: { id: 'dependent-task', title: 'Dependent' } }],
      };
      prisma.task.findUnique.mockResolvedValue(taskWithBlockers);

      const result = await service.getBlockers('task-1', 'user-1');

      expect(result.blockedBy).toHaveLength(1);
      expect(result.blocking).toHaveLength(1);
    });
  });

  describe('addBlocker', () => {
    beforeEach(() => {
      prisma.task.findUnique.mockResolvedValue(mockTask);
      prisma.taskDependency.findUnique.mockResolvedValue(null);
      prisma.taskDependency.findMany.mockResolvedValue([]);
    });

    it('should add blocker relationship', async () => {
      const dependency = {
        id: 'dep-1',
        dependentId: 'task-1',
        blockerId: 'blocker-task',
        note: 'Must complete first',
      };
      prisma.taskDependency.create.mockResolvedValue(dependency);

      const result = await service.addBlocker(
        'task-1',
        'blocker-task',
        'user-1',
        'Must complete first'
      );

      expect(prisma.taskDependency.create).toHaveBeenCalledWith({
        data: {
          dependentId: 'task-1',
          blockerId: 'blocker-task',
          note: 'Must complete first',
        } as any,
        include: expect.any(Object),
      });
      expect(result).toEqual(dependency);
    });

    it('should throw error when task blocks itself', async () => {
      await expect(service.addBlocker('task-1', 'task-1', 'user-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw error when dependency already exists', async () => {
      prisma.taskDependency.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.addBlocker('task-1', 'blocker-task', 'user-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should detect circular dependency', async () => {
      // Setup: blocker-task is blocked by task-1 (creating cycle)
      prisma.taskDependency.findMany.mockResolvedValue([{ blockerId: 'task-1' }]);

      await expect(service.addBlocker('task-1', 'blocker-task', 'user-1')).rejects.toThrow(
        'This would create a circular dependency'
      );
    });
  });

  describe('removeBlocker', () => {
    it('should remove blocker relationship', async () => {
      prisma.task.findUnique.mockResolvedValue(mockTask);
      prisma.taskDependency.findUnique.mockResolvedValue({ id: 'dep-1' });
      prisma.taskDependency.delete.mockResolvedValue({ id: 'dep-1' });

      await service.removeBlocker('task-1', 'blocker-task', 'user-1');

      expect(prisma.taskDependency.delete).toHaveBeenCalledWith({
        where: { id: 'dep-1' } as any,
      });
    });

    it('should throw NotFoundException when relationship not found', async () => {
      prisma.task.findUnique.mockResolvedValue(mockTask);
      prisma.taskDependency.findUnique.mockResolvedValue(null);

      await expect(service.removeBlocker('task-1', 'nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getUnblockedDependents', () => {
    it('should return tasks that become unblocked', async () => {
      prisma.taskDependency.findMany.mockResolvedValue([
        { dependentId: 'dependent-1' } as any,
        { dependentId: 'dependent-2' } as any,
      ]);
      prisma.taskDependency.count.mockResolvedValue(0);

      const result = await service.getUnblockedDependents('blocker-task');

      expect(result).toContain('dependent-1');
      expect(result).toContain('dependent-2');
    });

    it('should not return tasks that still have other blockers', async () => {
      prisma.taskDependency.findMany.mockResolvedValue([{ dependentId: 'dependent-1' }]);
      prisma.taskDependency.count.mockResolvedValue(1); // Has other blockers

      const result = await service.getUnblockedDependents('blocker-task');

      expect(result).toHaveLength(0);
    });
  });

  describe('calculateNextOccurrence (via create)', () => {
    it('should calculate yearly recurrence', async () => {
      prisma.task.create.mockResolvedValue({
        ...mockTask,
        isRecurring: true,
        recurrenceType: 'yearly',
      });

      await service.create(
        {
          projectId: 'project-1',
          title: 'Yearly Task',
          statusId: 'status-1',
          isRecurring: true,
          recurrenceType: 'yearly',
          dueDate: '2024-01-01',
        } as any,
        'user-1'
      );

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          nextOccurrence: expect.any(Date),
        }),
        include: { images: true },
      });
    });

    it('should calculate custom recurrence', async () => {
      prisma.task.create.mockResolvedValue({
        ...mockTask,
        isRecurring: true,
        recurrenceType: 'custom',
      });

      await service.create(
        {
          projectId: 'project-1',
          title: 'Custom Task',
          statusId: 'status-1',
          isRecurring: true,
          recurrenceType: 'custom',
          recurrenceInterval: 10,
        } as any,
        'user-1'
      );

      expect(prisma.task.create).toHaveBeenCalled();
    });
  });
});
