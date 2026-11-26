import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authorizeActiveRequestRoles, getRequestToken, verifyJwtToken } from '@/lib/proxy-helper';

function isEditorPath(pathname: string): boolean {
  return /^\/admin\/(?:products|categories|brands)(?:\/|$)/.test(pathname);
}

function isEditorApiPath(pathname: string): boolean {
  return /^\/api\/admin\/(?:products|categories|brands|presence)(?:\/|$)/.test(pathname);
}

/**
 * Next.js 16 Proxy (replaces deprecated "middleware" file convention).
 * Handles multi-tenant reseller subdomain routing.
 */
export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const pathname = url.pathname;
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  const isAdminApi = pathname === '/api/admin' || pathname.startsWith('/api/admin/');

  if (isAdminPage || isAdminApi) {
    const token = getRequestToken(request);
    const user = token ? verifyJwtToken(token) : null;
    const allowed =
      user?.role === 'ADMIN' ||
      (user?.role === 'PRODUCT_EDITOR' &&
        (isAdminPage ? isEditorPath(pathname) : isEditorApiPath(pathname)));

    if (!allowed) {
      if (isAdminApi) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: user ? 'FORBIDDEN' : 'UNAUTHORIZED',
              message: user ? 'Administrator access required.' : 'Authentication required.',
            },
          },
          { status: user ? 403 : 401, headers: { 'Cache-Control': 'no-store' } }
        );
      }

      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isAdminApi) {
      const activeAuthError = await authorizeActiveRequestRoles(
        request,
        user?.role === 'PRODUCT_EDITOR' ? ['ADMIN', 'PRODUCT_EDITOR'] : ['ADMIN']
      );
      if (activeAuthError) return activeAuthError;
    }
  }

  // Extract subdomain: e.g. "comnet101.store.com" or "comnet101.localhost:3000"
  let subdomain = '';
  const parts = hostname.split('.');

  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    if (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== '127') {
      subdomain = parts[0];
    }
  } else if (hostname.endsWith('.vercel.app') || hostname.includes('vercel.app')) {
    // Vercel deployment URLs (e.g. project-branch-user.vercel.app) — do not treat
    // the Vercel project name as a tenant subdomain
    if (parts.length >= 4 && parts[0] !== 'www') {
      subdomain = parts[0];
    }
  } else if (parts.length >= 3) {
    // e.g. comnet101.nextech.com
    if (parts[0] !== 'www' && parts[0] !== 'admin' && parts[0] !== 'api') {
      subdomain = parts[0];
    }
  }

  // Also support manual ?resellerCode query param in dev if not using subdomains
  const queryReseller = url.searchParams.get('resellerCode') || url.searchParams.get('reseller');
  const targetTenant = subdomain || queryReseller;

  if (targetTenant && !url.pathname.startsWith('/api') && !url.pathname.startsWith('/_next')) {
    // If not already on /reseller/code path, rewrite internally
    if (!url.pathname.startsWith(`/reseller/${targetTenant}`)) {
      const rewriteUrl = new URL(`/reseller/${targetTenant}${url.pathname === '/' ? '/dashboard' : url.pathname}`, request.url);
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/admin/:path*',
    /*
     * Match all request paths except for:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|assets).*)',
  ],
};
