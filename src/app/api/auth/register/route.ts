import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { RegisterSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const ip = getClientIdentifier(await headers());
    const limit = rateLimit(`register:${ip}`, { windowMs: 60_000 * 15, max: 5 });
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, name, password } = parsed.data;

    // Check existing
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const user = await prisma.user.create({
      data: {
        email,
        name,
        username,
        passwordHash,
        role: 'USER',
      },
    });

    await logAudit({
      userId: user.id,
      action: 'user.signup',
      resource: 'user',
      resourceId: user.id,
      metadata: { email, provider: 'credentials' },
    });

    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
