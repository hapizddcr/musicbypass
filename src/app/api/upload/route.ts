import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { buildStorageKey, isR2Configured, uploadToR2 } from '@/lib/storage';
import { logAudit } from '@/lib/audit';
import { RemoteUrlSchema } from '@/lib/validations';
import { headers } from 'next/headers';
import { v4 as uuid } from 'uuid';
import { getAudioMetadata } from '@/lib/audio-processor';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_MIMES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/ogg',
  'audio/flac',
  'audio/x-flac',
  'audio/aac',
  'audio/mp4',
  'audio/x-m4a',
];

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';

    // Direct file upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const remoteUrl = formData.get('url') as string | null;

      if (!file && !remoteUrl) {
        return NextResponse.json({ error: 'No file or URL provided' }, { status: 400 });
      }

      let buffer: Buffer;
      let filename: string;
      let mime: string;

      if (file) {
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json({ error: 'File too large (max 100MB)' }, { status: 413 });
        }
        if (file.type && !ALLOWED_MIMES.includes(file.type)) {
          return NextResponse.json(
            { error: `Unsupported file type: ${file.type}` },
            { status: 415 }
          );
        }
        const arrayBuffer = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        filename = file.name;
        mime = file.type || 'audio/mpeg';
      } else {
        // Remote URL upload
        const urlParse = RemoteUrlSchema.safeParse({ url: remoteUrl });
        if (!urlParse.success) {
          return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
        }
        try {
          const fetched = await fetch(urlParse.data.url, { signal: AbortSignal.timeout(30_000) });
          if (!fetched.ok) {
            return NextResponse.json({ error: `Failed to fetch: ${fetched.status}` }, { status: 502 });
          }
          const contentLength = parseInt(fetched.headers.get('content-length') || '0', 10);
          if (contentLength > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'Remote file too large' }, { status: 413 });
          }
          const arrayBuffer = await fetched.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
          const urlPath = new URL(urlParse.data.url).pathname;
          filename = urlPath.split('/').pop() || `remote-${uuid()}.mp3`;
          mime = fetched.headers.get('content-type') || 'audio/mpeg';
        } catch (err) {
          return NextResponse.json({ error: 'Could not fetch remote URL' }, { status: 502 });
        }
      }

      // Upload to R2 if configured, otherwise store locally for dev
      let storageKey: string;
      let url: string;
      const key = buildStorageKey(session.user.id, filename);

      if (isR2Configured()) {
        const r2 = await uploadToR2(key, buffer, mime);
        storageKey = r2.key;
        url = r2.url;
      } else {
        // Dev fallback: store in /tmp
        const fs = await import('fs/promises');
        const path = await import('path');
        const devDir = path.join(process.cwd(), '.dev-storage');
        await fs.mkdir(devDir, { recursive: true });
        const devPath = path.join(devDir, key);
        await fs.mkdir(path.dirname(devPath), { recursive: true });
        await fs.writeFile(devPath, buffer);
        storageKey = key;
        url = `/api/files/${encodeURIComponent(key)}`;
      }

      // Get metadata
      const meta = await getAudioMetadata(buffer, filename);

      // Save to DB
      const audioFile = await prisma.audioFile.create({
        data: {
          userId: session.user.id,
          filename,
          storageKey,
          mimeType: mime,
          size: BigInt(buffer.length),
          duration: meta.duration,
          format: meta.format,
        },
      });

      await logAudit({
        userId: session.user.id,
        action: 'file.upload',
        resource: 'audio_file',
        resourceId: audioFile.id,
        metadata: { filename, size: buffer.length, mime, fromUrl: !!remoteUrl },
        ipAddress: (await headers()).get('x-forwarded-for') ?? undefined,
      });

      return NextResponse.json({
        id: audioFile.id,
        filename: audioFile.filename,
        url,
        size: audioFile.size.toString(),
        duration: audioFile.duration,
        format: audioFile.format,
      });
    }

    return NextResponse.json({ error: 'Invalid content type' }, { status: 415 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export const config = {
  api: { bodyParser: false, sizeLimit: '100mb' },
};
