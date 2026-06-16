import { describe, it, expect, vi } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/password';

describe('password', () => {
  it('hashes a password', async () => {
    const hash = await hashPassword('mySecret123');
    expect(hash).toBeTruthy();
    expect(hash).not.toBe('mySecret123');
    expect(hash.length).toBeGreaterThan(50);
  });

  it('verifies a correct password', async () => {
    const hash = await hashPassword('correctPassword1');
    const result = await verifyPassword('correctPassword1', hash);
    expect(result).toBe(true);
  });

  it('rejects incorrect password', async () => {
    const hash = await hashPassword('correctPassword1');
    const result = await verifyPassword('wrongPassword1', hash);
    expect(result).toBe(false);
  });

  it('produces different hashes for same password (salted)', async () => {
    const hash1 = await hashPassword('same');
    const hash2 = await hashPassword('same');
    expect(hash1).not.toBe(hash2);
  });

  it('handles invalid hash gracefully', async () => {
    const result = await verifyPassword('anything', 'not-a-valid-hash');
    expect(result).toBe(false);
  });
});
