import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateTaskDto, UpdateTaskDto, RecurrenceType } from '@goals/shared';
import { Task, TaskDependency, RecurrenceType as PrismaRecurrenceType } from '@goals/database';
import { addDays, addWeeks, addMonths, addYears, setDay, isAfter, startOfDay } from 'date-fns';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private projectsService: ProjectsService
  ) {}

  private calculateNextOccurrence(
    recurrenceType: RecurrenceType,
    interval: number,
    recurrenceDays: number[],
    fromDate: Date = new Date()
  ): Date | null {
    const baseDate = startOfDay(fromDate);

    switch (recurrenceType) {
      case 'daily':
        return addDays(baseDate, interval);

      case 'weekly':
        if (recurrenceDays.length > 0) {
          // Find next occurrence based on specified days
          const today = baseDate.getDay();
          const sortedDays = [...recurrenceDays].sort((a, b) => a - b);

          // Find the next day in this week
          const nextDayThisWeek = sortedDays.find((d) => d > today);
          if (nextDayThisWeek !== undefined) {
            return setDay(baseDate, nextDayThisWeek, { weekStartsOn: 0 });
          }

          // Otherwise, go to the first day of next week cycle
          const firstDay = sortedDays[0];
          const nextWeek = addWeeks(baseDate, interval);
          return setDay(nextWeek, firstDay, { weekStartsOn: 0 });
        }
        return addWeeks(baseDate, interval);

      case 'monthly':
        return addMonths(baseDate, interval);

      case 'yearly':
        return addYears(baseDate, interval);

      case 'custom':
        return addDays(baseDate, interval);

      default:
        return null;
    }
  }

  async create(data: CreateTaskDto, userId: string): Promise<Task> {
    // Verify user has access to the project
    await this.projectsService.findById(data.projectId, userId);

    const isRecurring = data.isRecurring ?? false;
    const recurrenceType = (data.recurrenceType ?? 'none') as PrismaRecurrenceType;
    const recurrenceInterval = data.recurrenceInterval ?? 1;
    const recurrenceDays = data.recurrenceDays ?? [];

    // Calculate next occurrence if recurring
    let nextOccurrence: Date | null = null;
    if (isRecurring && recurrenceType !== 'none') {
      const baseDate = data.dueDate ? new Date(data.dueDate) : new Date();
      nextOccurrence = this.calculateNextOccurrence(
        recurrenceType,
        recurrenceInterval,
        recurrenceDays,
        baseDate
      );
    }

    return this.prisma.task.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        statusId: data.statusId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assignedToId: data.assignedToId || null,
        isRecurring,
        recurrenceType,
        recurrenceInterval,
        recurrenceDays,
        nextOccurrence,
      },
    });
  }

  async update(id: string, data: UpdateTaskDto, userId: string): Promise<Task> {
    const task = await this.findById(id);
    await this.projectsService.findById(task.projectId, userId);

    const updateData: any = { ...data };
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

    // Recalculate next occurrence if recurrence settings changed
    if (
      data.isRecurring !== undefined ||
      data.recurrenceType !== undefined ||
      data.recurrenceInterval !== undefined ||
      data.recurrenceDays !== undefined
    ) {
      const isRecurring = data.isRecurring ?? task.isRecurring;
      const recurrenceType = (data.recurrenceType ?? task.recurrenceType) as RecurrenceType;
      const recurrenceInterval = data.recurrenceInterval ?? task.recurrenceInterval;
      const recurrenceDays = data.recurrenceDays ?? task.recurrenceDays;

      if (isRecurring && recurrenceType !== 'none') {
        const baseDate = updateData.dueDate ?? task.dueDate ?? new Date();
        updateData.nextOccurrence = this.calculateNextOccurrence(
          recurrenceType,
          recurrenceInterval,
          recurrenceDays,
          baseDate
        );
      } else {
        updateData.nextOccurrence = null;
      }
    }

    return this.prisma.task.update({
      where: { id },
      data: updateData,
    });
  }

  async updateStatus(id: string, statusId: string, userId: string): Promise<Task> {
    const task = await this.findById(id);
    await this.projectsService.findById(task.projectId, userId);

    return this.prisma.task.update({
      where: { id },
      data: { statusId },
    });
  }

  async completeRecurringTask(
    id: string,
    userId: string,
    createNextOccurrence: boolean = true
  ): Promise<{ completedTask: Task; nextTask?: Task }> {
    const task = await this.findById(id);
    await this.projectsService.findById(task.projectId, userId);

    if (!task.isRecurring) {
      throw new Error('Task is not recurring');
    }

    const now = new Date();

    // Update the current task as completed
    const completedTask = await this.prisma.task.update({
      where: { id },
      data: {
        completedAt: now,
        streak: task.streak + 1,
      },
    });

    // Create next occurrence if requested
    let nextTask: Task | undefined;
    if (createNextOccurrence && task.recurrenceType !== 'none') {
      const nextDueDate = this.calculateNextOccurrence(
        task.recurrenceType as RecurrenceType,
        task.recurrenceInterval,
        task.recurrenceDays,
        now
      );

      const nextNextOccurrence = nextDueDate
        ? this.calculateNextOccurrence(
            task.recurrenceType as RecurrenceType,
            task.recurrenceInterval,
            task.recurrenceDays,
            nextDueDate
          )
        : null;

      nextTask = await this.prisma.task.create({
        data: {
          projectId: task.projectId,
          title: task.title,
          statusId: task.statusId,
          dueDate: nextDueDate,
          assignedToId: task.assignedToId,
          isRecurring: true,
          recurrenceType: task.recurrenceType,
          recurrenceInterval: task.recurrenceInterval,
          recurrenceDays: task.recurrenceDays,
          nextOccurrence: nextNextOccurrence,
          parentTaskId: task.parentTaskId ?? task.id,
          streak: task.streak + 1,
        },
      });
    }

    return { completedTask, nextTask };
  }

  async delete(id: string, userId: string): Promise<void> {
    const task = await this.findById(id);
    await this.projectsService.findById(task.projectId, userId);

    await this.prisma.task.delete({ where: { id } });
  }

  async findById(id: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        blockedBy: {
          include: {
            blocker: { select: { id: true, title: true, statusId: true } },
          },
        },
        blocking: {
          include: {
            dependent: { select: { id: true, title: true, statusId: true } },
          },
        },
      },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, workspaceId: true } },
        blockedBy: {
          include: {
            blocker: { select: { id: true, title: true, statusId: true, projectId: true } },
          },
        },
        blocking: {
          include: {
            dependent: { select: { id: true, title: true, statusId: true, projectId: true } },
          },
        },
        images: true,
      },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    // Verify user has access to the project
    await this.projectsService.findById(task.projectId, userId);
    return task;
  }

  async findAllForUser(userId: string): Promise<Task[]> {
    const projects = await this.projectsService.findAllForUser(userId);
    const projectIds = projects.map((p) => p.id);

    return this.prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            workspaceId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================================
  // DEPENDENCY MANAGEMENT
  // ============================================================

  async getBlockers(
    taskId: string,
    userId: string
  ): Promise<{ blockedBy: TaskDependency[]; blocking: TaskDependency[] }> {
    const task = await this.findById(taskId);
    await this.projectsService.findById(task.projectId, userId);
    return {
      blockedBy: (task as any).blockedBy || [],
      blocking: (task as any).blocking || [],
    };
  }

  async addBlocker(
    taskId: string,
    blockerId: string,
    userId: string,
    note?: string
  ): Promise<TaskDependency> {
    // Verify user has access to the task
    const dependent = await this.findById(taskId);
    await this.projectsService.findById(dependent.projectId, userId);

    // Verify user has access to the blocker task
    const blocker = await this.findById(blockerId);
    await this.projectsService.findById(blocker.projectId, userId);

    // Prevent self-blocking
    if (taskId === blockerId) {
      throw new BadRequestException('A task cannot block itself');
    }

    // Check for circular dependency
    const wouldCreateCycle = await this.wouldCreateCircularDependency(taskId, blockerId);
    if (wouldCreateCycle) {
      throw new BadRequestException('This would create a circular dependency');
    }

    // Check if dependency already exists
    const existing = await this.prisma.taskDependency.findUnique({
      where: {
        dependentId_blockerId: { dependentId: taskId, blockerId },
      },
    });

    if (existing) {
      throw new BadRequestException('This blocker relationship already exists');
    }

    return this.prisma.taskDependency.create({
      data: {
        dependentId: taskId,
        blockerId,
        note,
      },
      include: {
        blocker: { select: { id: true, title: true, statusId: true } },
        dependent: { select: { id: true, title: true, statusId: true } },
      },
    });
  }

  async removeBlocker(taskId: string, blockerId: string, userId: string): Promise<void> {
    // Verify user has access
    const task = await this.findById(taskId);
    await this.projectsService.findById(task.projectId, userId);

    const dependency = await this.prisma.taskDependency.findUnique({
      where: {
        dependentId_blockerId: { dependentId: taskId, blockerId },
      },
    });

    if (!dependency) {
      throw new NotFoundException('Blocker relationship not found');
    }

    await this.prisma.taskDependency.delete({
      where: { id: dependency.id },
    });
  }

  private async wouldCreateCircularDependency(
    dependentId: string,
    newBlockerId: string
  ): Promise<boolean> {
    // Check if dependentId is in the blocker chain of newBlockerId
    const visited = new Set<string>();
    const queue = [newBlockerId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === dependentId) {
        return true; // Circular dependency detected
      }
      if (visited.has(current)) continue;
      visited.add(current);

      // Get all tasks that block the current task
      const blockers = await this.prisma.taskDependency.findMany({
        where: { dependentId: current },
        select: { blockerId: true },
      });

      for (const b of blockers) {
        if (!visited.has(b.blockerId)) {
          queue.push(b.blockerId);
        }
      }
    }

    return false;
  }

  async getUnblockedDependents(blockerId: string): Promise<string[]> {
    // Find all tasks that were blocked only by this task
    const dependents = await this.prisma.taskDependency.findMany({
      where: { blockerId },
      select: { dependentId: true },
    });

    const unblockedIds: string[] = [];

    for (const dep of dependents) {
      // Check if this dependent has any other incomplete blockers
      const otherBlockers = await this.prisma.taskDependency.count({
        where: {
          dependentId: dep.dependentId,
          blockerId: { not: blockerId },
          blocker: {
            statusId: { notIn: ['task-done', 'task-completed'] },
          },
        },
      });

      if (otherBlockers === 0) {
        unblockedIds.push(dep.dependentId);
      }
    }

    return unblockedIds;
  }
}
