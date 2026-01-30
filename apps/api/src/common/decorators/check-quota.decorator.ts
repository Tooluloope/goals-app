import { SetMetadata } from '@nestjs/common';
import { ResourceType } from '../../modules/usage/usage.service';

export const CHECK_QUOTA_KEY = 'checkQuota';
export const CheckQuota = (resource: ResourceType) => SetMetadata(CHECK_QUOTA_KEY, resource);
