import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Extract subdomain: e.g. "comnet101.store.com" or "comnet101.localhost:3000"
  let subdomain = '';
  const parts = hostname.split('.');

  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    if (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== '127') {
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
