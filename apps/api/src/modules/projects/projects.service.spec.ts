import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prismaService: any;
  let workspacesService: any;
  let notificationsService: any;

  const mockProject = {
    id: 'project-1',
    name: 'Test Project',
    description: 'Test Description',
    workspaceId: 'workspace-1',
    statusId: 'status-doing',
    areaId: 'area-1',
    priority: 1,
    startDate: new Date(),
    targetDate: new Date(),
    actualEndDate: null,
    lastReviewDate: null,
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    checklistItems: [],
    tasks: [],
    metrics: { id: 'metrics-1' } as any,
    reviewNotes: [],
    blockedBy: [],
    blocking: [],
  };

  const mockWorkspace = {
    id: 'workspace-1',
    name: 'Test Workspace',
    type: 'personal',
    ownerId: 'user-1',
    members: [{ userId: 'user-1' }],
  };

  beforeEach(async () => {
    const mockPrismaService = {
      project: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      } as any,
      checklistItem: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn(),
      } as any,
      reviewNote: {
        create: jest.fn(),
      } as any,
      projectDependency: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      } as any,
      workspace: {
        findUnique: jest.fn(),
      } as any,
      $transaction: jest.fn(),
    };

    const mockWorkspacesService = {
      verifyAccess: jest.fn(),
      findAllForUser: jest.fn(),
    };

    const mockNotificationsService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrismaService } as any,
        { provide: WorkspacesService, useValue: mockWorkspacesService } as any,
        { provide: NotificationsService, useValue: mockNotificationsService } as any,
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prismaService = module.get(PrismaService);
    workspacesService = module.get(WorkspacesService);
    notificationsService = module.get(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllForWorkspace', () => {
    it('should return all projects for a workspace', async () => {
      workspacesService.verifyAccess.mockResolvedValue(undefined);
      prismaService.project.findMany.mockResolvedValue([mockProject]);

      const result = await service.findAllForWorkspace('workspace-1', 'user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockProject.id);
      expect(workspacesService.verifyAccess).toHaveBeenCalledWith('workspace-1', 'user-1');
    });
  });

  describe('findAllForUser', () => {
    it('should return all projects across user workspaces', async () => {
      workspacesService.findAllForUser.mockResolvedValue([mockWorkspace]);
      prismaService.project.findMany.mockResolvedValue([mockProject]);

      const result = await service.findAllForUser('user-1');

      expect(result).toHaveLength(1);
      expect(workspacesService.findAllForUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('findById', () => {
    it('should return a project by id', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      workspacesService.verifyAccess.mockResolvedValue(undefined);

      const result = await service.findById('project-1', 'user-1');

      expect(result.id).toBe(mockProject.id);
    });

    it('should throw NotFoundException if project not found', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new project', async () => {
      workspacesService.verifyAccess.mockResolvedValue(undefined);
      prismaService.project.create.mockResolvedValue(mockProject);

      const result = await service.create(
        {
          name: 'New Project',
          description: 'Description',
          workspaceId: 'workspace-1',
          statusId: 'status-doing',
          areaId: 'area-1',
          priority: 1,
          startDate: '2024-01-01',
          targetDate: '2024-12-31',
        } as any,
        'user-1'
      );

      expect(result.id).toBe(mockProject.id);
      expect(workspacesService.verifyAccess).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      workspacesService.verifyAccess.mockResolvedValue(undefined);
      const updatedProject = { ...mockProject, name: 'Updated Name' };
      prismaService.project.update.mockResolvedValue(updatedProject);

      const result = await service.update('project-1', { name: 'Updated Name' }, 'user-1');

      expect(result.name).toBe('Updated Name');
    });
  });

  describe('updateStatus', () => {
    it('should update project status', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      workspacesService.verifyAccess.mockResolvedValue(undefined);
      prismaService.project.update.mockResolvedValue({ ...mockProject, statusId: 'status-done' });
      prismaService.projectDependency.findMany.mockResolvedValue([]);

      const result = await service.updateStatus('project-1', 'status-done', 'user-1');

      expect(result.statusId).toBe('status-done');
    });

    it('should notify dependents when project is completed', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      workspacesService.verifyAccess.mockResolvedValue(undefined);
      prismaService.project.update.mockResolvedValue({ ...mockProject, statusId: 'status-done' });
      prismaService.projectDependency.findMany.mockResolvedValue([
        {
          id: 'dep-1',
          dependentId: 'project-2',
          blockerId: 'project-1',
          dependent: {
            id: 'project-2',
            name: 'Dependent Project',
            workspaceId: 'workspace-1',
          } as any,
        } as any,
      ]);
      prismaService.projectDependency.count.mockResolvedValue(0);
      prismaService.workspace.findUnique.mockResolvedValue(mockWorkspace);

      await service.updateStatus('project-1', 'status-done', 'user-1');

      expect(notificationsService.create).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a project', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      workspacesService.verifyAccess.mockResolvedValue(undefined);
      prismaService.project.delete.mockResolvedValue(mockProject);

      await service.delete('project-1', 'user-1');

      expect(prismaService.project.delete).toHaveBeenCalledWith({ where: { id: 'project-1' } });
    });
  });

  describe('addRequirement', () => {
    it('should add a requirement to a project', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      workspacesService.verifyAccess.mockResolvedValue(undefined);
      prismaService.checklistItem.aggregate.mockResolvedValue({ _max: { order: 0 } });
      prismaService.checklistItem.create.mockResolvedValue({
        id: 'item-1',
        text: 'New Requirement',
        type: 'requirement',
        completed: false,
        order: 1,
      });

      await service.addRequirement('project-1', 'New Requirement', 'user-1');

      expect(prismaService.checklistItem.create).toHaveBeenCalled();
    });
  });

  describe('toggleRequirement', () => {
    it('should toggle a requirement completed status', async () => {
      const mockItem = { id: 'item-1', completed: false, projectId: 'project-1' };
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      workspacesService.verifyAccess.mockResolvedValue(undefined);
      prismaService.checklistItem.findUnique.mockResolvedValue(mockItem);
      prismaService.checklistItem.update.mockResolvedValue({ ...mockItem, completed: true });

      await service.toggleRequirement('project-1', 'item-1', 'user-1');

      expect(prismaService.checklistItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' } as any,
        data: { completed: true } as any,
      });
    });

    it('should throw NotFoundException if item not found', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      workspacesService.verifyAccess.mockResolvedValue(undefined);
      prismaService.checklistItem.findUnique.mockResolvedValue(null);

      await expect(service.toggleRequirement('project-1', 'nonexistent', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('addBlocker', () => {
    it('should add a blocker relationship', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      workspacesService.verifyAccess.mockResolvedValue(undefined);
      prismaService.projectDependency.findUnique.mockResolvedValue(null);
      prismaService.projectDependency.findMany.mockResolvedValue([]);
      prismaService.projectDependency.create.mockResolvedValue({
        id: 'dep-1',
        dependentId: 'project-1',
        blockerId: 'project-2',
        blocker: { id: 'project-2', name: 'Blocker', statusId: 'status-doing' } as any,
        dependent: mockProject,
      });

      const result = await service.addBlocker('project-1', 'project-2', 'user-1');

      expect(result.blockerId).toBe('project-2');
    });

    it('should throw BadRequestException for self-blocking', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      workspacesService.verifyAccess.mockResolvedValue(undefined);

      await expect(service.addBlocker('project-1', 'project-1', 'user-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if relationship already exists', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      workspacesService.verifyAccess.mockResolvedValue(undefined);
      prismaService.projectDependency.findUnique.mockResolvedValue({ id: 'existing' });
      prismaService.projectDependency.findMany.mockResolvedValue([]);

      await expect(service.addBlocker('project-1', 'project-2', 'user-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('removeBlocker', () => {
    it('should remove a blocker relationship', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      workspacesService.verifyAccess.mockResolvedValue(undefined);
      prismaService.projectDependency.findUnique.mockResolvedValue({
        id: 'dep-1',
        dependentId: 'project-1',
        blockerId: 'project-2',
      });
      prismaService.projectDependency.delete.mockResolvedValue({} as any);

      await service.removeBlocker('project-1', 'project-2', 'user-1');

      expect(prismaService.projectDependency.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if relationship not found', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      workspacesService.verifyAccess.mockResolvedValue(undefined);
      prismaService.projectDependency.findUnique.mockResolvedValue(null);

      await expect(service.removeBlocker('project-1', 'project-2', 'user-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getUnblockedDependents', () => {
    it('should return projects that are fully unblocked', async () => {
      prismaService.projectDependency.findMany.mockResolvedValue([
        { dependentId: 'project-2' } as any,
      ]);
      prismaService.projectDependency.count.mockResolvedValue(0);

      const result = await service.getUnblockedDependents('project-1');

      expect(result).toContain('project-2');
    });

    it('should not return projects with other blockers', async () => {
      prismaService.projectDependency.findMany.mockResolvedValue([
        { dependentId: 'project-2' } as any,
      ]);
      prismaService.projectDependency.count.mockResolvedValue(1);

      const result = await service.getUnblockedDependents('project-1');

      expect(result).not.toContain('project-2');
    });
  });
});
