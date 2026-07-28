// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  if (req.nextUrl.pathname.startsWith('/astoriahorrorclub')) {
    res.headers.set('X-Robots-Tag', 'noindex, follow');
  }
  return res;
}

export const config = { matcher: ['/astoriahorrorclub/:path*'] };
