'use client';

import React, { useEffect, useState } from 'react';

/* ======================
   OPTIONAL TOKEN HELPER
   (use if endpoint requires owner token)
====================== */
const getToken = () => {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem('token');
};

export default function CustomerKhataPage({ params }) {
      const { phone } = params;

      const [customer, setCustomer] = useState(null);
      const [loading, setLoading] = useState(true);
      const [theme, setTheme] = useState('dark'); // dark | light

      useEffect(() => {
            const load = async () => {
                  try {
                        const token = getToken();

                        const res = await fetch(`/api/customers/${encodeURIComponent(phone)}`, {
                              headers: token ? { Authorization: `Bearer ${token}` } : {},
                        });

                        if (!res.ok) throw new Error('Failed to load customer');
                        const data = await res.json();
                        setCustomer(data);
                  } catch (err) {
                        console.error(err);
                        alert('Unable to load your khata. Please contact shop owner.');
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
                  <div
                        className={`min-h-screen flex items-center justify-center ${rootBg} ${textColor}`}
                  >
                        Loading...
                  </div>
            );
      }

      if (!customer) {
            return (
                  <div
                        className={`min-h-screen flex items-center justify-center ${rootBg} ${textColor}`}
                  >
                        Could not find your khata.
                  </div>
            );
      }

      return (
            <div className={`min-h-screen ${rootBg} ${textColor} flex flex-col`}>
                  {/* Header like Android WhatsApp chat */}
                  <div
                        className={`flex items-center justify-between px-4 py-3 ${headerBg} border-b border-slate-800`}
                  >
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
                              title="Toggle theme"
                        >
                              {isDark ? '🌙' : '☀️'}
                        </button>
                  </div>

                  {/* Current due card */}
                  <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300">
                        Current Due: ₹{customer.currentDue}
                  </div>

                  {/* Ledger messages */}
                  <main
                        className={`flex-1 overflow-y-auto px-2 sm:px-4 py-3 space-y-1 ${chatBg}`}
                  >
                        {customer.ledger && customer.ledger.length > 0 && (
                              <div className="flex justify-center mb-2">
                                    <span className="text-[10px] bg-slate-800 text-slate-300 rounded-full px-3 py-1">
                                          Your borrow history
                                    </span>
                              </div>
                        )}

                        {[...(customer.ledger || [])]
                              .slice()
                              .reverse()
                              .map((t, i) => {
                                    const isCredit = t.type === 'credit';
                                    const bubbleClass = isCredit ? bubbleCredit : bubblePayment;
                                    const justify = isCredit ? 'flex-end' : 'flex-start';

                                    return (
                                          <div
                                                key={i}
                                                className="w-full clearfix flex"
                                                style={{ justifyContent: justify }}
                                          >
                                                <div
                                                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs shadow-sm ${bubbleClass}`}
                                                >
                                                      <div className="flex justify-between items-center gap-2">
                                                            <span className="font-semibold">
                                                                  {isCredit ? 'Udhaar' : 'Payment'}
                                                            </span>
                                                            <span className="text-[10px] opacity-80">{t.date}</span>
                                                      </div>
                                                      <div className="mt-1 text-[11px]">{t.note || '-'}</div>
                                                      <div className="mt-1 text-right text-sm font-bold">
                                                            ₹{t.amount}
                                                      </div>
                                                </div>
                                          </div>
                                    );
                              })}

                        {(!customer.ledger || customer.ledger.length === 0) && (
                              <div className="flex flex-col items-center justify-center h-full text-xs text-slate-500">
                                    <p>No entries yet.</p>
                                    <p>Please check again after the shop adds your transactions.</p>
                              </div>
                        )}
                  </main>

                  {/* Read‑only: no input bar here */}
            </div>
      );
}
