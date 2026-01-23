import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateUserSettingsDto } from '@goals/shared';
import { User } from '@goals/database';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
