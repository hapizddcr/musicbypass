import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { PaginationSchema } from '@/lib/validations';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = PaginationSchema.safeParse(Object.fromEntries(searchParams));
    if (!params.success) {
      return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
    }

    const { page, limit, search, status, sortBy, sortOrder } = params.data;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: session.user.id };
    if (status) where.status = status;
    if (search) {
      where.file = { filename: { contains: search, mode: 'insensitive' } };
    }

    const [jobs, total] = await Promise.all([
      prisma.audioJob.findMany({
        where,
        include: { file: { select: { filename: true, format: true, duration: true } } },
        orderBy: { [sortBy || 'createdAt']: sortOrder },
        skip,
        take: limit,
      }),
      prisma.audioJob.count({ where }),
    ]);

    return NextResponse.json({
      jobs: jobs.map((j) => ({
        id: j.id,
        status: j.status,
        progress: j.progress,
        filename: j.file.filename,
        format: j.file.format,
        duration: j.file.duration,
        options: j.options,
        outputUrl: j.outputUrl,
        error: j.error,
        createdAt: j.createdAt.toISOString(),
        completedAt: j.completedAt?.toISOString() ?? null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('List jobs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
