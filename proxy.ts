import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  // Expose the current pathname as a request header so server components
  // (layout.tsx files) can read it without needing the `usePathname` hook.
  // This is required by every portal layout for its login-page bypass check.
  requestHeaders.set('x-pathname', request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/intel/:path*',
    '/iam/:path*',
    '/finance/:path*',
    '/comms/:path*',
    // Client-facing portals — must be included so x-pathname is set
    // and each layout can correctly bypass auth on its own login page.
    '/portal/:path*',
    '/partner/:path*',
    '/cepc/:path*',
    '/recycler/:path*',
    '/recycler-portal/:path*',
    '/legal-portal/:path*',
    '/telecalling/:path*',
    '/manager/:path*',
    '/taskmanager/:path*',
    '/academy/:path*',
    '/tendering/:path*',
    '/knowledge/:path*',
    '/ops/:path*',
  ],
};
