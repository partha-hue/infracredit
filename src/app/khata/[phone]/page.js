'use client';

import React, { useEffect, useState } from 'react';

/* ======================
   OPTIONAL TOKEN HELPER
====================== */
const getToken = () => {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem('token');
};

// Normalize Indian mobile numbers
const normalizeIndianMobile = (rawPhone) => {
      if (!rawPhone) return null;
      let digits = String(rawPhone).replace(/\D/g, '');

      if (digits.startsWith('0091') && digits.length - 4 >= 10) {
            digits = digits.slice(4);
      } else if (digits.startsWith('91') && digits.length - 2 >= 10) {
            digits = digits.slice(2);
      } else if (digits.startsWith('0') && digits.length - 1 >= 10) {
            digits = digits.slice(1);
      }

      if (/^[6-9]\d{9}$/.test(digits)) return digits;
      if (digits.length === 10) return digits;

      return null;
};

export const dynamic = 'force-dynamic';

export default function CustomerKhataPage({ params }) {
      const { phone } = params;

      const [customer, setCustomer] = useState(null);
      const [loading, setLoading] = useState(true);
      const [theme, setTheme] = useState('dark');

      useEffect(() => {
            const load = async () => {
                  try {
                        const token = getToken();

                        /* ✅ SAFE SERVICE WORKER REGISTRATION */
                        if (
                              typeof window !== 'undefined' &&
                              'serviceWorker' in navigator &&
                              process.env.NODE_ENV === 'production'
                        ) {
                              import('workbox-window')
                                    .then(({ Workbox }) => {
                                          const wb = new Workbox('/sw.js');

                                          wb.addEventListener('installed', (event) => {
                                                if (event.isUpdate) {
                                                      console.debug('New service worker installed');
                                                }
                                          });

                                          wb.register();
                                    })
                                    .catch((err) => {
                                          console.error('Workbox load failed', err);
                                    });
                        }

                        let normalizedPhone = normalizeIndianMobile(phone);

                        if (!normalizedPhone) {
                              const rawDigits = String(phone || '').replace(/\D/g, '');
                              if (rawDigits.length === 10) {
                                    normalizedPhone = rawDigits;
                              }
                        }

                        if (!normalizedPhone) {
                              throw new Error('Invalid phone number in link');
                        }

                        const res = await fetch(
                              `/api/customers/${encodeURIComponent(normalizedPhone)}`,
                              {
                                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                              }
                        );

                        if (!res.ok) {
                              const errBody = await res.json().catch(() => null);
                              throw new Error(
                                    errBody?.error || `Failed to load customer (${res.status})`
                              );
                        }

                        const data = await res.json();
                        setCustomer(data);
                  } catch (err) {
                        console.error(err);
                        alert(
                              err?.message ||
                              'Unable to load your khata. Please contact shop owner.'
                        );
                  } finally {
                        setLoading(false);
                  }
            };

            load();
      }, [phone]);

      const isDark = theme === 'dark';

      const rootBg = isDark ? 'bg-slate-900' : 'bg-slate-100';
      const textColor = isDark ? 'text-slate-100' : 'text-slate-900';
      const headerBg = isDark ? 'bg-slate-900' : 'bg-white';
      const chatBg = isDark
            ? 'bg-[radial-gradient(circle_at_top,#1f2937,#020617)]'
            : 'bg-[radial-gradient(circle_at_top,#e5e7eb,#ffffff)]';
      const bubbleCredit = isDark
            ? 'bg-emerald-600 text-slate-900'
            : 'bg-emerald-500 text-white';
      const bubblePayment = isDark
            ? 'bg-slate-800 text-slate-100'
            : 'bg-white text-slate-900';

      if (loading) {
            return (
                  <div className={`min-h-screen flex items-center justify-center ${rootBg} ${textColor}`}>
                        Loading...
                  </div>
            );
      }

      if (!customer) {
            return (
                  <div className={`min-h-screen flex items-center justify-center ${rootBg} ${textColor}`}>
                        Could not find your khata.
                  </div>
            );
      }

      return (
            <div className={`min-h-screen ${rootBg} ${textColor} flex flex-col`}>
                  <div className={`flex items-center justify-between px-4 py-3 ${headerBg} border-b border-slate-800`}>
                        <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                                    {customer.name?.[0]?.toUpperCase() || 'C'}
                              </div>
                              <div>
                                    <p className="text-sm font-semibold">{customer.name}</p>
                                    <p className="text-[10px] text-slate-400">{customer.phone}</p>
                              </div>
                        </div>

                        <button
                              onClick={() => setTheme(isDark ? 'light' : 'dark')}
                              className="text-xl"
                        >
                              {isDark ? '🌙' : '☀️'}
                        </button>
                  </div>

                  <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300">
                        Current Due: ₹{customer.currentDue}
                  </div>

                  <main className={`flex-1 overflow-y-auto px-2 sm:px-4 py-3 space-y-1 ${chatBg}`}>
                        {[...(customer.ledger || [])].reverse().map((t, i) => {
                              const isCredit = t.type === 'credit';
                              return (
                                    <div key={i} className={`flex ${isCredit ? 'justify-end' : 'justify-start'}`}>
                                          <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs shadow-sm ${isCredit ? bubbleCredit : bubblePayment}`}>
                                                <div className="flex justify-between text-[10px] opacity-80">
                                                      <span>{isCredit ? 'Udhaar' : 'Payment'}</span>
                                                      <span>{t.date}</span>
                                                </div>
                                                <div className="mt-1">{t.note || '-'}</div>
                                                <div className="mt-1 text-right font-bold">₹{t.amount}</div>
                                          </div>
                                    </div>
                              );
                        })}
                  </main>
            </div>
      );
}
