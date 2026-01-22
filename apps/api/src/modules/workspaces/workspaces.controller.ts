import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, Workspace } from '@goals/database';

type UserWithoutPassword = Omit<User, 'passwordHash'>;
type WorkspaceWithRole = Workspace & { role: string };

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Get()
  async findAll(@CurrentUser() user: UserWithoutPassword): Promise<WorkspaceWithRole[]> {
    return this.workspacesService.findAllForUser(user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<Workspace | null> {
    return this.workspacesService.findById(id, user.id);
  }

  @Post()
  async create(
    @CurrentUser() user: UserWithoutPassword,
    @Body() data: { name: string; type: 'personal' | 'family' }
  ): Promise<Workspace> {
    return this.workspacesService.create(user.id, data);
  }

  @Post(':id/invite')
  async invite(
    @Param('id') id: string,
    @Body('email') email: string,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<{ message: string }> {
    return this.workspacesService.invite(id, email, user.id);
  }
}
