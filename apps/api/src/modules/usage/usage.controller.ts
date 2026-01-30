import { Controller, Get, UseGuards, Req, Post } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsageService } from './usage.service';
import { Request } from 'express';

@Controller('usage')
export class UsageController {
  constructor(private usageService: UsageService) {}

  /**
   * Get current usage information
   * GET /api/usage
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getUsage(@Req() req: Request & { user: { userId: string } }) {
    const { userId } = req.user;
    return this.usageService.getUsageInfo(userId);
  }

  /**
   * Sync usage counts from database
   * POST /api/usage/sync
   */
  @Post('sync')
  @UseGuards(JwtAuthGuard)
  async syncUsage(@Req() req: Request & { user: { userId: string } }) {
    const { userId } = req.user;
    await this.usageService.syncUsageCounts(userId);
    return { success: true, message: 'Usage counts synchronized' };
  }
}
