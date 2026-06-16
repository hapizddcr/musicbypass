// Simple in-memory rate limiter (use Redis in production with multi-instance)
type BucketKey = string;

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<BucketKey, Bucket>();

export interface RateLimitConfig {
  windowMs: number; // window in ms
  max: number; // max requests per window
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
    max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 60,
  }
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const key = identifier;
  const bucket = buckets.get(key) ?? { tokens: config.max, lastRefill: now };

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefill;
  const refillRate = config.max / config.windowMs;
  const refilled = Math.min(config.max, bucket.tokens + elapsed * refillRate);

  if (refilled < 1) {
    buckets.set(key, { tokens: refilled, lastRefill: now });
    return { success: false, remaining: 0, reset: now + config.windowMs };
  }

  const success = refilled >= 1;
  const remaining = Math.floor(success ? refilled - 1 : refilled);
  buckets.set(key, { tokens: success ? refilled - 1 : refilled, lastRefill: now });

  return { success, remaining, reset: now + config.windowMs };
}

export function getClientIdentifier(headers: Headers, fallbackIp?: string | null): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = headers.get('x-real-ip');
  if (real) return real;
  return fallbackIp ?? 'anonymous';
}

// Cleanup old buckets periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (now - bucket.lastRefill > 3_600_000) {
        buckets.delete(key);
      }
    }
  }, 600_000).unref?.();
}
