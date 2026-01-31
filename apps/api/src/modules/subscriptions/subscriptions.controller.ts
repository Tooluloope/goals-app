import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  /**
   * Get current subscription status
   * GET /api/subscriptions/status
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Req() req: Request & { user: { id: string } }) {
    const { id } = req.user;
    return this.subscriptionsService.getSubscriptionStatus(id);
  }

  /**
   * Get plan limits
   * GET /api/subscriptions/limits
   */
  @Get('limits')
  @UseGuards(JwtAuthGuard)
  async getLimits(@Req() req: Request & { user: { id: string } }) {
    const { id } = req.user;
    return this.subscriptionsService.getPlanLimits(id);
  }
}
