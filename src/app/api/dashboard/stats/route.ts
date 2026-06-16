import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(_request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [totalUploads, totalJobs, jobsToday, jobsThisMonth, recentJobs, activeSubscription, storageUsed] =
      await Promise.all([
        prisma.audioFile.count({ where: { userId } }),
        prisma.audioJob.count({ where: { userId } }),
        prisma.audioJob.count({ where: { userId, createdAt: { gte: todayStart } } }),
        prisma.audioJob.count({ where: { userId, createdAt: { gte: monthStart } } }),
        prisma.audioJob.findMany({
          where: { userId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { file: { select: { filename: true } } },
        }),
        prisma.subscription.findFirst({
          where: { userId, status: 'ACTIVE' },
          include: { plan: true },
        }),
        prisma.audioFile.aggregate({
          where: { userId },
          _sum: { size: true },
        }),
      ]);

    const jobsByStatus = await prisma.audioJob.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
    });

    return NextResponse.json({
      totalUploads,
      totalJobs,
      jobsToday,
      jobsThisMonth,
      jobsByStatus: jobsByStatus.reduce(
        (acc, g) => ({ ...acc, [g.status]: g._count._all }),
        {} as Record<string, number>
      ),
      storageUsed: storageUsed._sum.size?.toString() || '0',
      activeSubscription: activeSubscription
        ? {
            planName: activeSubscription.plan.name,
            endDate: activeSubscription.endDate.toISOString(),
            jobsUsed: jobsThisMonth,
            jobsLimit: activeSubscription.plan.jobLimitMonthly,
          }
        : null,
      recentJobs: recentJobs.map((j) => ({
        id: j.id,
        filename: j.file.filename,
        status: j.status,
        createdAt: j.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
