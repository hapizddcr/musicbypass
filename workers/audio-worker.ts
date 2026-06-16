/**
 * Standalone audio processing worker.
 * Run with: npm run worker
 *
 * Polls the database for QUEUED jobs and processes them.
 * In production you would run multiple instances of this for parallelism.
 */
import { PrismaClient } from '@prisma/client';
import { processAudio } from '../src/lib/audio-processor';
import { getDownloadUrl, isR2Configured, uploadToR2, deleteFromR2 } from '../src/lib/storage';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../src/lib/logger';

const prisma = new PrismaClient();
const CONCURRENCY = Number(process.env.WORKER_CONCURRENCY) || 2;
const POLL_INTERVAL = 2000;

let running = 0;
let stopping = false;

async function claimNextJob(): Promise<string | null> {
  // Find a queued job
  const job = await prisma.audioJob.findFirst({
    where: { status: 'QUEUED' },
    orderBy: { createdAt: 'asc' },
    include: { file: true },
  });
  if (!job) return null;

  // Atomically claim
  const claimed = await prisma.audioJob.updateMany({
    where: { id: job.id, status: 'QUEUED' },
    data: { status: 'PROCESSING', startedAt: new Date(), progress: 5 },
  });
  if (claimed.count === 0) return null;
  return job.id;
}

async function processJob(jobId: string) {
  const job = await prisma.audioJob.findUnique({
    where: { id: jobId },
    include: { file: true },
  });
  if (!job) return;

  try {
    let inputBuffer: Buffer;
    if (isR2Configured()) {
      const url = await getDownloadUrl(job.file.storageKey, 600);
      const res = await fetch(url);
      inputBuffer = Buffer.from(await res.arrayBuffer());
    } else {
      const localPath = path.join(process.cwd(), '.dev-storage', job.file.storageKey);
      inputBuffer = await fs.readFile(localPath);
    }

    await prisma.audioJob.update({ where: { id: jobId }, data: { progress: 15 } });

    const result = await processAudio(
      inputBuffer,
      job.file.filename,
      job.options as Parameters<typeof processAudio>[2],
      async (p) => {
        await prisma.audioJob.update({ where: { id: jobId }, data: { progress: p } }).catch(() => {});
      }
    );

    const outputBuffer = await fs.readFile(result.outputPath);
    const outName = `processed-${Date.now()}.${result.mimeType.split('/')[1] || 'mp3'}`;

    let outputKey: string;
    let outputUrl: string;

    if (isR2Configured()) {
      const r2 = await uploadToR2(`processed/${job.file.userId}/${outName}`, outputBuffer, result.mimeType);
      outputKey = r2.key;
      outputUrl = r2.url;
    } else {
      const outDir = path.join(process.cwd(), '.dev-storage', 'processed', job.file.userId);
      await fs.mkdir(outDir, { recursive: true });
      const outPath = path.join(outDir, outName);
      await fs.writeFile(outPath, outputBuffer);
      outputKey = `processed/${job.file.userId}/${outName}`;
      outputUrl = `/api/files/${encodeURIComponent(outputKey)}`;
    }

    await fs.unlink(result.outputPath).catch(() => {});

    await prisma.audioJob.update({
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
    logger.info({ jobId, filename: job.file.filename }, 'Job completed');
  } catch (err) {
    logger.error({ err, jobId }, 'Job failed');
    await prisma.audioJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error: err instanceof Error ? err.message : 'Unknown error',
        completedAt: new Date(),
      },
    });
  }
}

async function tick() {
  if (stopping) return;
  if (running >= CONCURRENCY) return;
  const jobId = await claimNextJob();
  if (!jobId) return;
  running++;
  processJob(jobId).finally(() => {
    running--;
  });
}

async function main() {
  logger.info({ CONCURRENCY }, 'Audio worker started');
  process.on('SIGINT', async () => {
    logger.info('Stopping...');
    stopping = true;
    setTimeout(() => process.exit(0), 5000);
  });
  while (!stopping) {
    await tick();
    if (running < CONCURRENCY) await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }
}

main().catch((err) => {
  logger.error({ err }, 'Worker crashed');
  process.exit(1);
});
