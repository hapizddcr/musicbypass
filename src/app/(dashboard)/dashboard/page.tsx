import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, FileAudio, CreditCard, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { DashboardClient } from './client';

async function getDashboardData(userId: string) {
  const [user, totalUploads, totalJobs, recentJobs, activeSubscription, recentActivity] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.audioFile.count({ where: { userId } }),
    prisma.audioJob.count({ where: { userId } }),
    prisma.audioJob.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { file: true },
    }),
    prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.findMany({
      where: { userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Today's job count
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const jobsToday = await prisma.audioJob.count({
    where: { userId, createdAt: { gte: todayStart } },
  });

  return {
    user,
    totalUploads,
    totalJobs,
    jobsToday,
    recentJobs: recentJobs.map((j) => ({
      id: j.id,
      filename: j.file.filename,
      status: j.status,
      progress: j.progress,
      createdAt: j.createdAt.toISOString(),
    })),
    activeSubscription: activeSubscription
      ? {
          planName: activeSubscription.plan.name,
          endDate: activeSubscription.endDate.toISOString(),
        }
      : null,
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      action: a.action,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const data = await getDashboardData(session.user.id);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back, {session.user.name || session.user.email}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Active Subscription</CardDescription>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">
              {data.activeSubscription ? data.activeSubscription.planName : 'Free'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.activeSubscription ? (
              <p className="text-xs text-muted-foreground">
                Renews {formatDistanceToNow(new Date(data.activeSubscription.endDate), { addSuffix: true })}
              </p>
            ) : (
              <Button asChild size="sm" variant="link" className="h-auto p-0">
                <Link href="/billing">
                  Upgrade <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Total Uploads</CardDescription>
              <FileAudio className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">{data.totalUploads}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">All-time files uploaded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Total Jobs</CardDescription>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">{data.totalJobs}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {data.jobsToday} processed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Account Status</CardDescription>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">
              <Badge variant="success">Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{session.user.role}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Jobs</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/uploads">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DashboardClient recentJobs={data.recentJobs} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet</p>
              ) : (
                data.recentActivity.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 text-sm">
                    <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-500" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{a.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
