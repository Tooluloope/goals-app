import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';

import type { User, WorkspaceConfig } from '@goals/database';
import { UpdateWorkspaceConfigDto } from '@goals/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { ConfigService } from './config.service';

type UserWithoutPassword = Omit<User, 'passwordHash'>;

@Controller('config')
@UseGuards(JwtAuthGuard)
export class ConfigController {
  constructor(private configService: ConfigService) {}

  @Get('workspace/:workspaceId')
  getForWorkspace(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<WorkspaceConfig> {
    return this.configService.getForWorkspace(workspaceId, user.id);
  }

  @Put('workspace/:workspaceId')
  update(
    @Param('workspaceId') workspaceId: string,
    @Body() updates: UpdateWorkspaceConfigDto,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<WorkspaceConfig> {
    return this.configService.update(workspaceId, updates, user.id);
  }

  @Post('workspace/:workspaceId/reset')
  reset(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<WorkspaceConfig> {
    return this.configService.reset(workspaceId, user.id);
  }
}
