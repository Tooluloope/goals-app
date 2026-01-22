import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_WORKSPACE_CONFIG } from '@goals/shared';
import { Workspace } from '@goals/database';

type WorkspaceWithRole = Workspace & { role: string };

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async findAllForUser(userId: string): Promise<WorkspaceWithRole[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: true,
      },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
    }));
  }

  async findById(id: string, userId: string): Promise<Workspace | null> {
    await this.verifyAccess(id, userId);

    return this.prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  async create(
    userId: string,
    data: { name: string; type: 'personal' | 'family' }
  ): Promise<Workspace> {
    const workspace = await this.prisma.workspace.create({
      data: {
        name: data.name,
        type: data.type,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
    });

    // Create default config
    await this.prisma.workspaceConfig.create({
      data: {
        workspaceId: workspace.id,
        config: DEFAULT_WORKSPACE_CONFIG as any,
      },
    });

    return workspace;
  }

  async invite(
    workspaceId: string,
    email: string,
    inviterId: string
  ): Promise<{ message: string }> {
    await this.verifyAccess(workspaceId, inviterId, ['owner', 'admin']);

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: user.id },
      },
    });

    if (existing) {
      throw new ForbiddenException('User is already a member');
    }

    await this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role: 'member',
      },
    });

    return { message: 'User invited successfully' };
  }

  async verifyAccess(workspaceId: string, userId: string, roles?: string[]): Promise<void> {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied');
    }

    if (roles && !roles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
