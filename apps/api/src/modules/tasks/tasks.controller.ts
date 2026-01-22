import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateTaskDto, UpdateTaskDto, CompleteRecurringTaskDto } from '@goals/shared';
import { User, Task } from '@goals/database';

type UserWithoutPassword = Omit<User, 'passwordHash'>;

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  findAll(@CurrentUser() user: UserWithoutPassword): Promise<Task[]> {
    return this.tasksService.findAllForUser(user.id);
  }

  @Post()
  create(@Body() data: CreateTaskDto, @CurrentUser() user: UserWithoutPassword): Promise<Task> {
    return this.tasksService.create(data, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateTaskDto,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<Task> {
    return this.tasksService.update(id, data, user.id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('statusId') statusId: string,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<Task> {
    return this.tasksService.updateStatus(id, statusId, user.id);
  }

  @Post(':id/complete-recurring')
  completeRecurring(
    @Param('id') id: string,
    @Body() data: CompleteRecurringTaskDto,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<{ completedTask: Task; nextTask?: Task }> {
    return this.tasksService.completeRecurringTask(id, user.id, data.createNextOccurrence ?? true);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: UserWithoutPassword): Promise<void> {
    return this.tasksService.delete(id, user.id);
  }
}
