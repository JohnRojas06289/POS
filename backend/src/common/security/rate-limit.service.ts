import { Injectable } from '@nestjs/common';

type RateBucket = {
  hits: number[];
};

@Injectable()
export class RateLimitService {
  private readonly buckets = new Map<string, RateBucket>();

  consume(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterMs: number; remaining: number } {
    const now = Date.now();
    const bucket = this.buckets.get(key) ?? { hits: [] };
    const cutoff = now - windowMs;

    bucket.hits = bucket.hits.filter((hit) => hit > cutoff);

    if (bucket.hits.length >= limit) {
      const oldest = bucket.hits[0] ?? now;
      const retryAfterMs = Math.max(0, windowMs - (now - oldest));
      this.buckets.set(key, bucket);
      return { allowed: false, retryAfterMs, remaining: 0 };
    }

    bucket.hits.push(now);
    this.buckets.set(key, bucket);

    return {
      allowed: true,
      retryAfterMs: 0,
      remaining: Math.max(0, limit - bucket.hits.length),
    };
  }
}
