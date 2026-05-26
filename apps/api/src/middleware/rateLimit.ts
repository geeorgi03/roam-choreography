import type { Context, Next } from 'hono';
import { clientIp } from '../lib/sanitize.js';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const MAX_BUCKETS = 20_000;

function pruneBuckets(now: number) {
  if (buckets.size <= MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
    if (buckets.size <= MAX_BUCKETS * 0.8) break;
  }
}

export type RateLimitOptions = {
  windowMs?: number;
  max?: number;
  /** Prefix for route-specific limits, e.g. "feedback". */
  scope?: string;
};

export function rateLimit(opts: RateLimitOptions = {}) {
  const windowMs = opts.windowMs ?? 60_000;
  const max = opts.max ?? 120;
  const scope = opts.scope ?? 'global';

  return async (c: Context, next: Next) => {
    const ip = clientIp(c.req.header('x-forwarded-for'), c.req.header('x-real-ip'));
    const key = `${scope}:${ip}`;
    const now = Date.now();
    pruneBuckets(now);

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(0, max - bucket.count);
    c.header('X-RateLimit-Limit', String(max));
    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      return c.json({ error: 'Too many requests' }, 429);
    }

    return next();
  };
}
