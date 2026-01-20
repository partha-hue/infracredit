'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

/* ======================
   2D ICONS (SVG)
====================== */
const MoonIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path></svg>;
const SunIcon = () => <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg>;
const WhatsAppIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.76-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.13.57-.074 1.758-.706 2.006-1.388.248-.682.248-1.265.174-1.388-.074-.124-.272-.198-.57-.347m-4.821 7.454c-1.893 0-3.748-.508-5.37-1.467l-.385-.227-3.991 1.046 1.065-3.891-.249-.396C2.75 15.305 2.1 13.484 2.1 11.59c0-5.243 4.265-9.508 9.51-9.508 2.54 0 4.928.989 6.72 2.782 1.792 1.792 2.782 4.18 2.782 6.726 0 5.243-4.265 9.508-9.51 9.508zM12.002 0C5.373 0 0 5.373 0 12c0 2.123.55 4.197 1.594 6.02L0 24l6.135-1.61c1.746.953 3.713 1.456 5.86 1.456 6.626 0 12-5.374 12-12 0-3.212-1.25-6.232-3.515-8.497C18.232 1.25 15.213 0 12.002 0z"/></svg>;

export default function CustomerDashboard() {
      const router = useRouter();
      const [khatas, setKhatas] = useState([]);
      const [loading, setLoading] = useState(true);
      const [selectedKhata, setSelectedKhata] = useState(null);
      const [theme, setTheme] = useState('light');
      const [search, setSearch] = useState('');
      const [filter, setFilter] = useState('all'); // all, due, cleared
      const [activePage, setActiveTab] = useState('home'); // home, profile

      useEffect(() => {
            const savedTheme = localStorage.getItem('theme') || 'light';
            setTheme(savedTheme);

            const fetchKhatas = async () => {
                  const token = localStorage.getItem('token');
                  if (!token) { router.push('/'); return; }
                  try {
                        const res = await fetch('/api/customer/my-khatas', {
                              headers: { Authorization: `Bearer ${token}` }
                        });
                        if (res.ok) {
                              const data = await res.json();
                              setKhatas(data);
                        }
                  } catch (err) { console.error(err); } finally { setLoading(false); }
            };
            fetchKhatas();
      }, [router]);

      const toggleTheme = () => {
            const next = theme === 'light' ? 'dark' : 'light';
            setTheme(next);
            localStorage.setItem('theme', next);
      };

      const handleLogout = () => {
            localStorage.clear();
            router.push('/');
      };

      const filteredKhatas = useMemo(() => {
            return khatas.filter(k => {
                  const matchesSearch = k.ownerId.shopName.toLowerCase().includes(search.toLowerCase()) || 
                                      k.ownerId.ownerName.toLowerCase().includes(search.toLowerCase());
                  const matchesFilter = filter === 'all' || (filter === 'due' ? k.currentDue > 0 : k.currentDue === 0);
                  return matchesSearch && matchesFilter;
            });
      }, [khatas, search, filter]);

      const isDark = theme === 'dark';
      const rootBg = isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900';
      const headerBg = isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200';

      if (loading) return <div className={`h-screen flex items-center justify-center ${rootBg}`}>Loading...</div>;

      return (
            <div className={`fixed inset-0 flex flex-col overflow-hidden font-sans transition-colors duration-200 ${rootBg}`}>
                  {/* HEADER */}
                  <div className={`px-6 py-4 border-b flex justify-between items-center sticky top-0 z-10 shadow-sm transition-colors ${headerBg}`}>
                        <div className="flex items-center gap-2">
                              <img src="/logo.png" className="h-7 w-auto object-contain" alt="Logo" />
                              <h1 className="text-xl font-bold tracking-tight">{selectedKhata ? 'Statement' : (activePage === 'home' ? 'My Khatas' : 'Profile')}</h1>
                        </div>
                        <div className="flex items-center gap-3">
                              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    {isDark ? <SunIcon /> : <MoonIcon />}
                              </button>
                              <button onClick={() => setActiveTab(activePage === 'home' ? 'profile' : 'home')} className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-black text-white shadow-md overflow-hidden border border-emerald-500">
                                    {activePage === 'home' ? 'P' : '🏠'}
                              </button>
                        </div>
                  </div>

                  <main className="flex-1 overflow-y-auto overflow-x-hidden">
                        {activePage === 'home' ? (
                              !selectedKhata ? (
                                    <div className="p-4 space-y-4">
                                          {/* WHATSAPP STYLE SEARCH */}
                                          <div className={`rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white border border-slate-100'}`}>
                                                <span className="opacity-40">🔍</span>
                                                <input 
                                                      placeholder="Search shop or owner..." 
                                                      className="bg-transparent text-sm outline-none flex-1" 
                                                      value={search} 
                                                      onChange={e => setSearch(e.target.value)} 
                                                />
                                          </div>

                                          {/* QUICK FILTERS */}
                                          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                                {['all', 'due', 'cleared'].map(f => (
                                                      <button 
                                                            key={f} 
                                                            onClick={() => setFilter(f)} 
                                                            className={`px-5 py-2 rounded-full text-[10px] font-black capitalize border transition-all ${filter === f ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : (isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500')}`}
                                                      >
                                                            {f === 'due' ? 'Pending Due' : f}
                                                      </button>
                                                ))}
                                          </div>

                                          {/* SHOP LIST */}
                                          <div className="space-y-3">
                                                {filteredKhatas.length === 0 ? (
                                                      <div className="text-center py-20 opacity-40 italic text-sm">No shops found matching your search.</div>
                                                ) : (
                                                      filteredKhatas.map((k) => (
                                                            <button 
                                                                  key={k._id} 
                                                                  onClick={() => setSelectedKhata(k)}
                                                                  className={`w-full p-5 rounded-[28px] border flex justify-between items-center active:scale-[0.97] transition-all shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
                                                            >
                                                                  <div className="text-left flex items-center gap-4">
                                                                        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-black text-lg">
                                                                              {k.ownerId.shopName[0].toUpperCase()}
                                                                        </div>
                                                                        <div>
                                                                              <p className="text-base font-black">{k.ownerId.shopName}</p>
                                                                              <p className="text-[10px] opacity-50 font-bold uppercase tracking-widest">{k.ownerId.ownerName}</p>
                                                                        </div>
                                                                  </div>
                                                                  <div className="text-right">
                                                                        <p className={`text-xl font-black ${k.currentDue > 0 ? 'text-amber-500' : 'text-emerald-600'}`}>₹{k.currentDue}</p>
                                                                        <p className="text-[9px] font-black opacity-40 uppercase tracking-tighter">Current Balance</p>
                                                                  </div>
                                                            </button>
                                                      ))
                                                )}
                                          </div>
                                    </div>
                              ) : (
                                    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
                                          {/* CHAT HEADER */}
                                          <div className={`p-4 border-b flex items-center gap-4 sticky top-0 z-10 ${headerBg}`}>
                                                <button onClick={() => setSelectedKhata(null)} className="text-2xl opacity-60">←</button>
                                                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-black text-white">{selectedKhata.ownerId.shopName[0].toUpperCase()}</div>
                                                <div>
                                                      <p className="text-base font-black">{selectedKhata.ownerId.shopName}</p>
                                                      <p className="text-[10px] text-emerald-500 font-bold uppercase">Online Now</p>
                                                </div>
                                          </div>

                                          {/* BANNER */}
                                          <div className="bg-amber-500/10 border-b border-amber-500/20 py-4 px-6 flex justify-between items-center">
                                                <div>
                                                      <span className="text-[9px] font-black uppercase text-amber-600/70 tracking-widest">Total Pending</span>
                                                      <p className="text-2xl font-black text-amber-600 tracking-tight">₹{selectedKhata.currentDue}</p>
                                                </div>
                                                <div className="bg-amber-500/20 px-4 py-1.5 rounded-full border border-amber-500/30">
                                                      <span className="text-[10px] font-black text-amber-700 uppercase">Statement</span>
                                                </div>
                                          </div>

                                          {/* LEDGER CHAT */}
                                          <div className={`flex-1 p-4 space-y-4 ${isDark ? 'bg-slate-900' : 'bg-slate-50/50'}`}>
                                                {selectedKhata.ledger.slice().reverse().map((t, i) => (
                                                      <div key={i} className={`flex ${t.type === 'credit' ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`p-4 rounded-[24px] text-left max-w-[85%] border shadow-md transition-all ${t.type === 'credit' ? (isDark ? 'bg-emerald-700 text-white border-emerald-600' : 'bg-emerald-600 text-white border-emerald-500') : (isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-100')}`}>
                                                                  <div className="flex justify-between items-center mb-2 gap-6">
                                                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-70">{t.type === 'credit' ? 'Purchased' : 'Paid'}</span>
                                                                        <span className="text-[8px] opacity-60 font-bold">{new Date(t.createdAt).toLocaleDateString()}</span>
                                                                  </div>
                                                                  <p className="text-sm font-bold leading-snug mb-2">{t.note || 'No description'}</p>
                                                                  <p className="text-xl font-black tracking-tight">₹{Math.abs(t.amount)}</p>
                                                            </div>
                                                      </div>
                                                ))}
                                          </div>
                                    </div>
                              )
                        ) : (
                              /* PROFILE MANAGEMENT SECTION */
                              <div className="p-6 space-y-8 animate-scale-up">
                                    <div className="flex flex-col items-center">
                                          <div className="w-24 h-24 rounded-full bg-emerald-600 flex items-center justify-center text-3xl font-black text-white shadow-xl border-4 border-white dark:border-slate-800 mb-4">P</div>
                                          <h2 className="text-2xl font-black">My Settings</h2>
                                          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Manage your account</p>
                                    </div>

                                    <div className={`p-6 rounded-[32px] border space-y-6 shadow-xl ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
                                          <div className="space-y-4">
                                                <button className={`w-full py-4 px-6 rounded-2xl border flex items-center gap-4 transition-all active:scale-95 ${isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-slate-50 border-slate-100 hover:bg-white'}`}>
                                                      <span className="text-xl">👤</span>
                                                      <div className="text-left"><p className="text-sm font-black">Edit Name</p><p className="text-[10px] opacity-50">Change your display name</p></div>
                                                </button>
                                                <button className={`w-full py-4 px-6 rounded-2xl border flex items-center gap-4 transition-all active:scale-95 ${isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-slate-50 border-slate-100 hover:bg-white'}`}>
                                                      <span className="text-xl">🔒</span>
                                                      <div className="text-left"><p className="text-sm font-black">Change Password</p><p className="text-[10px] opacity-50">Update your security code</p></div>
                                                </button>
                                                <button onClick={handleLogout} className="w-full py-4 px-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center gap-4 transition-all active:scale-95">
                                                      <span className="text-xl">🚪</span>
                                                      <div className="text-left"><p className="text-sm font-black">Logout Now</p><p className="text-[10px] opacity-50">Securely sign out</p></div>
                                                </button>
                                          </div>
                                    </div>
                              </div>
                        )}
                  </main>

                  {/* CUSTOMER BOTTOM NAV */}
                  {!selectedKhata && (
                        <nav className={`border-t flex items-center justify-around py-3 pb-6 sticky bottom-0 z-20 transition-colors ${headerBg}`}>
                              <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center transition-all ${activePage === 'home' ? 'text-emerald-500 scale-110' : 'opacity-40'}`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                                    <span className="text-[10px] font-bold mt-1">Home</span>
                              </button>
                              <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center transition-all ${activePage === 'profile' ? 'text-emerald-500 scale-110' : 'opacity-40'}`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                    <span className="text-[10px] font-bold mt-1">Profile</span>
                              </button>
                        </nav>
                  )}

                  <style jsx global>{`
                        @keyframes scale-up { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                        .no-scrollbar::-webkit-scrollbar { display: none; }
                  `}</style>
            </div>
      );
}
