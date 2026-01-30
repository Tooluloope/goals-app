import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { UsageService } from '../usage/usage.service';
import { CreateProjectDto, UpdateProjectDto, AddReviewDto } from '@goals/shared';
import { Project, ProjectDependency } from '@goals/database';
import { differenceInDays } from 'date-fns';
import { normalizeImageAttachments } from '../../common/utils/image-validation';

// Status IDs that indicate completion
const COMPLETED_STATUS_IDS = ['status-done', 'status-completed'];

// Helper to transform checklistItems into requirements and definitionOfDone
function transformProjectChecklist(project: any): any {
  if (!project) return project;
  const checklistItems = project.checklistItems || [];
  return {
    ...project,
    requirements: checklistItems.filter((item: any) => item.type === 'requirement'),
    definitionOfDone: checklistItems.filter((item: any) => item.type === 'definition_of_done'),
  };
}

function transformProjectsChecklist(projects: any[]): any[] {
  return projects.map(transformProjectChecklist);
}

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private prisma: PrismaService,
    private workspacesService: WorkspacesService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
    private usageService: UsageService
  ) {}

  async findAllForWorkspace(workspaceId: string, userId: string): Promise<Project[]> {
    await this.workspacesService.verifyAccess(workspaceId, userId);

    const projects = await this.prisma.project.findMany({
      where: { workspaceId },
      include: {
        checklistItems: { orderBy: { order: 'asc' } },
        tasks: { orderBy: { createdAt: 'desc' } },
        metrics: true,
        reviewNotes: {
          orderBy: { date: 'desc' },
          take: 5,
          include: { createdBy: { select: { id: true, name: true, avatar: true } } },
        },
        blockedBy: {
          include: {
            blocker: { select: { id: true, name: true, statusId: true } },
          },
        },
        blocking: {
          include: {
            dependent: { select: { id: true, name: true, statusId: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return transformProjectsChecklist(projects);
  }

  async findAllForUser(userId: string): Promise<Project[]> {
    const workspaces = await this.workspacesService.findAllForUser(userId);
    const workspaceIds = workspaces.map((w) => w.id);

    const projects = await this.prisma.project.findMany({
      where: { workspaceId: { in: workspaceIds } },
      include: {
        checklistItems: { orderBy: { order: 'asc' } },
        tasks: { orderBy: { createdAt: 'desc' } },
        metrics: true,
        reviewNotes: {
          orderBy: { date: 'desc' },
          take: 5,
          include: { createdBy: { select: { id: true, name: true, avatar: true } } },
        },
        blockedBy: {
          include: {
            blocker: { select: { id: true, name: true, statusId: true } },
          },
        },
        blocking: {
          include: {
            dependent: { select: { id: true, name: true, statusId: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return transformProjectsChecklist(projects);
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
          include: {
            images: true,
            createdBy: { select: { id: true, name: true, avatar: true } },
          },
        },
        images: true,
        blockedBy: {
          include: {
            blocker: { select: { id: true, name: true, statusId: true } },
          },
        },
        blocking: {
          include: {
            dependent: { select: { id: true, name: true, statusId: true } },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.workspacesService.verifyAccess(project.workspaceId, userId);
    return transformProjectChecklist(project);
  }

  async create(data: CreateProjectDto, userId: string): Promise<Project> {
    await this.workspacesService.verifyAccess(data.workspaceId, userId);

    // Check if user can create more goals (quota enforcement for FREE tier)
    const workspace = await this.prisma.workspace.findUnique({ where: { id: data.workspaceId } });
    if (workspace) {
      await this.usageService.enforceQuota(workspace.ownerId, 'goals');
    }

    const project = await this.prisma.project.create({
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

    // Increment usage counter for workspace owner
    if (workspace) {
      await this.usageService.incrementUsage(workspace.ownerId, 'goals');
    }

    return transformProjectChecklist(project);
  }

  async update(id: string, data: UpdateProjectDto, userId: string): Promise<Project> {
    // Verify project exists and user has access
    await this.findById(id, userId);

    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.targetDate) updateData.targetDate = new Date(data.targetDate);
    const imageInput = (data as any).images;
    if (imageInput !== undefined) {
      const imageData = normalizeImageAttachments(imageInput, {
        context: 'Project',
        maxCount: 10,
        maxBytes: 5 * 1024 * 1024,
      });
      updateData.images = {
        deleteMany: {},
        ...(imageData.length > 0 ? { create: imageData } : {}),
      };
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        checklistItems: { orderBy: { order: 'asc' } },
        tasks: true,
        metrics: true,
        reviewNotes: { orderBy: { date: 'desc' } },
        images: true,
      },
    });
    return transformProjectChecklist(project);
  }

  async updateStatus(id: string, statusId: string, userId: string): Promise<Project> {
    const project = await this.findById(id, userId);
    const previousStatusId = project.statusId;

    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: { statusId },
    });

    // Check if project was marked as completed
    const wasCompleted = COMPLETED_STATUS_IDS.includes(previousStatusId);
    const isNowCompleted = COMPLETED_STATUS_IDS.includes(statusId);

    if (!wasCompleted && isNowCompleted) {
      // Project just became completed - notify dependents
      await this.notifyBlockerResolved(id, project.name, userId);

      // Send goal completed email (non-blocking)
      this.sendGoalCompletedEmail(project, userId).catch((err) => {
        this.logger.error(`Failed to send goal completed email: ${err.message}`);
      });
    }

    return updatedProject;
  }

  private async sendGoalCompletedEmail(project: Project, userId: string): Promise<void> {
    // Get user info
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, settings: true },
    });

    if (!user) return;

    // Check email preferences - default to true if not set
    const settings = user.settings as Record<string, any> | null;
    const _emailPrefs = settings?.emailPreferences;
    // Note: There's no specific goalCompleted pref, so we'll send by default

    // Calculate stats for the email
    const completedTasks = await this.prisma.task.count({
      where: { projectId: project.id, statusId: { in: ['completed', 'done'] } },
    });

    const totalDays = differenceInDays(new Date(), project.startDate);

    await this.emailService.sendGoalCompletedEmail(
      user.email,
      user.name,
      project.name,
      undefined, // No parent project name
      completedTasks,
      totalDays > 0 ? totalDays : 1
    );

    this.logger.log(`Sent goal completed email to ${user.email} for "${project.name}"`);
  }

  private async notifyBlockerResolved(
    blockerId: string,
    blockerName: string,
    _userId: string
  ): Promise<void> {
    // Find all projects that were blocked by this project
    const dependents = await this.prisma.projectDependency.findMany({
      where: { blockerId },
      include: {
        dependent: {
          select: { id: true, name: true, workspaceId: true },
        },
      },
    });

    for (const dep of dependents) {
      if (!dep.dependent) continue;

      // Check if this dependent has any other incomplete blockers
      const otherBlockers = await this.prisma.projectDependency.count({
        where: {
          dependentId: dep.dependentId,
          blockerId: { not: blockerId },
          blocker: {
            statusId: { notIn: COMPLETED_STATUS_IDS },
          },
        },
      });

      const isFullyUnblocked = otherBlockers === 0;

      // Get workspace members to notify
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: dep.dependent.workspaceId },
        include: {
          members: {
            select: { userId: true },
          },
        },
      });

      if (!workspace) continue;

      // Create notification for each workspace member
      for (const member of workspace.members) {
        await this.notificationsService.create(
          member.userId,
          'BlockerResolved',
          isFullyUnblocked ? 'Blocker Resolved - Goal Unblocked!' : 'Blocker Resolved',
          isFullyUnblocked
            ? `"${blockerName}" is now complete. "${dep.dependent.name}" is no longer blocked and ready to proceed!`
            : `"${blockerName}" is now complete. "${dep.dependent.name}" still has other blockers.`,
          dep.dependentId
        );
      }
    }
  }

  async delete(id: string, userId: string): Promise<void> {
    const project = await this.findById(id, userId);
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: project.workspaceId },
    });

    await this.prisma.project.delete({ where: { id } });

    // Decrement usage counter for workspace owner
    if (workspace) {
      await this.usageService.decrementUsage(workspace.ownerId, 'goals');
    }
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
          createdById: userId,
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

  // ============================================================
  // DEPENDENCY MANAGEMENT
  // ============================================================

  async getBlockers(
    projectId: string,
    userId: string
  ): Promise<{ blockedBy: ProjectDependency[]; blocking: ProjectDependency[] }> {
    const project = await this.findById(projectId, userId);
    return {
      blockedBy: (project as any).blockedBy || [],
      blocking: (project as any).blocking || [],
    };
  }

  async addBlocker(
    projectId: string,
    blockerId: string,
    userId: string,
    note?: string
  ): Promise<ProjectDependency> {
    // Verify user has access to both projects
    await this.findById(projectId, userId);
    await this.findById(blockerId, userId);

    // Prevent self-blocking
    if (projectId === blockerId) {
      throw new BadRequestException('A project cannot block itself');
    }

    // Check for circular dependency
    const wouldCreateCycle = await this.wouldCreateCircularDependency(projectId, blockerId);
    if (wouldCreateCycle) {
      throw new BadRequestException('This would create a circular dependency');
    }

    // Check if dependency already exists
    const existing = await this.prisma.projectDependency.findUnique({
      where: {
        dependentId_blockerId: { dependentId: projectId, blockerId },
      },
    });

    if (existing) {
      throw new BadRequestException('This blocker relationship already exists');
    }

    return this.prisma.projectDependency.create({
      data: {
        dependentId: projectId,
        blockerId,
        note,
      },
      include: {
        blocker: { select: { id: true, name: true, statusId: true } },
        dependent: { select: { id: true, name: true, statusId: true } },
      },
    });
  }

  async removeBlocker(projectId: string, blockerId: string, userId: string): Promise<void> {
    // Verify user has access
    await this.findById(projectId, userId);

    const dependency = await this.prisma.projectDependency.findUnique({
      where: {
        dependentId_blockerId: { dependentId: projectId, blockerId },
      },
    });

    if (!dependency) {
      throw new NotFoundException('Blocker relationship not found');
    }

    await this.prisma.projectDependency.delete({
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

      // Get all projects that block the current project
      const blockers = await this.prisma.projectDependency.findMany({
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
    // Find all projects that were blocked only by this project
    const dependents = await this.prisma.projectDependency.findMany({
      where: { blockerId },
      select: { dependentId: true },
    });

    const unblockedIds: string[] = [];

    for (const dep of dependents) {
      // Check if this dependent has any other incomplete blockers
      const otherBlockers = await this.prisma.projectDependency.count({
        where: {
          dependentId: dep.dependentId,
          blockerId: { not: blockerId },
          blocker: {
            statusId: { notIn: ['status-done', 'status-completed'] },
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
