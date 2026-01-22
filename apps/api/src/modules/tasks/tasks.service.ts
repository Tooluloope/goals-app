import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CreateTaskDto, UpdateTaskDto } from '@goals/shared';
import { Task } from '@goals/database';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private projectsService: ProjectsService
  ) {}

  async create(data: CreateTaskDto, userId: string): Promise<Task> {
    // Verify user has access to the project
    await this.projectsService.findById(data.projectId, userId);

    return this.prisma.task.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        statusId: data.statusId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assignedToId: data.assignedToId || null,
      },
    });
  }

  async update(id: string, data: UpdateTaskDto, userId: string): Promise<Task> {
    const task = await this.findById(id);
    await this.projectsService.findById(task.projectId, userId);

    const updateData: any = { ...data };
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

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

  async delete(id: string, userId: string): Promise<void> {
    const task = await this.findById(id);
    await this.projectsService.findById(task.projectId, userId);

    await this.prisma.task.delete({ where: { id } });
  }

  async findById(id: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
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
}
