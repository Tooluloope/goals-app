import { Controller, Get, Post, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User, Workspace, WorkspaceInvite } from '@goals/database';

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
  ): Promise<{ message: string; inviteId: string }> {
    return this.workspacesService.invite(id, email, user.id);
  }

  @Get(':id/invites')
  async getPendingInvites(
    @Param('id') id: string,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<WorkspaceInvite[]> {
    return this.workspacesService.getPendingInvites(id, user.id);
  }

  @Delete('invites/:inviteId')
  async cancelInvite(
    @Param('inviteId') inviteId: string,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<{ message: string }> {
    await this.workspacesService.cancelInvite(inviteId, user.id);
    return { message: 'Invite cancelled' };
  }

  @Post('invites/:inviteId/resend')
  async resendInvite(
    @Param('inviteId') inviteId: string,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<{ message: string }> {
    return this.workspacesService.resendInvite(inviteId, user.id);
  }

  @Post('invites/accept')
  async acceptInvite(
    @Body('token') token: string,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<{ workspaceId: string }> {
    return this.workspacesService.acceptInvite(token, user.id);
  }

  @Public()
  @Get('invites/preview')
  async previewInvite(
    @Query('token') token: string
  ): Promise<{ workspace: { name: string }; email: string; expiresAt: Date }> {
    const invite = await this.workspacesService.getInviteByToken(token);
    return {
      workspace: { name: invite.workspace.name },
      email: invite.email,
      expiresAt: invite.expiresAt,
    };
  }
}
