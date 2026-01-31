import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import type { User } from '@goals/database';
import { UpdateUserSettingsDto } from '@goals/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

type UserWithoutPassword = Omit<User, 'passwordHash'>;

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: UserWithoutPassword): Promise<UserWithoutPassword> {
    return this.usersService.findById(user.id);
  }

  @Patch('me/settings')
  async updateSettings(
    @CurrentUser() user: UserWithoutPassword,
    @Body() settings: UpdateUserSettingsDto
  ): Promise<UserWithoutPassword> {
    return this.usersService.updateSettings(user.id, settings);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: UserWithoutPassword,
    @Body() data: UpdateProfileDto
  ): Promise<UserWithoutPassword> {
    return this.usersService.updateProfile(user.id, data);
  }
}
