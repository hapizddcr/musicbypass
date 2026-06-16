import { auth } from '@/lib/auth';
import { WorkspaceClient } from './client';

export default async function WorkspacePage() {
  const session = await auth();
  return <WorkspaceClient userName={session?.user?.name || session?.user?.email || 'User'} />;
}
