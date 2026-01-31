import { Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';

import type { Notification, User } from '@goals/database';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { NotificationsService } from './notifications.service';

type UserWithoutPassword = Omit<User, 'passwordHash'>;

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: UserWithoutPassword): Promise<Notification[]> {
    return this.notificationsService.findAllForUser(user.id);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: UserWithoutPassword): Promise<number> {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: UserWithoutPassword
  ): Promise<Notification> {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: UserWithoutPassword): Promise<void> {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: UserWithoutPassword): Promise<void> {
    return this.notificationsService.delete(id, user.id);
  }
}
