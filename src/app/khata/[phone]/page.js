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

// Normalize Indian mobile numbers on client side. Mirrors server behavior:
// - strips non-digits
// - removes leading 0091 / 91 / 0 only when doing so still leaves >= 10 digits
// - accepts numbers that are exactly 10 digits (fallback)
const normalizeIndianMobile = (rawPhone) => {
      if (!rawPhone) return null;
      const original = String(rawPhone);
      let digits = original.replace(/\D/g, '');

      if (digits.startsWith('0091') && digits.length - 4 >= 10) {
            digits = digits.slice(4);
      } else if (digits.startsWith('91') && digits.length - 2 >= 10) {
            digits = digits.slice(2);
      } else if (digits.startsWith('0') && digits.length - 1 >= 10) {
            digits = digits.slice(1);
      }

      // Indian mobile numbers usually start with 6-9 and have 10 digits
      if (/^[6-9]\d{9}$/.test(digits)) return digits;

      // Fallback: accept any 10-digit number for compatibility
      if (digits.length === 10) return digits;

      return null;
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

                        const normalizedPhone = normalizeIndianMobile(phone);
                        const res = await fetch(`/api/customers/${encodeURIComponent(normalizedPhone ?? phone)}`, {
                              headers: token ? { Authorization: `Bearer ${token}` } : {},
                        });

                        if (!res.ok) {
                              const errBody = await res.json().catch(() => null);
                              const msg = errBody?.error || `Failed to load customer (status ${res.status})`;
                              throw new Error(msg);
                        }

                        const data = await res.json();
                        setCustomer(data);
                  } catch (err) {
                        console.error(err);
                        alert(err?.message || 'Unable to load your khata. Please contact shop owner.');
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
