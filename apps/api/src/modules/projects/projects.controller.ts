import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';

import type { Project, ProjectDependency, User } from '@goals/database';
import { AddReviewDto, CreateProjectDto, UpdateProjectDto } from '@goals/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { ProjectsService } from './projects.service';

type UserWithoutPassword = Omit<User, 'passwordHash'>;

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get('workspace/:workspaceId')
  findAllForWorkspace(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<Project[]> {
    return this.projectsService.findAllForWorkspace(workspaceId, user.id);
  }

  @Get('user')
  findAllForUser(@CurrentUser() user: UserWithoutPassword): Promise<Project[]> {
    return this.projectsService.findAllForUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: UserWithoutPassword): Promise<Project> {
    return this.projectsService.findById(id, user.id);
  }

  @Post()
  create(
    @Body() data: CreateProjectDto,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<Project> {
    return this.projectsService.create(data, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateProjectDto,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<Project> {
    return this.projectsService.update(id, data, user.id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('statusId') statusId: string,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<Project> {
    return this.projectsService.updateStatus(id, statusId, user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: UserWithoutPassword): Promise<void> {
    return this.projectsService.delete(id, user.id);
  }

  @Post(':id/requirements')
  addRequirement(
    @Param('id') id: string,
    @Body('text') text: string,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<Project> {
    return this.projectsService.addRequirement(id, text, user.id);
  }

  @Patch(':id/requirements/:itemId/toggle')
  toggleRequirement(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<Project> {
    return this.projectsService.toggleRequirement(id, itemId, user.id);
  }

  @Post(':id/definition-of-done')
  addDefinitionOfDone(
    @Param('id') id: string,
    @Body('text') text: string,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<Project> {
    return this.projectsService.addDefinitionOfDone(id, text, user.id);
  }

  @Patch(':id/definition-of-done/:itemId/toggle')
  toggleDefinitionOfDone(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<Project> {
    return this.projectsService.toggleDefinitionOfDone(id, itemId, user.id);
  }

  @Post(':id/reviews')
  addReview(
    @Body() data: AddReviewDto,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<Project> {
    return this.projectsService.addReview(data, user.id);
  }

  // ============================================================
  // BLOCKER MANAGEMENT
  // ============================================================

  @Get(':id/blockers')
  getBlockers(
    @Param('id') id: string,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<{ blockedBy: ProjectDependency[]; blocking: ProjectDependency[] }> {
    return this.projectsService.getBlockers(id, user.id);
  }

  @Post(':id/blockers')
  addBlocker(
    @Param('id') id: string,
    @Body('blockerId') blockerId: string,
    @Body('note') note: string | undefined,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<ProjectDependency> {
    return this.projectsService.addBlocker(id, blockerId, user.id, note);
  }

  @Delete(':id/blockers/:blockerId')
  removeBlocker(
    @Param('id') id: string,
    @Param('blockerId') blockerId: string,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<void> {
    return this.projectsService.removeBlocker(id, blockerId, user.id);
  }
}
