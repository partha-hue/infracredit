'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OwnerProfileForm from '@/components/OwnerProfileForm';

export default function ProfilePage() {
      const router = useRouter();
      const [data, setData] = useState(null);
      const [loading, setLoading] = useState(true);
      const [theme, setTheme] = useState('light');

      useEffect(() => {
            // Sync theme from localStorage
            const savedTheme = localStorage.getItem('theme') || 'light';
            setTheme(savedTheme);

            const fetchProfile = async () => {
                  const token = localStorage.getItem('token');
                  if (!token) {
                        router.push('/');
                        return;
                  }

                  try {
                        const res = await fetch('/api/owner/profile', {
                              headers: { Authorization: `Bearer ${token}` },
                              cache: 'no-store'
                        });

                        if (res.ok) {
                              const json = await res.json();
                              setData(json);
                        } else {
                              router.push('/');
                        }
                  } catch (err) {
                        console.error('Profile fetch error:', err);
                  } finally {
                        setLoading(false);
                  }
            };

            fetchProfile();
      }, [router]);

      const isDark = theme === 'dark';

      if (loading) {
            return (
                  <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
            );
      }

      if (!data) return null;

      return (
            <div className={`min-h-screen transition-colors duration-200 ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans`}>
                  <div className={`border-b px-6 py-4 sticky top-0 z-10 shadow-sm ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className="max-w-3xl mx-auto flex items-center gap-4">
                              <button onClick={() => router.push('/shops')} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                              </button>
                              <h1 className="text-xl font-bold">Account Settings</h1>
                        </div>
                  </div>

                  <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-8">
                        <section className={`rounded-2xl p-6 shadow-sm border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                              <div className="flex items-center gap-4 mb-6">
                                    <div className="relative">
                                          <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center text-2xl font-black text-white shadow-inner overflow-hidden">
                                                {data.owner.avatarUrl ? (
                                                      <img src={data.owner.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                      data.owner.ownerName?.[0]?.toUpperCase()
                                                )}
                                          </div>
                                    </div>
                                    <div>
                                          <h2 className={`text-2xl font-black ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{data.owner.ownerName}</h2>
                                          <p className="text-slate-500 text-sm font-medium">{data.owner.shopName}</p>
                                    </div>
                              </div>

                              <OwnerProfileForm initialOwner={data.owner} deletedCustomers={data.deletedCustomers} isDark={isDark} />
                        </section>
                  </div>
            </div>
      );
}
