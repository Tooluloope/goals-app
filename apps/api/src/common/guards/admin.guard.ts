import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const role = user?.role;

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return true;
    }

    throw new ForbiddenException('Admin access required');
  }
}
