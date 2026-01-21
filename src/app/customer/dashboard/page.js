'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';

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
      const [profileData, setProfileData] = useState({ name: '', avatarUrl: '', phone: '' });
      const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
      const [viewingProfile, setViewingProfile] = useState(null); // To view owner or customer profile
      
      const [toast, setToast] = useState(null);

      const showToast = (message, type = 'success') => {
            setToast({ message, type });
      };

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
            showToast(`Theme: ${next}`);
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
                  if (res.ok) showToast('Name updated successfully');
                  else throw new Error('Update failed');
            } catch (err) { showToast(err.message, 'error'); }
      };

      const handlePasswordUpdate = async () => {
            if (passwords.newPassword !== passwords.confirmPassword) return showToast('Passwords mismatch', 'error');
            try {
                  const res = await fetch('/api/customer/profile', {
                        method: 'PATCH',
                        headers: { 
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({ newPassword: passwords.newPassword })
                  });
                  if (res.ok) {
                        showToast('Password updated successfully');
                        setPasswords({ newPassword: '', confirmPassword: '' });
                  } else throw new Error('Update failed');
            } catch (err) { showToast(err.message, 'error'); }
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
                              showToast('Profile picture updated');
                        } else throw new Error('Upload failed');
                  } catch (err) { showToast(err.message, 'error'); }
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
                  {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

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
                              <button onClick={() => setViewingProfile({ name: profileData.name, avatarUrl: profileData.avatarUrl, sub: 'Customer Profile', phone: profileData.phone })} className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-black text-white shadow-md overflow-hidden border border-emerald-500">
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
                                                      <div key={k._id} className={`w-full p-5 rounded-[28px] border flex justify-between items-center transition-all shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                                                            <div className="text-left flex items-center gap-4 flex-1">
                                                                  <button onClick={(e) => { e.stopPropagation(); setViewingProfile({ name: k.ownerId.shopName, avatarUrl: k.ownerId.avatarUrl, sub: k.ownerId.ownerName, phone: k.ownerId.phone }); }} className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-lg overflow-hidden shadow-inner">
                                                                        {k.ownerId.avatarUrl ? <img src={k.ownerId.avatarUrl} className="w-full h-full object-cover" /> : k.ownerId.shopName[0].toUpperCase()}
                                                                  </button>
                                                                  <button onClick={() => setSelectedKhata(k)} className="flex-1 text-left">
                                                                        <p className="text-base font-black">{k.ownerId.shopName}</p>
                                                                        <p className="text-[10px] opacity-50 font-bold uppercase tracking-widest">{k.ownerId.ownerName}</p>
                                                                  </button>
                                                            </div>
                                                            <div className="text-right"><p className={`text-xl font-black ${k.currentDue > 0 ? 'text-amber-500' : 'text-emerald-600'}`}>₹{k.currentDue}</p></div>
                                                      </div>
                                                ))}
                                          </div>
                                    </div>
                              ) : (
                                    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
                                          <div className={`p-4 border-b flex items-center gap-4 sticky top-0 z-10 ${headerBg}`}>
                                                <button onClick={() => setSelectedKhata(null)} className="text-2xl opacity-60">←</button>
                                                <button onClick={() => setViewingProfile({ name: selectedKhata.ownerId.shopName, avatarUrl: selectedKhata.ownerId.avatarUrl, sub: selectedKhata.ownerId.ownerName, phone: selectedKhata.ownerId.phone })} className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-black text-white overflow-hidden shadow-md">
                                                      {selectedKhata.ownerId.avatarUrl ? <img src={selectedKhata.ownerId.avatarUrl} className="w-full h-full object-cover" /> : selectedKhata.ownerId.shopName[0].toUpperCase()}
                                                </button>
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

                  {/* WHATSAPP STYLE PROFILE VIEWER MODAL */}
                  {viewingProfile && (
                        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
                              <button onClick={() => setViewingProfile(null)} className="absolute top-6 right-6 text-white text-3xl font-light hover:rotate-90 transition-transform">✕</button>
                              <div className="w-full max-w-sm flex flex-col items-center space-y-6">
                                    <div className="w-64 h-64 rounded-[40px] bg-emerald-600 flex items-center justify-center text-7xl font-black text-white shadow-2xl overflow-hidden border-4 border-white/10">
                                          {viewingProfile.avatarUrl ? <img src={viewingProfile.avatarUrl} className="w-full h-full object-cover" /> : viewingProfile.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="text-center space-y-2">
                                          <h2 className="text-3xl font-black text-white">{viewingProfile.name}</h2>
                                          <p className="text-emerald-500 font-bold uppercase tracking-widest text-sm">{viewingProfile.sub}</p>
                                          
                                          {/* Detailed View Section */}
                                          <div className="mt-4 w-full bg-white/5 backdrop-blur-md rounded-3xl p-6 text-left space-y-4 border border-white/10">
                                                <div>
                                                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Contact Info</p>
                                                      <p className="text-white font-bold">{viewingProfile.phone || 'N/A'}</p>
                                                </div>
                                                <div>
                                                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">About</p>
                                                      <p className="text-emerald-400 font-bold">Verified Professional on InfraCredit</p>
                                                </div>
                                                <div className="flex gap-4 pt-2">
                                                      <a href={`tel:${viewingProfile.phone}`} className="flex-1 p-4 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                                            <span className="text-xs font-bold">Call</span>
                                                      </a>
                                                      {viewingProfile.phone && (
                                                            <a href={`https://wa.me/91${viewingProfile.phone}`} target="_blank" className="flex-1 p-4 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2">
                                                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.76-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.13.57-.074 1.758-.706 2.006-1.388.248-.682.248-1.265.174-1.388-.074-.124-.272-.198-.57-.347m-4.821 7.454c-1.893 0-3.748-.508-5.37-1.467l-.385-.227-3.991 1.046 1.065-3.891-.249-.396C2.75 15.305 2.1 13.484 2.1 11.59c0-5.243 4.265-9.508 9.51-9.508 2.54 0 4.928.989 6.72 2.782 1.792 1.792 2.782 4.18 2.782 6.726 0 5.243-4.265 9.508-9.51 9.508zM12.002 0C5.373 0 0 5.373 0 12c0 2.123.55 4.197 1.594 6.02L0 24l6.135-1.61c1.746.953 3.713 1.456 5.86 1.456 6.626 0 12-5.374 12-12 0-3.212-1.25-6.232-3.515-8.497C18.232 1.25 15.213 0 12.002 0z"/></svg>
                                                                  <span className="text-xs font-bold">Chat</span>
                                                            </a>
                                                      )}
                                                </div>
                                          </div>
                                    </div>
                              </div>
                        </div>
                  )}

                  <style jsx global>{`
                        @keyframes scale-up { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                        .no-scrollbar::-webkit-scrollbar { display: none; }
                        .animate-in { animation: scale-up 0.2s ease-out; }
                  `}</style>
            </div>
      );
}
