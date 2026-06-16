import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SettingsClient } from './client';
import { redirect } from 'next/navigation';

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        include: { plan: true },
        take: 1,
      },
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!user) return null;

  return (
    <SettingsClient
      user={{
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        image: user.image,
        twoFactorEnabled: user.twoFactorEnabled,
        activePlan: user.subscriptions[0]?.plan.name ?? null,
      }}
      payments={user.payments.map((p) => ({
        id: p.id,
        orderId: p.orderId,
        amount: p.amount,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
      }))}
    />
  );
}
