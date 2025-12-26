import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function middleware(req) {
      const auth = req.headers.get('authorization');

      if (!auth || !auth.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      try {
            const token = auth.split(' ')[1];
            verifyToken(token);
            return NextResponse.next();
      } catch {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
}

export const config = {
      matcher: ['/api/customers/:path*', '/api/invoice/:path*'],
};
