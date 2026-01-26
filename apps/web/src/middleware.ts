import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Only handle API requests that will be proxied to NestJS (not /api/auth/*)
  if (
    request.nextUrl.pathname.startsWith('/api/') &&
    !request.nextUrl.pathname.startsWith('/api/auth/')
  ) {
    // Get the session token from cookies
    const sessionToken =
      request.cookies.get('next-auth.session-token')?.value || // Development (HTTP)
      request.cookies.get('__Secure-next-auth.session-token')?.value || // Production (HTTPS)
      request.cookies.get('authjs.session-token')?.value || // Auth.js v5 (HTTP)
      request.cookies.get('__Secure-authjs.session-token')?.value; // Auth.js v5 (HTTPS)

    if (sessionToken) {
      // Clone the request headers and add the session token
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-session-token', sessionToken);

      // Create a new request with the modified headers
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
