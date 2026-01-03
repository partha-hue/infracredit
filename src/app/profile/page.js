import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import OwnerProfileForm from '@/components/OwnerProfileForm';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
      const token = cookies().get('token')?.value;
      if (!token) {
            // redirect to home/login
            redirect('/');
      }

      // server-side fetch owner profile
      const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
      const url = new URL('/api/owner/profile', base);
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      if (!res.ok) {
            console.error('Failed to fetch owner profile on server', await res.text().catch(() => ''));
            redirect('/');
      }

      const owner = await res.json();

      return (
            <div className="min-h-screen bg-slate-950 text-white p-6">
                  <div className="max-w-3xl mx-auto">
                        <h1 className="text-2xl font-semibold mb-4">Profile</h1>
                        <p className="text-sm text-slate-400 mb-6">Edit your shop details and contact information.</p>

                        <div className="bg-slate-800 rounded-xl p-6">
                              <div className="mb-4">
                                    <p className="text-xs text-slate-400">Owner</p>
                                    <h2 className="text-lg font-semibold">{owner.ownerName}</h2>
                              </div>

                              <OwnerProfileForm initialOwner={owner} />
                        </div>
                  </div>
            </div>
      );
}