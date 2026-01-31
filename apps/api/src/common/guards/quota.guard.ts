import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { ResourceType } from '../../modules/usage/usage.service';
import { UsageService } from '../../modules/usage/usage.service';
import { CHECK_QUOTA_KEY } from '../decorators/check-quota.decorator';

@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usageService: UsageService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resourceType = this.reflector.getAllAndOverride<ResourceType>(CHECK_QUOTA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!resourceType) {
      return true; // No quota check specified
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      return false; // User not authenticated
    }

    // Will throw ForbiddenException if quota exceeded
    await this.usageService.enforceQuota(user.userId, resourceType);

    return true;
  }
}
