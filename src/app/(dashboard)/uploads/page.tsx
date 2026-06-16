import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UploadsClient } from './client';

export default async function UploadsPage() {
  const session = await auth();
  if (!session) return null;

  const files = await prisma.audioFile.findMany({
    where: { userId: session.user.id },
    include: {
      jobs: {
        select: { id: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const data = files.map((f) => ({
    id: f.id,
    filename: f.filename,
    format: f.format,
    size: f.size.toString(),
    duration: f.duration,
    createdAt: f.createdAt.toISOString(),
    status: f.jobs[0]?.status ?? 'NEW',
  }));

  return <UploadsClient initialFiles={data} />;
}
