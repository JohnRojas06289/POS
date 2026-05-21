import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';

export type RateLimitRule = {
  limit: number;
  windowMs: number;
  fields?: string[];
};

export const RateLimit = (rule: RateLimitRule) => SetMetadata(RATE_LIMIT_KEY, rule);
