import { SetMetadata } from '@nestjs/common';

import type { SubscriptionPlan } from '../../modules/subscriptions/subscriptions.service';

export const REQUIRES_PLAN_KEY = 'requiresPlan';
export const RequiresPlan = (plan: SubscriptionPlan) => SetMetadata(REQUIRES_PLAN_KEY, plan);
