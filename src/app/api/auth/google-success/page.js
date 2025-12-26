'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GoogleSuccess() {
      const router = useRouter();
      const searchParams = useSearchParams();

      useEffect(() => {
            const token = searchParams.get('token');
            if (token) {
                  localStorage.setItem('token', token);
                  router.replace('/shops');
            } else {
                  router.replace('/?google=error');
            }
      }, [router, searchParams]);

      return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
                  Finishing Google sign-in...
            </div>
      );
}
