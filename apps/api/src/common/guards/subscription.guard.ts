import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { SubscriptionPlan } from '../../modules/subscriptions/subscriptions.service';
import { SubscriptionsService } from '../../modules/subscriptions/subscriptions.service';
import { REQUIRES_PLAN_KEY } from '../decorators/requires-plan.decorator';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionsService: SubscriptionsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlan = this.reflector.getAllAndOverride<SubscriptionPlan>(REQUIRES_PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPlan) {
      return true; // No plan requirement specified
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      return false; // User not authenticated
    }

    // Will throw ForbiddenException if plan requirement not met
    await this.subscriptionsService.enforceplan(user.userId, requiredPlan);

    return true;
  }
}
