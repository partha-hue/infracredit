'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

/* ======================
   2D ICONS (SVG)
====================== */
const MoonIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path></svg>;
const SunIcon = () => <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg>;

export default function CustomerDashboard() {
      const router = useRouter();
      const [khatas, setKhatas] = useState([]);
      const [loading, setLoading] = useState(true);
      const [selectedKhata, setSelectedKhata] = useState(null);
      const [theme, setTheme] = useState('light');
      const [search, setSearch] = useState('');
      const [filter, setFilter] = useState('all'); // all, due, cleared
      const [activePage, setActiveTab] = useState('home'); // home, profile
      const [profileData, setProfileData] = useState({ name: '', avatarUrl: '' });
      const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });

      useEffect(() => {
            const savedTheme = localStorage.getItem('theme') || 'light';
            setTheme(savedTheme);

            const loadData = async () => {
                  const token = localStorage.getItem('token');
                  if (!token) { router.push('/'); return; }
                  try {
                        const [khataRes, profileRes] = await Promise.all([
                              fetch('/api/customer/my-khatas', { headers: { Authorization: `Bearer ${token}` } }),
                              fetch('/api/customer/profile', { headers: { Authorization: `Bearer ${token}` } })
                        ]);
                        if (khataRes.ok) setKhatas(await khataRes.json());
                        if (profileRes.ok) setProfileData(await profileRes.json());
                  } catch (err) { console.error(err); } finally { setLoading(false); }
            };
            loadData();
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

      const handleProfileUpdate = async () => {
            try {
                  const res = await fetch('/api/customer/profile', {
                        method: 'PATCH',
                        headers: { 
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({ name: profileData.name })
                  });
                  if (res.ok) alert('Name updated!');
            } catch (err) { alert(err.message); }
      };

      const handlePasswordUpdate = async () => {
            if (passwords.newPassword !== passwords.confirmPassword) return alert('Passwords mismatch');
            try {
                  const res = await fetch('/api/customer/profile', {
                        method: 'PATCH',
                        headers: { 
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({ newPassword: passwords.newPassword })
                  });
                  if (res.ok) alert('Password updated!');
            } catch (err) { alert(err.message); }
      };

      const handleAvatarUpload = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onloadend = async () => {
                  try {
                        const res = await fetch('/api/customer/profile', {
                              method: 'PATCH',
                              headers: { 
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                              },
                              body: JSON.stringify({ avatarUrl: reader.result })
                        });
                        if (res.ok) {
                              setProfileData(p => ({ ...p, avatarUrl: reader.result }));
                              alert('Avatar updated!');
                        }
                  } catch (err) { alert(err.message); }
            };
            reader.readAsDataURL(file);
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
                                    {profileData.avatarUrl ? <img src={profileData.avatarUrl} className="w-full h-full object-cover" /> : (activePage === 'home' ? 'P' : '🏠')}
                              </button>
                        </div>
                  </div>

                  <main className="flex-1 overflow-y-auto overflow-x-hidden">
                        {activePage === 'home' ? (
                              !selectedKhata ? (
                                    <div className="p-4 space-y-4">
                                          <div className={`rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm ${isDark ? 'bg-slate-800' : 'bg-white border border-slate-100'}`}>
                                                <span className="opacity-40">🔍</span>
                                                <input placeholder="Search shop..." className="bg-transparent text-sm outline-none flex-1" value={search} onChange={e => setSearch(e.target.value)} />
                                          </div>
                                          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                                {['all', 'due', 'cleared'].map(f => (
                                                      <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2 rounded-full text-[10px] font-black capitalize border transition-all ${filter === f ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : (isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500')}`}>{f === 'due' ? 'Pending' : f}</button>
                                                ))}
                                          </div>
                                          <div className="space-y-3">
                                                {filteredKhatas.map((k) => (
                                                      <button key={k._id} onClick={() => setSelectedKhata(k)} className={`w-full p-5 rounded-[28px] border flex justify-between items-center active:scale-[0.97] transition-all shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                                                            <div className="text-left flex items-center gap-4">
                                                                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-black text-lg overflow-hidden">
                                                                        {k.ownerId.avatarUrl ? <img src={k.ownerId.avatarUrl} className="w-full h-full object-cover" /> : k.ownerId.shopName[0].toUpperCase()}
                                                                  </div>
                                                                  <div><p className="text-base font-black">{k.ownerId.shopName}</p><p className="text-[10px] opacity-50 font-bold uppercase tracking-widest">{k.ownerId.ownerName}</p></div>
                                                            </div>
                                                            <div className="text-right"><p className={`text-xl font-black ${k.currentDue > 0 ? 'text-amber-500' : 'text-emerald-600'}`}>₹{k.currentDue}</p></div>
                                                      </button>
                                                ))}
                                          </div>
                                    </div>
                              ) : (
                                    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
                                          <div className={`p-4 border-b flex items-center gap-4 sticky top-0 z-10 ${headerBg}`}>
                                                <button onClick={() => setSelectedKhata(null)} className="text-2xl opacity-60">←</button>
                                                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-black text-white overflow-hidden">
                                                      {selectedKhata.ownerId.avatarUrl ? <img src={selectedKhata.ownerId.avatarUrl} className="w-full h-full object-cover" /> : selectedKhata.ownerId.shopName[0].toUpperCase()}
                                                </div>
                                                <div><p className="text-base font-black">{selectedKhata.ownerId.shopName}</p><p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Online Now</p></div>
                                          </div>
                                          <div className="bg-amber-500/10 border-b border-amber-500/20 py-4 px-6 flex justify-between items-center">
                                                <div><span className="text-[9px] font-black uppercase text-amber-600/70 tracking-widest">Balance</span><p className="text-2xl font-black text-amber-600 tracking-tight">₹{selectedKhata.currentDue}</p></div>
                                          </div>
                                          <div className={`flex-1 p-4 space-y-4 ${isDark ? 'bg-slate-900' : 'bg-slate-50/50'}`}>
                                                {selectedKhata.ledger.slice().reverse().map((t, i) => (
                                                      <div key={i} className={`flex ${t.type === 'credit' ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`p-4 rounded-[24px] text-left max-w-[85%] border shadow-md transition-all ${t.type === 'credit' ? (isDark ? 'bg-emerald-700 text-white border-emerald-600' : 'bg-emerald-600 text-white border-emerald-500') : (isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-100')}`}>
                                                                  <div className="flex justify-between items-center mb-2 gap-6"><span className="text-[9px] font-black uppercase tracking-widest opacity-70">{t.type === 'credit' ? 'Purchased' : 'Paid'}</span><span className="text-[8px] opacity-60 font-bold">{new Date(t.createdAt).toLocaleDateString()}</span></div>
                                                                  <p className="text-sm font-bold leading-snug mb-2">{t.note || 'No description'}</p><p className="text-xl font-black tracking-tight">₹{Math.abs(t.amount)}</p>
                                                            </div>
                                                      </div>
                                                ))}
                                          </div>
                                    </div>
                              )
                        ) : (
                              <div className="p-6 space-y-8 animate-scale-up">
                                    <div className="flex flex-col items-center">
                                          <div className="relative group">
                                                <div className="w-24 h-24 rounded-full bg-emerald-600 flex items-center justify-center text-3xl font-black text-white shadow-xl border-4 border-white dark:border-slate-800 overflow-hidden">
                                                      {profileData.avatarUrl ? <img src={profileData.avatarUrl} className="w-full h-full object-cover" /> : 'P'}
                                                </div>
                                                <label className="absolute bottom-0 right-0 bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg cursor-pointer active:scale-90 transition-all"><span className="text-xl font-bold">+</span><input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} /></label>
                                          </div>
                                          <h2 className="text-2xl font-black mt-4">My Settings</h2>
                                    </div>
                                    <div className={`p-6 rounded-[32px] border space-y-4 shadow-xl ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
                                          <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Full Name</label>
                                                <div className="flex gap-2"><input className={`flex-1 p-3 rounded-xl border text-sm outline-none ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`} value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} /><button onClick={handleProfileUpdate} className="bg-emerald-600 text-white px-4 rounded-xl font-bold text-xs">Save</button></div>
                                          </div>
                                          <div className="space-y-3 pt-4 border-t border-slate-800">
                                                <label className="text-[10px] font-black uppercase tracking-widest opacity-50">New Password</label>
                                                <input type="password" placeholder="New Password" className={`w-full p-3 rounded-xl border text-sm outline-none ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`} value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} />
                                                <input type="password" placeholder="Confirm Password" className={`w-full p-3 rounded-xl border text-sm outline-none ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'}`} value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} />
                                                <button onClick={handlePasswordUpdate} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold text-xs">Update Security</button>
                                          </div>
                                          <button onClick={handleLogout} className="w-full py-4 mt-4 rounded-2xl bg-rose-500/10 text-rose-500 font-black text-xs uppercase tracking-widest border border-rose-500/20 active:scale-95 transition-all">Logout Now</button>
                                    </div>
                              </div>
                        )}
                  </main>

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
