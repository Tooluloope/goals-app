import { Controller, Get, Put, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ConfigService } from './config.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateWorkspaceConfigDto } from '@goals/shared';
import { User, WorkspaceConfig } from '@goals/database';

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
