import { describe, it, expect } from 'vitest';
import { verifySignature, isMidtransConfigured } from '@/lib/midtrans';
import crypto from 'crypto';

describe('midtrans.verifySignature', () => {
  it('verifies a correct signature', () => {
    const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
    if (!SERVER_KEY) {
      // Skip if not configured
      return;
    }
    const orderId = 'ORD-123';
    const statusCode = '200';
    const grossAmount = '100000';
    const input = `${orderId}${statusCode}${grossAmount}${SERVER_KEY}`;
    const signature = crypto.createHash('sha512').update(input).digest('hex');
    expect(verifySignature(orderId, statusCode, grossAmount, signature)).toBe(true);
  });

  it('rejects an incorrect signature', () => {
    process.env.MIDTRANS_SERVER_KEY = 'test-key';
    expect(verifySignature('o1', '200', '100', 'wrong-signature')).toBe(false);
  });

  it('rejects when no server key configured', () => {
    const oldKey = process.env.MIDTRANS_SERVER_KEY;
    delete process.env.MIDTRANS_SERVER_KEY;
    expect(verifySignature('o1', '200', '100', 'anything')).toBe(false);
    process.env.MIDTRANS_SERVER_KEY = oldKey;
  });
});

describe('midtrans.isMidtransConfigured', () => {
  it('returns false when not configured', () => {
    const oldKey = process.env.MIDTRANS_SERVER_KEY;
    const oldClient = process.env.MIDTRANS_CLIENT_KEY;
    delete process.env.MIDTRANS_SERVER_KEY;
    delete process.env.MIDTRANS_CLIENT_KEY;
    expect(isMidtransConfigured()).toBe(false);
    process.env.MIDTRANS_SERVER_KEY = oldKey;
    process.env.MIDTRANS_CLIENT_KEY = oldClient;
  });
});
