import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth, signOut } from '@/lib/auth';
import { Sparkles, Home, Briefcase, FileAudio, Settings, CreditCard, Shield, LogOut } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/workspace', label: 'Workspace', icon: Briefcase },
  { href: '/uploads', label: 'Uploads', icon: FileAudio },
  { href: '/billing', label: 'Billing', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 border-r border-white/[0.06] bg-black/40 backdrop-blur-xl md:block">
        <div className="flex h-16 items-center border-b border-white/[0.06] px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 glow-purple">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span>AudioForge</span>
          </Link>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          {(session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN') && (
            <>
              <div className="my-2 h-px bg-white/[0.06]" />
              <Link
                href="/admin"
                className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-purple-300 transition-colors hover:bg-purple-500/10"
              >
                <Shield className="h-4 w-4" />
                Admin Panel
              </Link>
            </>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-white/[0.06] p-4">
          <div className="mb-3 flex items-center gap-3 rounded-md bg-white/[0.03] p-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-xs font-semibold">
              {(session.user.name || session.user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">
                {session.user.name || session.user.username || 'User'}
              </p>
              <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
            </div>
          </div>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-7xl p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
