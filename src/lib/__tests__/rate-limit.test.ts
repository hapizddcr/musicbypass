import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('allows requests under the limit', () => {
    const result = rateLimit('test-key-1', { windowMs: 60_000, max: 5 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it('blocks requests over the limit', () => {
    const key = 'test-key-blocked';
    // Use up the tokens
    for (let i = 0; i < 3; i++) {
      rateLimit(key, { windowMs: 60_000, max: 3 });
    }
    const result = rateLimit(key, { windowMs: 60_000, max: 3 });
    expect(result.success).toBe(false);
  });

  it('isolates limits per key', () => {
    const a = rateLimit('user-a', { windowMs: 60_000, max: 1 });
    const b = rateLimit('user-b', { windowMs: 60_000, max: 1 });
    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
  });
});

describe('getClientIdentifier', () => {
  it('prefers x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    expect(getClientIdentifier(headers)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip', () => {
    const headers = new Headers({ 'x-real-ip': '1.2.3.4' });
    expect(getClientIdentifier(headers)).toBe('1.2.3.4');
  });

  it('returns anonymous when no headers present', () => {
    const headers = new Headers();
    expect(getClientIdentifier(headers)).toBe('anonymous');
  });
});
