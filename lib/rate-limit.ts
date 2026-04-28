import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '@/lib/env';

let limiter: Ratelimit | null = null;

export async function rateLimit(identifier: string, limit = 60) {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return { success: true, remaining: limit, reset: Date.now() + 60_000 };
  }

  if (!limiter) {
    limiter = new Ratelimit({
      redis: new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN
      }),
      limiter: Ratelimit.slidingWindow(limit, '1 m'),
      analytics: true,
      prefix: 'sentinelum'
    });
  }

  return limiter.limit(identifier);
}
