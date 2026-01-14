import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import OwnerProfileForm from '@/components/OwnerProfileForm';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
      const token = cookies().get('token')?.value;
      if (!token) {
            redirect('/');
      }

      const base = process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
      
      const url = new URL('/api/owner/profile', base);
      const res = await fetch(url.toString(), { 
            headers: { Authorization: `Bearer ${token}` }, 
            cache: 'no-store' 
      });

      if (!res.ok) {
            redirect('/');
      }

      const { owner, deletedCustomers } = await res.json();

      return (
            <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
                  {/* PROFESSIONAL HEADER */}
                  <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
                        <div className="max-w-3xl mx-auto flex items-center gap-4">
                              <a href="/shops" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                              </a>
                              <h1 className="text-xl font-bold">Account Settings</h1>
                        </div>
                  </div>

                  <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-8">
                        {/* PROFILE INFO */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                              <div className="flex items-center gap-4 mb-6">
                                    <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center text-2xl font-black text-white shadow-inner">
                                          {owner.avatarUrl ? (
                                                <img src={owner.avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
                                          ) : (
                                                owner.ownerName?.[0]?.toUpperCase()
                                          )}
                                    </div>
                                    <div>
                                          <h2 className="text-2xl font-black text-slate-900">{owner.ownerName}</h2>
                                          <p className="text-slate-500 text-sm font-medium">{owner.shopName}</p>
                                    </div>
                              </div>

                              <OwnerProfileForm initialOwner={owner} deletedCustomers={deletedCustomers} />
                        </section>
                  </div>
            </div>
      );
}
