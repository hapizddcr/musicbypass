import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { deleteFromR2, isR2Configured } from '@/lib/storage';
import { logAudit } from '@/lib/audit';
import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const file = await prisma.audioFile.findUnique({ where: { id: params.id } });
    if (!file || file.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (isR2Configured()) {
      await deleteFromR2(file.storageKey).catch(() => {});
    } else {
      // Dev: delete from local
      const localPath = path.join(process.cwd(), '.dev-storage', file.storageKey);
      await fs.unlink(localPath).catch(() => {});
    }

    await prisma.audioFile.delete({ where: { id: params.id } });

    await logAudit({
      userId: session.user.id,
      action: 'file.delete',
      resource: 'audio_file',
      resourceId: params.id,
      metadata: { filename: file.filename },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
