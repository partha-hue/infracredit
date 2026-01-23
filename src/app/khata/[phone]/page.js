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
      const [theme, setTheme] = useState('light'); 
      const [viewingProfile, setViewingProfile] = useState(null);
      
      const [toast, setToast] = useState(null);

      const showToast = (message, type = 'success') => {
            setToast({ message, type });
      };

      useEffect(() => {
            const load = async () => {
                  try {
                        const token = getToken();

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

      const rootBg = isDark ? 'bg-slate-950' : 'bg-slate-50';
      const textColor = isDark ? 'text-slate-100' : 'text-slate-900';
      const headerBg = isDark ? 'bg-slate-900/80 backdrop-blur-md' : 'bg-white/80 backdrop-blur-md';
      const borderCol = isDark ? 'border-slate-800' : 'border-slate-200';
      
      const toggleTheme = () => {
            const next = isDark ? 'light' : 'dark';
            setTheme(next);
            showToast(`Theme: ${next}`);
      };

      if (loading) {
            return (
                  <div className={`min-h-screen flex items-center justify-center ${rootBg} ${textColor}`}>
                        <div className="flex flex-col items-center gap-4">
                              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                              <p className="text-sm font-black uppercase tracking-widest opacity-40">Syncing Ledger</p>
                        </div>
                  </div>
            );
      }

      if (!customer) {
            return (
                  <div className={`min-h-screen flex flex-col items-center justify-center p-8 text-center ${rootBg} ${textColor}`}>
                        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-4">
                              <span className="text-3xl">⚠️</span>
                        </div>
                        <h2 className="text-xl font-black mb-2">Khata Not Found</h2>
                        <p className="text-sm text-slate-500 mb-6">We couldn't find a digital ledger for this number. Please check the link or contact the shop owner.</p>
                  </div>
            );
      }

      return (
            <div className={`min-h-screen ${rootBg} ${textColor} flex flex-col font-sans transition-colors duration-200 pb-safe`}>
                  {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

                  {/* APP HEADER */}
                  <div className={`flex items-center justify-between px-6 py-4 pt-safe ${headerBg} border-b ${borderCol} sticky top-0 z-10 shadow-sm`}>
                        <div className="flex items-center gap-3">
                              <button onClick={() => setViewingProfile({ 
                                    name: customer.ownerId?.shopName || 'Shop Profile', 
                                    avatarUrl: customer.ownerId?.avatarUrl, 
                                    sub: customer.ownerId?.ownerName || 'Owner', 
                                    phone: customer.ownerId?.phone,
                                    bio: customer.ownerId?.bio
                              })} className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-sm font-black text-white shadow-lg overflow-hidden ring-2 ring-white/10">
                                    {customer.ownerId?.avatarUrl ? <img src={customer.ownerId.avatarUrl} className="w-full h-full object-cover" /> : (customer.ownerId?.shopName?.[0]?.toUpperCase() || 'S')}
                              </button>
                              <div>
                                    <p className="text-base font-black tracking-tight">{customer.ownerId?.shopName || 'Shop'}</p>
                                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Verified Merchant</p>
                              </div>
                        </div>

                        <button
                              onClick={toggleTheme}
                              className={`p-2.5 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'} transition-colors shadow-sm`}
                        >
                              {isDark ? '☀️' : '🌙'}
                        </button>
                  </div>

                  {/* DUE BANNER - Material 3 Style Card */}
                  <div className="px-4 mt-6">
                        <div className={`p-6 rounded-[2.5rem] ${isDark ? 'bg-emerald-950/30 border border-emerald-500/20' : 'bg-emerald-600 shadow-xl shadow-emerald-500/20'} flex justify-between items-center overflow-hidden relative`}>
                              <div className="relative z-10">
                                    <p className={`text-[10px] ${isDark ? 'text-emerald-500' : 'text-emerald-100'} font-black uppercase tracking-[0.2em] mb-1`}>Total Amount Payable</p>
                                    <p className={`text-4xl font-black ${isDark ? 'text-emerald-400' : 'text-white'} tracking-tighter`}>₹{customer.currentDue}</p>
                              </div>
                              <div className={`relative z-10 px-4 py-2 rounded-2xl ${isDark ? 'bg-emerald-500/20' : 'bg-white/20 backdrop-blur-md'}`}>
                                    <p className={`text-[10px] ${isDark ? 'text-emerald-400' : 'text-white'} font-black uppercase`}>Pending</p>
                              </div>
                              {/* Background decorative circles */}
                              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                              <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl"></div>
                        </div>
                  </div>

                  {/* HISTORY LABEL */}
                  <div className="px-6 mt-8 mb-4 flex items-center justify-between">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Transaction History</p>
                        <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800 ml-4"></div>
                  </div>

                  {/* CHAT/LEDGER AREA */}
                  <main className="flex-1 px-4 pb-12 space-y-4">
                        {[...(customer.ledger || [])].reverse().map((t, i) => {
                              const isCredit = t.type === 'credit';
                              return (
                                    <div key={i} className={`flex ${isCredit ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom duration-500`} style={{ animationDelay: `${i * 50}ms` }}>
                                          <div className={`max-w-[90%] rounded-[1.8rem] p-5 shadow-sm border transition-all hover:scale-[1.02] ${isCredit 
                                                ? (isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900 shadow-xl shadow-slate-200/50') 
                                                : (isDark ? 'bg-emerald-900/20 border-emerald-500/20 text-emerald-100' : 'bg-emerald-50 border-emerald-100 text-emerald-900')}`}>
                                                
                                                <div className="flex justify-between items-center mb-3 gap-8">
                                                      <span className={`text-[9px] font-black uppercase tracking-widest ${isCredit ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                            {isCredit ? 'Udhaar Taken' : 'Payment Done'}
                                                      </span>
                                                      <span className="text-[8px] opacity-40 font-bold uppercase">
                                                            {new Date(t.date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                      </span>
                                                </div>
                                                
                                                <div className="text-sm font-medium leading-relaxed mb-3">{t.note || 'No description provided'}</div>
                                                
                                                <div className="flex justify-between items-end">
                                                      <div className={`text-2xl font-black tracking-tight ${isCredit ? (isDark ? 'text-white' : 'text-slate-900') : 'text-emerald-600'}`}>
                                                            ₹{Math.abs(t.amount)}
                                                      </div>
                                                      {t.balanceAfter !== undefined && (
                                                            <div className="text-[9px] font-black opacity-30 uppercase tracking-tighter">
                                                                  Bal: ₹{t.balanceAfter}
                                                            </div>
                                                      )}
                                                </div>
                                          </div>
                                    </div>
                              );
                        })}
                        
                        {(!customer.ledger || customer.ledger.length === 0) && (
                              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                                          <span className="text-2xl">📋</span>
                                    </div>
                                    <p className="text-sm font-bold uppercase tracking-widest opacity-30">No Transactions Found</p>
                              </div>
                        )}
                  </main>

                  {/* FOOTER */}
                  <footer className={`p-8 ${rootBg} text-center`}>
                        <img src="/logo.png" className="h-6 mx-auto mb-2 grayscale opacity-20" alt="Logo" />
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Digital Khata • InfraCredit</p>
                  </footer>

                  {/* WHATSAPP STYLE PROFILE VIEWER MODAL */}
                  {viewingProfile && (
                        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
                              <button onClick={() => setViewingProfile(null)} className="absolute top-8 right-8 text-white/50 w-12 h-12 flex items-center justify-center bg-white/10 rounded-full hover:text-white transition-all">✕</button>
                              
                              <div className="w-full max-w-sm flex flex-col items-center">
                                    <div className="w-48 h-48 rounded-[3rem] bg-emerald-600 flex items-center justify-center text-6xl font-black text-white shadow-2xl overflow-hidden ring-4 ring-white/10 mb-8">
                                          {viewingProfile.avatarUrl ? <img src={viewingProfile.avatarUrl} className="w-full h-full object-cover" /> : (viewingProfile.name?.[0]?.toUpperCase() || 'S')}
                                    </div>
                                    
                                    <div className="text-center w-full">
                                          <h2 className="text-3xl font-black text-white mb-1 tracking-tight">{viewingProfile.name}</h2>
                                          <p className="text-emerald-500 font-black uppercase tracking-widest text-[10px] mb-8">{viewingProfile.sub}</p>
                                          
                                          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-left space-y-6">
                                                <div>
                                                      <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] mb-2">Business Bio</p>
                                                      <p className="text-white font-medium leading-relaxed">"{viewingProfile.bio || 'Verified Merchant on InfraCredit Digital Khata System'}"</p>
                                                </div>
                                                
                                                <div className="flex gap-4">
                                                      <a href={`tel:${viewingProfile.phone}`} className="flex-1 p-5 rounded-[1.5rem] bg-white text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"></path></svg>
                                                            Call Shop
                                                      </a>
                                                </div>
                                          </div>
                                    </div>
                              </div>
                        </div>
                  )}

                  <style jsx global>{`
                        @keyframes scale-up { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                        .animate-in { animation: scale-up 0.3s ease-out; }
                        .slide-in-from-bottom { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
                  `}</style>
            </div>
      );
}
