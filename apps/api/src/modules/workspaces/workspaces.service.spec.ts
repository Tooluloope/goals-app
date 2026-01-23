import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesService } from './workspaces.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

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
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkspacesService, { provide: PrismaService, useValue: mockPrismaService }],
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
    beforeEach(() => {
      prisma.workspaceMember.findUnique.mockResolvedValue(mockMembership);
    });

    it('should invite user to workspace', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.workspaceMember.findUnique
        .mockResolvedValueOnce(mockMembership) // For verifyAccess
        .mockResolvedValueOnce(null); // For existing check
      prisma.workspaceMember.create.mockResolvedValue({
        id: 'member-new',
        workspaceId: 'workspace-1',
        userId: 'user-2',
        role: 'member',
      });

      const result = await service.invite('workspace-1', 'test@example.com', 'user-1');

      expect(prisma.workspaceMember.create).toHaveBeenCalledWith({
        data: {
          workspaceId: 'workspace-1',
          userId: 'user-2',
          role: 'member',
        },
      });
      expect(result).toEqual({ message: 'User invited successfully' });
    });

    it('should throw NotFoundException when user email not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.invite('workspace-1', 'nonexistent@example.com', 'user-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is already a member', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.workspaceMember.findUnique
        .mockResolvedValueOnce(mockMembership) // For verifyAccess
        .mockResolvedValueOnce({ id: 'existing-member' }); // User already member

      await expect(service.invite('workspace-1', 'test@example.com', 'user-1')).rejects.toThrow(
        ForbiddenException
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
});
