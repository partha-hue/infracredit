'use client';

import React, { useEffect, useState } from 'react';
import Toast from '@/components/Toast';

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
      const phoneParam = React.use(params).phone;

      const [customer, setCustomer] = useState(null);
      const [loading, setLoading] = useState(true);
      const [theme, setTheme] = useState('light'); // Default to light mode for clear visibility
      const [viewingProfile, setViewingProfile] = useState(null);
      
      const [toast, setToast] = useState(null);

      const showToast = (message, type = 'success') => {
            setToast({ message, type });
      };

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
                                          wb.register();
                                    })
                                    .catch((err) => {
                                          console.error('Workbox load failed', err);
                                    });
                        }

                        let normalizedPhone = normalizeIndianMobile(phoneParam);

                        if (!normalizedPhone) {
                              const rawDigits = String(phoneParam || '').replace(/\D/g, '');
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
                        showToast(err?.message || 'Unable to load your khata.', 'error');
                  } finally {
                        setLoading(false);
                  }
            };

            load();
      }, [phoneParam]);

      const isDark = theme === 'dark';

      const rootBg = isDark ? 'bg-slate-900' : 'bg-slate-50';
      const textColor = isDark ? 'text-slate-100' : 'text-slate-900';
      const headerBg = isDark ? 'bg-slate-900' : 'bg-white';
      const borderCol = isDark ? 'border-slate-800' : 'border-slate-200';
      const chatBg = isDark
            ? 'bg-[radial-gradient(circle_at_top,#1f2937,#020617)]'
            : 'bg-white';
      const bubbleCredit = isDark
            ? 'bg-emerald-600 text-white'
            : 'bg-emerald-100 text-emerald-900 border border-emerald-200';
      const bubblePayment = isDark
            ? 'bg-slate-800 text-slate-100'
            : 'bg-slate-100 text-slate-800 border border-slate-200';

      const toggleTheme = () => {
            const next = isDark ? 'light' : 'dark';
            setTheme(next);
            showToast(`Theme: ${next}`);
      };

      if (loading) {
            return (
                  <div className={`min-h-screen flex items-center justify-center ${rootBg} ${textColor}`}>
                        <div className="flex flex-col items-center gap-2">
                              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                              <p className="text-sm">Loading Khata...</p>
                        </div>
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
            <div className={`min-h-screen ${rootBg} ${textColor} flex flex-col font-sans transition-colors duration-200`}>
                  {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

                  {/* APP HEADER */}
                  <div className={`flex items-center justify-between px-4 py-3 ${headerBg} border-b ${borderCol} sticky top-0 z-10 shadow-sm`}>
                        <div className="flex items-center gap-3">
                              <button onClick={() => setViewingProfile({ 
                                    name: customer.ownerId?.shopName || 'Shop Profile', 
                                    avatarUrl: customer.ownerId?.avatarUrl, 
                                    sub: customer.ownerId?.ownerName || 'Owner', 
                                    phone: customer.ownerId?.phone,
                                    bio: customer.ownerId?.bio
                              })} className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold text-white shadow-sm overflow-hidden">
                                    {customer.ownerId?.avatarUrl ? <img src={customer.ownerId.avatarUrl} className="w-full h-full object-cover" /> : (customer.ownerId?.shopName?.[0]?.toUpperCase() || 'S')}
                              </button>
                              <div>
                                    <p className="text-base font-bold">{customer.ownerId?.shopName || 'Shop'}</p>
                                    <p className="text-xs text-slate-500">Khata for {customer.name}</p>
                              </div>
                        </div>

                        <button
                              onClick={toggleTheme}
                              className={`p-2 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'} transition-colors`}
                        >
                              {isDark ? '☀️' : '🌙'}
                        </button>
                  </div>

                  {/* DUE BANNER */}
                  <div className="px-4 py-4 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
                        <div>
                              <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Total Pending</p>
                              <p className="text-2xl font-black text-amber-600">₹{customer.currentDue}</p>
                        </div>
                        <div className="bg-amber-100 px-3 py-1 rounded-full">
                              <p className="text-[10px] text-amber-800 font-bold">UNPAID</p>
                        </div>
                  </div>

                  {/* HISTORY LABEL */}
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Transaction History</p>
                  </div>

                  {/* CHAT/LEDGER AREA */}
                  <main className={`flex-1 overflow-y-auto px-4 py-6 space-y-4 ${chatBg}`}>
                        {[...(customer.ledger || [])].reverse().map((t, i) => {
                              const isCredit = t.type === 'credit';
                              return (
                                    <div key={i} className={`flex ${isCredit ? 'justify-end' : 'justify-start'}`}>
                                          <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${isCredit ? bubbleCredit : bubblePayment}`}>
                                                <div className="flex justify-between items-center mb-1">
                                                      <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">
                                                            {isCredit ? 'Credit (Taken)' : 'Payment (Given)'}
                                                      </span>
                                                      <span className="text-[9px] opacity-60 font-medium">
                                                            {new Date(t.date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                      </span>
                                                </div>
                                                <div className="text-sm font-medium leading-relaxed">{t.note || 'No description'}</div>
                                                <div className={`mt-2 text-xl font-black ${isCredit ? 'text-white' : 'text-slate-900'}`}>
                                                      ₹{t.amount}
                                                </div>
                                                {t.balanceAfter !== undefined && (
                                                      <div className="mt-1 pt-1 border-t border-black/5 text-[9px] font-bold opacity-50 text-right">
                                                            Balance After: ₹{t.balanceAfter}
                                                      </div>
                                                )}
                                          </div>
                                    </div>
                              );
                        })}
                        
                        {(!customer.ledger || customer.ledger.length === 0) && (
                              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                                    <p className="text-sm">No transactions yet.</p>
                              </div>
                        )}
                  </main>

                  {/* FOOTER */}
                  <div className={`p-4 ${headerBg} border-t ${borderCol} text-center`}>
                        <p className="text-[10px] text-slate-400 font-medium">This is a digital khata powered by InfraCredit</p>
                  </div>

                  {/* WHATSAPP STYLE PROFILE VIEWER MODAL */}
                  {viewingProfile && (
                        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
                              <button onClick={() => setViewingProfile(null)} className="absolute top-6 right-6 text-white text-3xl font-light hover:rotate-90 transition-transform">✕</button>
                              <div className="w-full max-w-sm flex flex-col items-center space-y-6">
                                    <div className="w-64 h-64 rounded-[40px] bg-emerald-600 flex items-center justify-center text-7xl font-black text-white shadow-2xl overflow-hidden border-4 border-white/10">
                                          {viewingProfile.avatarUrl ? <img src={viewingProfile.avatarUrl} className="w-full h-full object-cover" /> : (viewingProfile.name?.[0]?.toUpperCase() || 'S')}
                                    </div>
                                    <div className="text-center space-y-2">
                                          <h2 className="text-3xl font-black text-white">{viewingProfile.name}</h2>
                                          <p className="text-emerald-500 font-bold uppercase tracking-widest text-sm">{viewingProfile.sub}</p>
                                          
                                          {/* Detailed View Section */}
                                          <div className="mt-4 w-full bg-white/5 backdrop-blur-md rounded-3xl p-6 text-left space-y-4 border border-white/10">
                                                <div>
                                                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">About / Bio</p>
                                                      <p className="text-white font-medium italic leading-relaxed text-sm">"{viewingProfile.bio || 'Available on InfraCredit'}"</p>
                                                </div>
                                                <div>
                                                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Phone Number</p>
                                                      <p className="text-white font-bold">{viewingProfile.phone || 'N/A'}</p>
                                                </div>
                                                <div className="flex gap-4 pt-2">
                                                      <a href={`tel:${viewingProfile.phone}`} className="flex-1 p-4 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                                            <span className="text-xs font-bold">Call Shop</span>
                                                      </a>
                                                </div>
                                          </div>
                                    </div>
                              </div>
                        </div>
                  )}

                  <style jsx global>{`
                        @keyframes scale-up { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                        .animate-in { animation: scale-up 0.2s ease-out; }
                  `}</style>
            </div>
      );
}
