import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/sidebar';
import { Shield } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-56 flex-shrink-0 border-r border-white/[0.06] bg-black/40 backdrop-blur-xl md:block">
        <div className="flex h-16 items-center border-b border-white/[0.06] px-6">
          <div className="flex items-center gap-2 font-semibold text-purple-300">
            <Shield className="h-4 w-4" /> Admin
          </div>
        </div>
        <AdminSidebar />
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-7xl p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
