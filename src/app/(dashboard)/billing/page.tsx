import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { BillingClient } from './client';
import { redirect } from 'next/navigation';

export default async function BillingPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const [plans, activeSubscription, payments] = await Promise.all([
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.subscription.findFirst({
      where: { userId: session.user.id, status: 'ACTIVE' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { subscription: { include: { plan: true } } },
    }),
  ]);

  return (
    <BillingClient
      plans={plans.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        priceMonthly: p.priceMonthly,
        priceYearly: p.priceYearly,
        jobLimitDaily: p.jobLimitDaily,
        jobLimitMonthly: p.jobLimitMonthly,
        features: p.features as Record<string, unknown>,
      }))}
      activeSubscription={
        activeSubscription
          ? {
              id: activeSubscription.id,
              planName: activeSubscription.plan.name,
              planId: activeSubscription.plan.id,
              endDate: activeSubscription.endDate.toISOString(),
              autoRenew: activeSubscription.autoRenew,
            }
          : null
      }
      payments={payments.map((p) => ({
        id: p.id,
        orderId: p.orderId,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        method: p.method,
        createdAt: p.createdAt.toISOString(),
        paidAt: p.paidAt?.toISOString() ?? null,
        planName: p.subscription?.plan.name ?? null,
      }))}
    />
  );
}
