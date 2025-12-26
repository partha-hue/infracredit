'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Mark as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

function GoogleSuccessContent() {
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

export default function GoogleSuccess() {
      return (
            <Suspense fallback={
                  <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
                        Loading...
                  </div>
            }>
                  <GoogleSuccessContent />
            </Suspense>
      );
}
