import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { UpdateWorkspaceConfigDto, DEFAULT_WORKSPACE_CONFIG } from '@goals/shared';
import { WorkspaceConfig } from '@goals/database';

@Injectable()
export class ConfigService {
  constructor(
    private prisma: PrismaService,
    private workspacesService: WorkspacesService
  ) {}

  async getForWorkspace(workspaceId: string, userId: string): Promise<WorkspaceConfig> {
    await this.workspacesService.verifyAccess(workspaceId, userId);

    const config = await this.prisma.workspaceConfig.findUnique({
      where: { workspaceId },
    });

    if (!config) {
      // Create default config if it doesn't exist
      return this.prisma.workspaceConfig.create({
        data: {
          workspaceId,
          config: DEFAULT_WORKSPACE_CONFIG as any,
        },
      });
    }

    return config;
  }

  async update(
    workspaceId: string,
    updates: UpdateWorkspaceConfigDto,
    userId: string
  ): Promise<WorkspaceConfig> {
    await this.workspacesService.verifyAccess(workspaceId, userId, ['owner', 'admin']);

    const existing = await this.prisma.workspaceConfig.findUnique({
      where: { workspaceId },
    });

    if (!existing) {
      throw new NotFoundException('Config not found');
    }

    const currentConfig = existing.config as Record<string, any>;
    const updatedConfig = { ...currentConfig, ...updates };

    return this.prisma.workspaceConfig.update({
      where: { workspaceId },
      data: { config: updatedConfig },
    });
  }

  async reset(workspaceId: string, userId: string): Promise<WorkspaceConfig> {
    await this.workspacesService.verifyAccess(workspaceId, userId, ['owner', 'admin']);

    return this.prisma.workspaceConfig.update({
      where: { workspaceId },
      data: { config: DEFAULT_WORKSPACE_CONFIG as any },
    });
  }
}
