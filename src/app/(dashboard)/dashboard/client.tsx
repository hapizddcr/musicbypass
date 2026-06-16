'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface Job {
  id: string;
  filename: string;
  status: string;
  progress: number;
  createdAt: string;
}

const statusVariant: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  QUEUED: 'secondary',
  PROCESSING: 'warning',
  COMPLETED: 'success',
  FAILED: 'destructive',
  CANCELLED: 'secondary',
};

export function DashboardClient({ recentJobs }: { recentJobs: Job[] }) {
  if (recentJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.08] bg-white/[0.02] p-8 text-center">
        <p className="text-sm text-muted-foreground">No jobs yet</p>
        <Button asChild size="sm" className="mt-4">
          <Link href="/workspace">
            <Plus className="h-3 w-3" /> Create your first job
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recentJobs.map((job) => (
        <div
          key={job.id}
          className="flex items-center justify-between gap-3 rounded-md border border-white/[0.04] bg-white/[0.02] p-3"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{job.filename}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
            </p>
          </div>
          <Badge variant={statusVariant[job.status] ?? 'secondary'}>{job.status}</Badge>
        </div>
      ))}
    </div>
  );
}
