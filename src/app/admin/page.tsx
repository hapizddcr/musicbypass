import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, Briefcase, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

async function getAdminStats() {
  const [users, activeSubs, jobs, revenue, recentPayments, jobsByStatus] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.audioJob.count(),
    prisma.payment.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    }),
    prisma.payment.findMany({
      where: { status: 'PAID' },
      orderBy: { paidAt: 'desc' },
      take: 5,
      include: { user: { select: { email: true, name: true } } },
    }),
    prisma.audioJob.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
  ]);

  return {
    users,
    activeSubs,
    jobs,
    revenue: revenue._sum.amount ?? 0,
    recentPayments,
    jobsByStatus: jobsByStatus.reduce(
      (acc, g) => ({ ...acc, [g.status]: g._count._all }),
      {} as Record<string, number>
    ),
  };
}

function formatIDR(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

export default async function AdminPage() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Overview</h1>
        <p className="mt-1 text-muted-foreground">System-wide metrics and recent activity</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Total Users</CardDescription>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">{stats.users}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Active Subscriptions</CardDescription>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">{stats.activeSubs}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Total Jobs</CardDescription>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">{stats.jobs}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {Object.entries(stats.jobsByStatus).map(([s, c]) => `${s}: ${c}`).join(' · ')}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Total Revenue</CardDescription>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">{formatIDR(stats.revenue)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet</p>
          ) : (
            <div className="space-y-2">
              {stats.recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-md border border-white/[0.06] bg-white/[0.02] p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{p.user.name || p.user.email}</p>
                    <p className="text-xs text-muted-foreground font-mono">{p.orderId}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatIDR(p.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.paidAt ? formatDistanceToNow(new Date(p.paidAt), { addSuffix: true }) : '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
