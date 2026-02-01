import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminGuard } from '../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';

import { type AdminRole, AdminService } from './admin.service';

interface UserWithoutPassword {
  id: string;
  role?: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('overview')
  getOverview(
    @CurrentUser() user: UserWithoutPassword,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('includeEmail') includeEmail?: string
  ) {
    return this.adminService.getOverview(user, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      includeEmail: includeEmail === 'true',
    });
  }

  @Patch('users/role')
  @UseGuards(SuperAdminGuard)
  updateUserRole(@Body() body: { userId: string; role: AdminRole }) {
    return this.adminService.updateUserRole(body.userId, body.role);
  }
}
