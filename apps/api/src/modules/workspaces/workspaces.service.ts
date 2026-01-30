import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { UsageService } from '../usage/usage.service';
import { DEFAULT_WORKSPACE_CONFIG } from '@goals/shared';
import { Workspace, WorkspaceInvite } from '@goals/database';
import { randomBytes } from 'crypto';

type WorkspaceWithRole = Workspace & { role: string };

@Injectable()
export class WorkspacesService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private subscriptionsService: SubscriptionsService,
    private usageService: UsageService
  ) {}

  async findAllForUser(userId: string): Promise<WorkspaceWithRole[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: true,
      },
    });

    // Hide other people's personal workspaces; keep user's own personal + any shared non-personal workspaces.
    return memberships
      .filter((m) => m.workspace.type !== 'personal' || m.workspace.ownerId === userId)
      .map((m) => ({
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
    // Check if user can create family workspace
    if (data.type === 'family') {
      const canCreateFamily = await this.subscriptionsService.canCreateFamilyWorkspace(userId);
      if (!canCreateFamily) {
        throw new ForbiddenException(
          'Family workspaces require the FAMILY plan. Please upgrade your subscription.'
        );
      }
    }

    // Check workspace quota
    await this.usageService.enforceQuota(userId, 'workspaces');

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

    // Increment usage counter
    await this.usageService.incrementUsage(userId, 'workspaces');

    return workspace;
  }

  async update(workspaceId: string, userId: string, data: { name?: string }): Promise<Workspace> {
    // Only owner or admin can update workspace
    await this.verifyAccess(workspaceId, userId, ['owner', 'admin']);

    if (!data.name || data.name.trim().length === 0) {
      throw new BadRequestException('Workspace name is required');
    }

    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { name: data.name.trim() },
    });
  }

  async invite(
    workspaceId: string,
    email: string,
    inviterId: string
  ): Promise<{ message: string; inviteId: string }> {
    await this.verifyAccess(workspaceId, inviterId, ['owner', 'admin']);

    // Check if user is already a member
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId: existingUser.id },
        },
      });

      if (existingMember) {
        throw new BadRequestException('User is already a member of this workspace');
      }
    }

    // Check for existing pending invite
    const existingInvite = await this.prisma.workspaceInvite.findUnique({
      where: {
        workspaceId_email: { workspaceId, email },
      },
    });

    if (existingInvite && existingInvite.status === 'pending') {
      throw new BadRequestException('An invite has already been sent to this email');
    }

    // Get workspace and inviter details
    const [workspace, inviter] = await Promise.all([
      this.prisma.workspace.findUnique({ where: { id: workspaceId } }),
      this.prisma.user.findUnique({ where: { id: inviterId } }),
    ]);

    if (!workspace || !inviter) {
      throw new NotFoundException('Workspace or inviter not found');
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex');

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create or update invite record
    const invite = await this.prisma.workspaceInvite.upsert({
      where: {
        workspaceId_email: { workspaceId, email },
      },
      update: {
        token,
        invitedById: inviterId,
        status: 'pending',
        expiresAt,
      },
      create: {
        workspaceId,
        email,
        token,
        invitedById: inviterId,
        expiresAt,
      },
    });

    // Send invite email
    await this.emailService.sendWorkspaceInviteEmail(email, inviter.name, workspace.name, token);

    return { message: 'Invite sent successfully', inviteId: invite.id };
  }

  async acceptInvite(token: string, userId: string): Promise<{ workspaceId: string }> {
    const invite = await this.prisma.workspaceInvite.findUnique({
      where: { token },
      include: { workspace: true },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.status !== 'pending') {
      throw new BadRequestException('This invite is no longer valid');
    }

    if (new Date() > invite.expiresAt) {
      // Mark as expired
      await this.prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: { status: 'expired' },
      });
      throw new BadRequestException('This invite has expired');
    }

    // Verify the user's email matches the invite
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email !== invite.email) {
      throw new ForbiddenException('This invite was sent to a different email address');
    }

    // Check if user is already a member
    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId: invite.workspaceId, userId },
      },
    });

    if (existingMember) {
      // Mark invite as accepted anyway
      await this.prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: { status: 'accepted', acceptedAt: new Date() },
      });
      throw new BadRequestException('You are already a member of this workspace');
    }

    // Add user to workspace and mark invite as accepted
    await this.prisma.$transaction([
      this.prisma.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId,
          role: invite.role,
        },
      }),
      this.prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: { status: 'accepted', acceptedAt: new Date() },
      }),
    ]);

    return { workspaceId: invite.workspaceId };
  }

  async cancelInvite(inviteId: string, userId: string): Promise<void> {
    const invite = await this.prisma.workspaceInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    await this.verifyAccess(invite.workspaceId, userId, ['owner', 'admin']);

    if (invite.status !== 'pending') {
      throw new BadRequestException('This invite is no longer pending');
    }

    await this.prisma.workspaceInvite.update({
      where: { id: inviteId },
      data: { status: 'cancelled' },
    });
  }

  async resendInvite(inviteId: string, userId: string): Promise<{ message: string }> {
    const invite = await this.prisma.workspaceInvite.findUnique({
      where: { id: inviteId },
      include: { workspace: true },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    await this.verifyAccess(invite.workspaceId, userId, ['owner', 'admin']);

    if (invite.status !== 'pending') {
      throw new BadRequestException('This invite is no longer pending');
    }

    // Get inviter details
    const inviter = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!inviter) {
      throw new NotFoundException('User not found');
    }

    // Generate new token and extend expiration
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Update invite with new token and expiration
    await this.prisma.workspaceInvite.update({
      where: { id: inviteId },
      data: { token, expiresAt },
    });

    // Resend email
    await this.emailService.sendWorkspaceInviteEmail(
      invite.email,
      inviter.name,
      invite.workspace.name,
      token
    );

    return { message: 'Invite resent successfully' };
  }

  async getPendingInvites(workspaceId: string, userId: string): Promise<WorkspaceInvite[]> {
    await this.verifyAccess(workspaceId, userId, ['owner', 'admin']);

    return this.prisma.workspaceInvite.findMany({
      where: {
        workspaceId,
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInviteByToken(token: string): Promise<WorkspaceInvite & { workspace: Workspace }> {
    const invite = await this.prisma.workspaceInvite.findUnique({
      where: { token },
      include: { workspace: true },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    return invite;
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
