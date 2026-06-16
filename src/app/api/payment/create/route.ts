import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { v4 as uuid } from 'uuid';
import { CreatePaymentSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { isMidtransConfigured, createSnapTransaction } from '@/lib/midtrans';
import { headers } from 'next/headers';
import { getClientIdentifier } from '@/lib/rate-limit';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = getClientIdentifier(await headers());
    const limit = rateLimit(`payment:${ip}`, { windowMs: 60_000, max: 5 });
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = CreatePaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { id: parsed.data.planId } });
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const amount = parsed.data.billingCycle === 'yearly' ? (plan.priceYearly ?? plan.priceMonthly * 12) : plan.priceMonthly;
    const orderId = `ORD-${Date.now()}-${uuid().slice(0, 8)}`;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        orderId,
        amount,
        currency: 'IDR',
        status: 'PENDING',
        expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    if (!isMidtransConfigured()) {
      // Dev mode: auto-complete for testing
      return NextResponse.json({
        orderId,
        paymentId: payment.id,
        devMode: true,
        message: 'Midtrans not configured - this is a development environment',
      });
    }

    const transaction = await createSnapTransaction({
      orderId,
      amount,
      customerName: session.user.name || 'Customer',
      customerEmail: session.user.email || 'noreply@audioforge.app',
      itemName: `${plan.name} Plan (${parsed.data.billingCycle})`,
      itemId: plan.id,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        midtransToken: transaction.token,
        midtransRedirectUrl: transaction.redirect_url,
        rawResponse: transaction as object,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: 'payment.create',
      resource: 'payment',
      resourceId: payment.id,
      metadata: { orderId, amount, planId: plan.id },
    });

    return NextResponse.json({
      orderId,
      paymentId: payment.id,
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
