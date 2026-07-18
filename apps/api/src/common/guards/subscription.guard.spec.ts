import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { SubscriptionsService } from '../../modules/subscriptions/subscriptions.service';
import { REQUIRES_PLAN_KEY } from '../decorators/requires-plan.decorator';

import { SubscriptionGuard } from './subscription.guard';

const buildContext = (user: Record<string, unknown>, requiredPlan?: string): ExecutionContext => {
  const getRequest = jest.fn().mockReturnValue({ user });
  const getHandler = jest.fn();
  const getClass = jest.fn();

  return {
    switchToHttp: () => ({ getRequest }),
    getHandler,
    getClass,
  } as unknown as ExecutionContext;
};

describe('SubscriptionGuard', () => {
  let guard: SubscriptionGuard;
  let reflector: Reflector;
  let subscriptionsService: { enforceplan: jest.Mock };

  beforeEach(async () => {
    subscriptionsService = { enforceplan: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionGuard,
        Reflector,
        { provide: SubscriptionsService, useValue: subscriptionsService },
      ],
    }).compile();

    guard = module.get<SubscriptionGuard>(SubscriptionGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when no plan is required', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    });

    it('should allow access for any user', async () => {
      const context = buildContext({ id: 'user-1', role: 'USER' });
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(subscriptionsService.enforceplan).not.toHaveBeenCalled();
    });
  });

  describe('when a PRO plan is required', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('PRO');
    });

    it('should bypass plan check for ADMIN users', async () => {
      const context = buildContext({ id: 'admin-1', role: 'ADMIN' });
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(subscriptionsService.enforceplan).not.toHaveBeenCalled();
    });

    it('should bypass plan check for SUPER_ADMIN users', async () => {
      const context = buildContext({ id: 'super-1', role: 'SUPER_ADMIN' });
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(subscriptionsService.enforceplan).not.toHaveBeenCalled();
    });

    it('should enforce plan check for regular USER', async () => {
      const context = buildContext({ id: 'user-1', role: 'USER' });
      await guard.canActivate(context);
      expect(subscriptionsService.enforceplan).toHaveBeenCalledWith('user-1', 'PRO');
    });

    it('should enforce plan check for user with no role', async () => {
      const context = buildContext({ id: 'user-1' });
      await guard.canActivate(context);
      expect(subscriptionsService.enforceplan).toHaveBeenCalledWith('user-1', 'PRO');
    });

    it('should return false when user is not authenticated', async () => {
      const context = buildContext({});
      const result = await guard.canActivate(context);
      expect(result).toBe(false);
      expect(subscriptionsService.enforceplan).not.toHaveBeenCalled();
    });

    it('should resolve user id from id field', async () => {
      const context = buildContext({ id: 'user-abc', role: 'USER' });
      await guard.canActivate(context);
      expect(subscriptionsService.enforceplan).toHaveBeenCalledWith('user-abc', 'PRO');
    });

    it('should resolve user id from sub field', async () => {
      const context = buildContext({ sub: 'user-sub', role: 'USER' });
      await guard.canActivate(context);
      expect(subscriptionsService.enforceplan).toHaveBeenCalledWith('user-sub', 'PRO');
    });
  });

  describe('when a FAMILY plan is required', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('FAMILY');
    });

    it('should bypass plan check for ADMIN users', async () => {
      const context = buildContext({ id: 'admin-1', role: 'ADMIN' });
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(subscriptionsService.enforceplan).not.toHaveBeenCalled();
    });

    it('should bypass plan check for SUPER_ADMIN users', async () => {
      const context = buildContext({ id: 'super-1', role: 'SUPER_ADMIN' });
      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(subscriptionsService.enforceplan).not.toHaveBeenCalled();
    });

    it('should enforce plan check for regular USER', async () => {
      const context = buildContext({ id: 'user-1', role: 'USER' });
      await guard.canActivate(context);
      expect(subscriptionsService.enforceplan).toHaveBeenCalledWith('user-1', 'FAMILY');
    });
  });
});
