import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/pricing',
  '/about',
  '/terms',
  '/privacy',
  '/api/auth',
  '/api/payment/webhook',
  '/_next',
  '/favicon.ico',
];

const ADMIN_PATHS = ['/admin'];
const AUTH_PATHS = [
  '/dashboard',
  '/workspace',
  '/uploads',
  '/settings',
  '/billing',
  '/admin',
];

export default auth((req: NextRequest & { auth: { user?: unknown } | null }) => {
  const { pathname } = req.nextUrl;

  // Skip static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Apply rate limiting to all API routes
  if (pathname.startsWith('/api/')) {
    const ip = getClientIdentifier(req.headers);
    const limit = rateLimit(ip);
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(limit.reset),
            'Retry-After': '60',
          },
        }
      );
    }
  }

  // Public paths - no auth required
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  // All other paths require authentication
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    if (!req.auth?.user) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Admin check
    if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
      const user = req.auth.user as { role?: string };
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
