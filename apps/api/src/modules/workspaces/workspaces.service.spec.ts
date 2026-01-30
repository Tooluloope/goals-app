import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesService } from './workspaces.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { UsageService } from '../usage/usage.service';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let prisma: any;

  const mockWorkspace = {
    id: 'workspace-1',
    name: 'My Workspace',
    type: 'personal',
    ownerId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMembership = {
    id: 'member-1',
    workspaceId: 'workspace-1',
    userId: 'user-1',
    role: 'owner',
    createdAt: new Date(),
    workspace: mockWorkspace,
  };

  const mockUser = {
    id: 'user-2',
    name: 'Test User',
    email: 'test@example.com',
    avatar: null,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      workspace: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      workspaceMember: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      workspaceConfig: {
        create: jest.fn(),
      },
      workspaceInvite: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    const mockEmailService = {
      sendWorkspaceInviteEmail: jest.fn(),
    };

    const mockSubscriptionsService = {
      getOrCreateSubscription: jest.fn(),
      getSubscriptionStatus: jest.fn(),
      canCreateFamilyWorkspace: jest.fn().mockResolvedValue(true),
      getPlanLimits: jest.fn(),
    };

    const mockUsageService = {
      getUsageInfo: jest.fn(),
      canCreate: jest.fn().mockResolvedValue(true),
      enforceQuota: jest.fn(),
      incrementUsage: jest.fn(),
      decrementUsage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: SubscriptionsService, useValue: mockSubscriptionsService },
        { provide: UsageService, useValue: mockUsageService },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
    prisma = module.get(PrismaService);
  });

  describe('findAllForUser', () => {
    it('should return all workspaces for user with roles', async () => {
      prisma.workspaceMember.findMany.mockResolvedValue([
        mockMembership,
        { ...mockMembership, id: 'member-2', workspaceId: 'workspace-2', role: 'member' },
      ]);

      const result = await service.findAllForUser('user-1');

      expect(prisma.workspaceMember.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: { workspace: true },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('role', 'owner');
    });

    it('should return empty array when user has no workspaces', async () => {
      prisma.workspaceMember.findMany.mockResolvedValue([]);

      const result = await service.findAllForUser('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return workspace with members when user has access', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue(mockMembership);
      prisma.workspace.findUnique.mockResolvedValue({
        ...mockWorkspace,
        members: [{ ...mockMembership, user: mockUser }],
      });

      const result = await service.findById('workspace-1', 'user-1');

      expect(result).toHaveProperty('members');
      expect(prisma.workspace.findUnique).toHaveBeenCalledWith({
        where: { id: 'workspace-1' },
        include: expect.objectContaining({
          members: expect.any(Object),
        }),
      });
    });

    it('should throw ForbiddenException when user has no access', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.findById('workspace-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('should create workspace with owner membership and config', async () => {
      prisma.workspace.create.mockResolvedValue(mockWorkspace);
      prisma.workspaceConfig.create.mockResolvedValue({ id: 'config-1' });

      const result = await service.create('user-1', {
        name: 'My Workspace',
        type: 'personal',
      });

      expect(prisma.workspace.create).toHaveBeenCalledWith({
        data: {
          name: 'My Workspace',
          type: 'personal',
          ownerId: 'user-1',
          members: {
            create: {
              userId: 'user-1',
              role: 'owner',
            },
          },
        },
      });
      expect(prisma.workspaceConfig.create).toHaveBeenCalledWith({
        data: {
          workspaceId: 'workspace-1',
          config: expect.any(Object),
        },
      });
      expect(result).toEqual(mockWorkspace);
    });

    it('should create family workspace', async () => {
      prisma.workspace.create.mockResolvedValue({ ...mockWorkspace, type: 'family' });
      prisma.workspaceConfig.create.mockResolvedValue({ id: 'config-1' });

      await service.create('user-1', {
        name: 'Family Workspace',
        type: 'family',
      });

      expect(prisma.workspace.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'family',
        }),
      });
    });
  });

  describe('invite', () => {
    it('should invite user to workspace', async () => {
      prisma.workspaceMember.findUnique
        .mockResolvedValueOnce(mockMembership) // verifyAccess
        .mockResolvedValueOnce(null); // existing member check
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.workspaceInvite.findUnique.mockResolvedValue(null);
      prisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      prisma.workspaceInvite.upsert.mockResolvedValue({ id: 'invite-1', token: 't' });

      const result = await service.invite('workspace-1', 'test@example.com', 'user-1');

      expect(prisma.workspaceInvite.upsert).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Invite sent successfully', inviteId: 'invite-1' });
    });

    it('should throw NotFoundException when user email not found', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue(mockMembership);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.invite('workspace-1', 'nonexistent@example.com', 'user-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw when user is already a member', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.workspaceMember.findUnique
        .mockResolvedValueOnce(mockMembership) // For verifyAccess
        .mockResolvedValueOnce({ id: 'existing-member' }); // User already member

      await expect(service.invite('workspace-1', 'test@example.com', 'user-1')).rejects.toThrow(
        'already a member'
      );
    });

    it('should throw ForbiddenException when inviter lacks permission', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue({
        ...mockMembership,
        role: 'member',
      });

      await expect(service.invite('workspace-1', 'test@example.com', 'user-1')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('verifyAccess', () => {
    it('should pass when user has access', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue(mockMembership);

      await expect(service.verifyAccess('workspace-1', 'user-1')).resolves.not.toThrow();
    });

    it('should throw ForbiddenException when user has no membership', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.verifyAccess('workspace-1', 'user-1')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should pass when user has required role', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue(mockMembership);

      await expect(
        service.verifyAccess('workspace-1', 'user-1', ['owner', 'admin'])
      ).resolves.not.toThrow();
    });

    it('should throw ForbiddenException when user lacks required role', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue({
        ...mockMembership,
        role: 'member',
      });

      await expect(
        service.verifyAccess('workspace-1', 'user-1', ['owner', 'admin'])
      ).rejects.toThrow('Insufficient permissions');
    });
  });

  describe('update', () => {
    beforeEach(() => {
      prisma.workspace.update = jest.fn();
    });

    it('should update workspace name', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue(mockMembership);
      prisma.workspace.update.mockResolvedValue({ ...mockWorkspace, name: 'New Name' });

      const result = await service.update('workspace-1', 'user-1', { name: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(prisma.workspace.update).toHaveBeenCalledWith({
        where: { id: 'workspace-1' },
        data: { name: 'New Name' },
      });
    });

    it('should trim workspace name', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue(mockMembership);
      prisma.workspace.update.mockResolvedValue({ ...mockWorkspace, name: 'Trimmed Name' });

      await service.update('workspace-1', 'user-1', { name: '  Trimmed Name  ' });

      expect(prisma.workspace.update).toHaveBeenCalledWith({
        where: { id: 'workspace-1' },
        data: { name: 'Trimmed Name' },
      });
    });

    it('should throw BadRequestException for empty name', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue(mockMembership);

      await expect(service.update('workspace-1', 'user-1', { name: '' })).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException for whitespace-only name', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue(mockMembership);

      await expect(service.update('workspace-1', 'user-1', { name: '   ' })).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw ForbiddenException when user is not owner or admin', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue({
        ...mockMembership,
        role: 'member',
      });

      await expect(service.update('workspace-1', 'user-1', { name: 'New Name' })).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('acceptInvite', () => {
    const mockInvite = {
      id: 'invite-1',
      workspaceId: 'workspace-1',
      email: 'test@example.com',
      token: 'valid-token',
      status: 'pending',
      role: 'member',
      expiresAt: new Date(Date.now() + 86400000), // tomorrow
      workspace: mockWorkspace,
    };

    beforeEach(() => {
      prisma.workspaceInvite.update = jest.fn();
      prisma.$transaction = jest.fn();
    });

    it('should accept valid invite', async () => {
      prisma.workspaceInvite.findUnique.mockResolvedValue(mockInvite);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.workspaceMember.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockResolvedValue([{}, {}]);

      const result = await service.acceptInvite('valid-token', 'user-2');

      expect(result.workspaceId).toBe('workspace-1');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid token', async () => {
      prisma.workspaceInvite.findUnique.mockResolvedValue(null);

      await expect(service.acceptInvite('invalid-token', 'user-2')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException for already used invite', async () => {
      prisma.workspaceInvite.findUnique.mockResolvedValue({
        ...mockInvite,
        status: 'accepted',
      });

      await expect(service.acceptInvite('valid-token', 'user-2')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException for expired invite', async () => {
      prisma.workspaceInvite.findUnique.mockResolvedValue({
        ...mockInvite,
        expiresAt: new Date(Date.now() - 86400000), // yesterday
      });
      prisma.workspaceInvite.update.mockResolvedValue({});

      await expect(service.acceptInvite('valid-token', 'user-2')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw ForbiddenException for email mismatch', async () => {
      prisma.workspaceInvite.findUnique.mockResolvedValue(mockInvite);
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        email: 'different@example.com',
      });

      await expect(service.acceptInvite('valid-token', 'user-2')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw BadRequestException if user is already a member', async () => {
      prisma.workspaceInvite.findUnique.mockResolvedValue(mockInvite);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.workspaceMember.findUnique.mockResolvedValue({ id: 'existing-member' });
      prisma.workspaceInvite.update.mockResolvedValue({});

      await expect(service.acceptInvite('valid-token', 'user-2')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('cancelInvite', () => {
    const mockInvite = {
      id: 'invite-1',
      workspaceId: 'workspace-1',
      status: 'pending',
    };

    beforeEach(() => {
      prisma.workspaceInvite.update = jest.fn();
    });

    it('should cancel pending invite', async () => {
      prisma.workspaceInvite.findUnique.mockResolvedValue(mockInvite);
      prisma.workspaceMember.findUnique.mockResolvedValue(mockMembership);
      prisma.workspaceInvite.update.mockResolvedValue({});

      await service.cancelInvite('invite-1', 'user-1');

      expect(prisma.workspaceInvite.update).toHaveBeenCalledWith({
        where: { id: 'invite-1' },
        data: { status: 'cancelled' },
      });
    });

    it('should throw NotFoundException for invalid invite', async () => {
      prisma.workspaceInvite.findUnique.mockResolvedValue(null);

      await expect(service.cancelInvite('invalid-invite', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException for non-pending invite', async () => {
      prisma.workspaceInvite.findUnique.mockResolvedValue({
        ...mockInvite,
        status: 'accepted',
      });
      prisma.workspaceMember.findUnique.mockResolvedValue(mockMembership);

      await expect(service.cancelInvite('invite-1', 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('resendInvite', () => {
    const mockInvite = {
      id: 'invite-1',
      workspaceId: 'workspace-1',
      email: 'test@example.com',
      status: 'pending',
      workspace: mockWorkspace,
    };

    beforeEach(() => {
      prisma.workspaceInvite.update = jest.fn();
    });

    it('should resend invite with new token', async () => {
      prisma.workspaceInvite.findUnique.mockResolvedValue(mockInvite);
      prisma.workspaceMember.findUnique.mockResolvedValue(mockMembership);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Inviter Name',
        email: 'inviter@example.com',
      });
      prisma.workspaceInvite.update.mockResolvedValue({});

      const result = await service.resendInvite('invite-1', 'user-1');

      expect(result.message).toBe('Invite resent successfully');
      expect(prisma.workspaceInvite.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid invite', async () => {
      prisma.workspaceInvite.findUnique.mockResolvedValue(null);

      await expect(service.resendInvite('invalid-invite', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException for non-pending invite', async () => {
      prisma.workspaceInvite.findUnique.mockResolvedValue({
        ...mockInvite,
        status: 'accepted',
      });
      prisma.workspaceMember.findUnique.mockResolvedValue(mockMembership);

      await expect(service.resendInvite('invite-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when inviter not found', async () => {
      prisma.workspaceInvite.findUnique.mockResolvedValue(mockInvite);
      prisma.workspaceMember.findUnique.mockResolvedValue(mockMembership);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.resendInvite('invite-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPendingInvites', () => {
    beforeEach(() => {
      prisma.workspaceInvite.findMany = jest.fn();
    });

    it('should return pending invites', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue(mockMembership);
      prisma.workspaceInvite.findMany.mockResolvedValue([
        { id: 'invite-1', email: 'test@example.com', status: 'pending' },
      ]);

      const result = await service.getPendingInvites('workspace-1', 'user-1');

      expect(result).toHaveLength(1);
      expect(prisma.workspaceInvite.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'workspace-1', status: 'pending' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should throw ForbiddenException when user lacks permission', async () => {
      prisma.workspaceMember.findUnique.mockResolvedValue({
        ...mockMembership,
        role: 'member',
      });

      await expect(service.getPendingInvites('workspace-1', 'user-1')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('getInviteByToken', () => {
    it('should return invite with workspace', async () => {
      prisma.workspaceInvite.findUnique.mockResolvedValue({
        id: 'invite-1',
        token: 'valid-token',
        workspace: mockWorkspace,
      });

      const result = await service.getInviteByToken('valid-token');

      expect(result.id).toBe('invite-1');
      expect(result.workspace).toBeDefined();
    });

    it('should throw NotFoundException for invalid token', async () => {
      prisma.workspaceInvite.findUnique.mockResolvedValue(null);

      await expect(service.getInviteByToken('invalid-token')).rejects.toThrow(NotFoundException);
    });
  });

  describe('invite - additional cases', () => {
    it('should throw BadRequestException for existing pending invite', async () => {
      prisma.workspaceMember.findUnique
        .mockResolvedValueOnce(mockMembership) // verifyAccess
        .mockResolvedValueOnce(null); // existing member check
      prisma.user.findUnique.mockResolvedValue(null); // User doesn't exist yet
      prisma.workspaceInvite.findUnique.mockResolvedValue({
        id: 'existing-invite',
        status: 'pending',
      });

      await expect(service.invite('workspace-1', 'new@example.com', 'user-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('findAllForUser - filter personal workspaces', () => {
    it('should filter out other users personal workspaces', async () => {
      prisma.workspaceMember.findMany.mockResolvedValue([
        {
          ...mockMembership,
          workspace: { ...mockWorkspace, type: 'personal', ownerId: 'user-1' },
        },
        {
          ...mockMembership,
          id: 'member-2',
          workspace: { ...mockWorkspace, id: 'ws-2', type: 'personal', ownerId: 'other-user' },
        },
        {
          ...mockMembership,
          id: 'member-3',
          workspace: { ...mockWorkspace, id: 'ws-3', type: 'family' },
        },
      ]);

      const result = await service.findAllForUser('user-1');

      // Should only return user's own personal workspace and the family workspace
      expect(result).toHaveLength(2);
      expect(result.map((w) => w.id)).toContain('workspace-1');
      expect(result.map((w) => w.id)).toContain('ws-3');
      expect(result.map((w) => w.id)).not.toContain('ws-2');
    });
  });
});
