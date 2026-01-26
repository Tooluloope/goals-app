import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// NextAuth routes that should be handled by Next.js (not proxied to NestJS)
const NEXTAUTH_ROUTES = [
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/session',
  '/api/auth/callback',
  '/api/auth/csrf',
  '/api/auth/providers',
  '/api/auth/error',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a NextAuth-specific route
  const isNextAuthRoute = NEXTAUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Handle API requests that should be proxied to NestJS
  if (pathname.startsWith('/api/') && !isNextAuthRoute) {
    // Get the session token from cookies
    const sessionToken =
      request.cookies.get('next-auth.session-token')?.value || // Development (HTTP)
      request.cookies.get('__Secure-next-auth.session-token')?.value || // Production (HTTPS)
      request.cookies.get('authjs.session-token')?.value || // Auth.js v5 (HTTP)
      request.cookies.get('__Secure-authjs.session-token')?.value; // Auth.js v5 (HTTPS)

    // For auth routes that need to go to NestJS, rewrite the URL
    if (pathname.startsWith('/api/auth/')) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const url = request.nextUrl.clone();
      url.href = `${apiUrl}${pathname}${url.search}`;

      const requestHeaders = new Headers(request.headers);
      if (sessionToken) {
        requestHeaders.set('x-session-token', sessionToken);
      }

      return NextResponse.rewrite(url, {
        request: {
          headers: requestHeaders,
        },
      });
    }

    // For non-auth API routes, just add the session token header
    if (sessionToken) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-session-token', sessionToken);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
