import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { CreateJobSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { headers } from 'next/headers';
import { promises as fs } from 'fs';
import path from 'path';
import { isR2Configured, getDownloadUrl } from '@/lib/storage';
import { processAudio } from '@/lib/audio-processor';
import { prisma as db } from '@/lib/db';

// We process synchronously in dev when there's no separate worker process
async function processInline(jobId: string, fileId: string, options: object) {
  try {
    await db.audioJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING', startedAt: new Date(), progress: 5 },
    });

    const file = await db.audioFile.findUnique({ where: { id: fileId } });
    if (!file) throw new Error('File not found');

    let inputBuffer: Buffer;
    if (isR2Configured()) {
      // In production, use a presigned URL and fetch
      const url = await getDownloadUrl(file.storageKey, 600);
      const res = await fetch(url);
      inputBuffer = Buffer.from(await res.arrayBuffer());
    } else {
      // Dev: read from local storage
      const localPath = path.join(process.cwd(), '.dev-storage', file.storageKey);
      inputBuffer = await fs.readFile(localPath);
    }

    await db.audioJob.update({ where: { id: jobId }, data: { progress: 15 } });

    const result = await processAudio(
      inputBuffer,
      file.filename,
      options as Parameters<typeof processAudio>[2],
      async (p) => {
        await db.audioJob.update({ where: { id: jobId }, data: { progress: p } }).catch(() => {});
      }
    );

    const outputBuffer = await fs.readFile(result.outputPath);

    let outputKey: string;
    let outputUrl: string;
    const outName = `processed-${Date.now()}.${result.mimeType.split('/')[1] || 'mp3'}`;

    if (isR2Configured()) {
      const { uploadToR2 } = await import('@/lib/storage');
      const r2 = await uploadToR2(
        `processed/${file.userId}/${outName}`,
        outputBuffer,
        result.mimeType
      );
      outputKey = r2.key;
      outputUrl = r2.url;
    } else {
      const outDir = path.join(process.cwd(), '.dev-storage', 'processed', file.userId);
      await fs.mkdir(outDir, { recursive: true });
      const outPath = path.join(outDir, outName);
      await fs.writeFile(outPath, outputBuffer);
      outputKey = `processed/${file.userId}/${outName}`;
      outputUrl = `/api/files/${encodeURIComponent(outputKey)}`;
    }

    await fs.unlink(result.outputPath).catch(() => {});

    await db.audioJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        progress: 100,
        outputKey,
        outputUrl,
        outputSize: BigInt(outputBuffer.length),
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Job processing error:', error);
    await db.audioJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      },
    });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Verify file ownership
    const file = await prisma.audioFile.findUnique({
      where: { id: parsed.data.fileId },
    });
    if (!file || file.userId !== session.user.id) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Plan quota check
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const jobsToday = await prisma.audioJob.count({
      where: { userId: session.user.id, createdAt: { gte: todayStart } },
    });

    const subscription = await prisma.subscription.findFirst({
      where: { userId: session.user.id, status: 'ACTIVE' },
      include: { plan: true },
    });
    const plan = subscription?.plan;
    const dailyLimit = plan?.jobLimitDaily ?? 5;

    if (jobsToday >= dailyLimit) {
      return NextResponse.json(
        {
          error: `Daily job limit reached (${dailyLimit}). Please upgrade your plan.`,
        },
        { status: 429 }
      );
    }

    // Create job
    const job = await prisma.audioJob.create({
      data: {
        userId: session.user.id,
        fileId: parsed.data.fileId,
        status: 'QUEUED',
        options: parsed.data.options as object,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: 'job.create',
      resource: 'audio_job',
      resourceId: job.id,
      metadata: { fileId: parsed.data.fileId, options: parsed.data.options },
      ipAddress: (await headers()).get('x-forwarded-for') ?? undefined,
    });

    // Process inline (in dev) or queue (in prod with worker)
    processInline(job.id, parsed.data.fileId, parsed.data.options).catch(console.error);

    return NextResponse.json({ id: job.id, status: job.status, progress: 0 });
  } catch (error) {
    console.error('Create job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
