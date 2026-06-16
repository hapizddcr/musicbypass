import { prisma } from './db';
import { logger } from './logger';

export type AuditAction =
  | 'user.signup'
  | 'user.login'
  | 'user.logout'
  | 'user.password_change'
  | 'user.profile_update'
  | 'job.create'
  | 'job.process'
  | 'job.delete'
  | 'file.upload'
  | 'file.delete'
  | 'payment.create'
  | 'payment.success'
  | 'payment.failed'
  | 'subscription.create'
  | 'subscription.cancel'
  | 'admin.action'
  | 'security.rate_limit'
  | 'security.csrf_blocked';

export interface AuditEntry {
  userId?: string | null;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        metadata: entry.metadata as object,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  } catch (error) {
    logger.error({ error, entry }, 'Failed to write audit log');
  }
}
