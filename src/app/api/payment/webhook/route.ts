import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifySignature } from '@/lib/midtrans';
import { logAudit } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
    } = body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const isValid = verifySignature(order_id, status_code, gross_amount, signature_key);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payment = await prisma.payment.findUnique({
      where: { orderId: order_id },
    });
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    let newStatus: 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED' | 'REFUNDED' | 'CANCELLED' = 'PENDING';
    let paidAt: Date | null = null;

    if (transaction_status === 'capture') {
      if (fraud_status === 'accept' || !fraud_status) {
        newStatus = 'PAID';
        paidAt = new Date();
      } else if (fraud_status === 'challenge') {
        // Hold for review
        newStatus = 'PENDING';
      } else {
        newStatus = 'FAILED';
      }
    } else if (transaction_status === 'settlement') {
      newStatus = 'PAID';
      paidAt = new Date();
    } else if (transaction_status === 'pending') {
      newStatus = 'PENDING';
    } else if (
      transaction_status === 'deny' ||
      transaction_status === 'cancel' ||
      transaction_status === 'expire'
    ) {
      newStatus = transaction_status === 'expire' ? 'EXPIRED' : 'CANCELLED';
    } else if (transaction_status === 'refund' || transaction_status === 'partial_refund') {
      newStatus = 'REFUNDED';
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        paidAt,
        method: payment_type,
        rawResponse: body,
      },
    });

    if (newStatus === 'PAID') {
      await logAudit({
        userId: payment.userId,
        action: 'payment.success',
        resource: 'payment',
        resourceId: payment.id,
        metadata: { orderId: order_id, amount: payment.amount, method: payment_type },
      });

      // Create or update subscription
      const plan = await prisma.plan.findFirst({
        where: { priceMonthly: payment.amount },
      });

      if (plan) {
        // Cancel existing active subs
        await prisma.subscription.updateMany({
          where: { userId: payment.userId, status: 'ACTIVE' },
          data: { status: 'CANCELLED', cancelledAt: new Date() },
        });

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        await prisma.subscription.create({
          data: {
            userId: payment.userId,
            planId: plan.id,
            status: 'ACTIVE',
            startDate,
            endDate,
            midtransSubscriptionId: order_id,
          },
        });

        await prisma.payment.update({
          where: { id: payment.id },
          data: { subscriptionId: (await prisma.subscription.findFirst({
            where: { midtransSubscriptionId: order_id },
          }))?.id },
        });

        await logAudit({
          userId: payment.userId,
          action: 'subscription.create',
          resource: 'subscription',
          metadata: { planId: plan.id, planName: plan.name },
        });
      }

      // Notify user
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          type: 'payment.success',
          title: 'Payment successful',
          message: 'Your subscription is now active. Thank you!',
        },
      });
    } else if (newStatus === 'FAILED' || newStatus === 'EXPIRED' || newStatus === 'CANCELLED') {
      await logAudit({
        userId: payment.userId,
        action: 'payment.failed',
        resource: 'payment',
        resourceId: payment.id,
        metadata: { orderId: order_id, status: newStatus },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
