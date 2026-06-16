import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UpdateProfileSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = UpdateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Check username uniqueness
    if (parsed.data.username) {
      const existing = await prisma.user.findFirst({
        where: { username: parsed.data.username, NOT: { id: session.user.id } },
      });
      if (existing) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: parsed.data,
    });

    await logAudit({
      userId: session.user.id,
      action: 'user.profile_update',
      resource: 'user',
      resourceId: session.user.id,
    });

    return NextResponse.json({ success: true, user: { name: updated.name, username: updated.username, image: updated.image } });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
