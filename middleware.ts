// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(req: NextRequest) {
  const token = req.headers.get('authorization');

  if (!token) {
    console.error('Unauthorized');
    return (
      NextResponse.json({ message: 'Unauthorized' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return NextResponse.next();
}

// Optionally apply it only to certain paths
export const config = {
  matcher: ['/api/attendees/:path*'],
};
