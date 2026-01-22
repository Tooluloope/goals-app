import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateProjectDto, UpdateProjectDto, AddReviewDto } from '@goals/shared';
import { Project } from '@goals/database';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private workspacesService: WorkspacesService
  ) {}

  async findAllForWorkspace(workspaceId: string, userId: string): Promise<Project[]> {
    await this.workspacesService.verifyAccess(workspaceId, userId);

    return this.prisma.project.findMany({
      where: { workspaceId },
      include: {
        checklistItems: { orderBy: { order: 'asc' } },
        tasks: { orderBy: { createdAt: 'desc' } },
        metrics: true,
        reviewNotes: { orderBy: { date: 'desc' }, take: 5 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findAllForUser(userId: string): Promise<Project[]> {
    const workspaces = await this.workspacesService.findAllForUser(userId);
    const workspaceIds = workspaces.map((w) => w.id);

    return this.prisma.project.findMany({
      where: { workspaceId: { in: workspaceIds } },
      include: {
        checklistItems: { orderBy: { order: 'asc' } },
        tasks: { orderBy: { createdAt: 'desc' } },
        metrics: true,
        reviewNotes: { orderBy: { date: 'desc' }, take: 5 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(id: string, userId: string): Promise<Project> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        checklistItems: { orderBy: { order: 'asc' } },
        keyDecisions: { orderBy: { date: 'desc' } },
        tasks: { orderBy: { createdAt: 'desc' } },
        metrics: true,
        reviewNotes: {
          orderBy: { date: 'desc' },
          include: { images: true },
        },
        images: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.workspacesService.verifyAccess(project.workspaceId, userId);
    return project;
  }

  async create(data: CreateProjectDto, userId: string): Promise<Project> {
    await this.workspacesService.verifyAccess(data.workspaceId, userId);

    return this.prisma.project.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        targetDate: new Date(data.targetDate),
        metrics: { create: {} },
      },
      include: {
        checklistItems: true,
        tasks: true,
        metrics: true,
        reviewNotes: true,
      },
    });
  }

  async update(id: string, data: UpdateProjectDto, userId: string): Promise<Project> {
    const project = await this.findById(id, userId);

    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.targetDate) updateData.targetDate = new Date(data.targetDate);

    return this.prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        checklistItems: { orderBy: { order: 'asc' } },
        tasks: true,
        metrics: true,
        reviewNotes: { orderBy: { date: 'desc' } },
      },
    });
  }

  async updateStatus(id: string, statusId: string, userId: string): Promise<Project> {
    await this.findById(id, userId);
    return this.prisma.project.update({
      where: { id },
      data: { statusId },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.findById(id, userId);
    await this.prisma.project.delete({ where: { id } });
  }

  async addRequirement(projectId: string, text: string, userId: string): Promise<Project> {
    await this.findById(projectId, userId);

    const maxOrder = await this.prisma.checklistItem.aggregate({
      where: { projectId, type: 'requirement' },
      _max: { order: true },
    });

    await this.prisma.checklistItem.create({
      data: {
        projectId,
        type: 'requirement',
        text,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    return this.findById(projectId, userId);
  }

  async toggleRequirement(projectId: string, itemId: string, userId: string): Promise<Project> {
    await this.findById(projectId, userId);

    const item = await this.prisma.checklistItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException('Checklist item not found');

    await this.prisma.checklistItem.update({
      where: { id: itemId },
      data: { completed: !item.completed },
    });

    return this.findById(projectId, userId);
  }

  async addDefinitionOfDone(projectId: string, text: string, userId: string): Promise<Project> {
    await this.findById(projectId, userId);

    const maxOrder = await this.prisma.checklistItem.aggregate({
      where: { projectId, type: 'definition_of_done' },
      _max: { order: true },
    });

    await this.prisma.checklistItem.create({
      data: {
        projectId,
        type: 'definition_of_done',
        text,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    return this.findById(projectId, userId);
  }

  async toggleDefinitionOfDone(
    projectId: string,
    itemId: string,
    userId: string
  ): Promise<Project> {
    return this.toggleRequirement(projectId, itemId, userId);
  }

  async addReview(data: AddReviewDto, userId: string): Promise<Project> {
    const { projectId, ...reviewData } = data;
    await this.findById(projectId, userId);

    await this.prisma.$transaction([
      this.prisma.reviewNote.create({
        data: {
          projectId,
          date: new Date(),
          ...reviewData,
        },
      }),
      this.prisma.project.update({
        where: { id: projectId },
        data: { lastReviewDate: new Date() },
      }),
    ]);

    return this.findById(projectId, userId);
  }
}
