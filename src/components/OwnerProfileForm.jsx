'use client';
import React, { useState } from 'react';

export default function OwnerProfileForm({ initialOwner, deletedCustomers, isDark }) {
      const [form, setForm] = useState({
            ownerName: initialOwner.ownerName || '',
            shopName: initialOwner.shopName || '',
            email: initialOwner.email || '',
            phone: initialOwner.phone || '',
            avatarUrl: initialOwner.avatarUrl || '',
            bio: initialOwner.bio || '',
      });
      const [passwords, setPasswords] = useState({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
      });
      const [loading, setLoading] = useState(false);
      const [activeTab, setActiveTab] = useState('profile');

      const notify = (title) => alert(title);

      const handleAvatarUpload = async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) return notify('Only images allowed');
            if (file.size > 1_200_000) return notify('Image too large (Max 1.2MB)');

            setLoading(true);
            try {
                  const fd = new FormData();
                  fd.append('file', file);
                  const res = await fetch('/api/owner/avatar', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                        body: fd
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Upload failed');
                  setForm(p => ({ ...p, avatarUrl: data.owner.avatarUrl }));
                  notify('Profile picture updated!');
                  window.location.reload();
            } catch (err) {
                  notify(err.message);
            } finally {
                  setLoading(false);
            }
      };

      const handleSave = async () => {
            setLoading(true);
            try {
                  const res = await fetch('/api/owner/profile', {
                        method: 'PATCH',
                        headers: { 
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('token')}` 
                        },
                        body: JSON.stringify(form),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Update failed');
                  if (data.token) localStorage.setItem('token', data.token);
                  notify('Profile updated successfully');
                  window.location.reload();
            } catch (err) {
                  notify(err.message);
            } finally {
                  setLoading(false);
            }
      };

      const handlePasswordChange = async () => {
            if (!passwords.currentPassword || !passwords.newPassword) {
                  return notify('Please fill in all password fields');
            }
            if (passwords.newPassword !== passwords.confirmPassword) {
                  return notify('New passwords do not match');
            }

            setLoading(true);
            try {
                  const res = await fetch('/api/owner/profile', {
                        method: 'PATCH',
                        headers: { 
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('token')}` 
                        },
                        body: JSON.stringify({ 
                              currentPassword: passwords.currentPassword,
                              newPassword: passwords.newPassword 
                        }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Password update failed');
                  notify('Password updated successfully');
                  setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } catch (err) {
                  notify(err.message);
            } finally {
                  setLoading(false);
            }
      };

      const handleRestore = async (id) => {
            setLoading(true);
            try {
                  const res = await fetch('/api/owner/profile', {
                        method: 'PATCH',
                        headers: { 
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('token')}` 
                        },
                        body: JSON.stringify({ restoreCustomerId: id }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Restore failed');
                  notify('Customer restored successfully!');
                  window.location.reload();
            } catch (err) {
                  notify(err.message);
            } finally {
                  setLoading(false);
            }
      };

      const inputClass = `w-full rounded-xl border p-3 mt-1 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`;
      const labelClass = `text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`;

      return (
            <div>
                  {/* AVATAR WITH PLUS SIGN */}
                  <div className="flex justify-center mb-8">
                        <div className="relative group">
                              <div className="w-24 h-24 rounded-full bg-emerald-600 flex items-center justify-center text-3xl font-black text-white shadow-xl overflow-hidden border-4 border-white dark:border-slate-800">
                                    {form.avatarUrl ? <img src={form.avatarUrl} className="w-full h-full object-cover" /> : initialOwner.ownerName?.[0]?.toUpperCase()}
                              </div>
                              <label className="absolute bottom-0 right-0 bg-emerald-500 hover:bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-transform active:scale-90">
                                    <span className="text-xl font-bold">+</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                              </label>
                        </div>
                  </div>

                  {/* TABS */}
                  <div className={`flex border-b mb-6 overflow-x-auto no-scrollbar ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                        {['profile', 'security', 'restore'].map(tab => (
                              <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab ? 'text-emerald-600 border-b-2 border-emerald-600' : (isDark ? 'text-slate-500' : 'text-slate-400')}`}
                              >
                                    {tab === 'profile' ? 'Basic Info' : tab === 'security' ? 'Security' : 'Restore'}
                                    {tab === 'restore' && deletedCustomers?.length > 0 && <span className="ml-2 bg-rose-100 text-rose-600 text-[10px] px-1.5 py-0.5 rounded-full">{deletedCustomers.length}</span>}
                              </button>
                        ))}
                  </div>

                  {activeTab === 'profile' && (
                        <div className="space-y-5">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                          <label className={labelClass}>Shop Name</label>
                                          <input className={inputClass} value={form.shopName} onChange={(e) => setForm((p) => ({ ...p, shopName: e.target.value }))} />
                                    </div>
                                    <div>
                                          <label className={labelClass}>Owner Name</label>
                                          <input className={inputClass} value={form.ownerName} onChange={(e) => setForm((p) => ({ ...p, ownerName: e.target.value }))} />
                                    </div>
                              </div>
                              <div>
                                    <label className={labelClass}>Bio / Business Tagline</label>
                                    <textarea 
                                          className={`${inputClass} min-h-[80px]`} 
                                          value={form.bio} 
                                          placeholder="Write something about your business..."
                                          onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} 
                                    />
                              </div>
                              <div>
                                    <label className={labelClass}>Phone Number</label>
                                    <input className={inputClass} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))} />
                              </div>
                              <div>
                                    <label className={labelClass}>Email Address</label>
                                    <input className={inputClass} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                              </div>
                              <div className="pt-4 flex justify-end">
                                    <button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all w-full sm:w-auto">{loading ? 'Saving...' : 'Update Profile'}</button>
                              </div>
                        </div>
                  )}

                  {activeTab === 'security' && (
                        <div className="space-y-5">
                              <div>
                                    <label className={labelClass}>Current Password</label>
                                    <input type="password" className={inputClass} value={passwords.currentPassword} onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))} />
                              </div>
                              <div>
                                    <label className={labelClass}>New Password</label>
                                    <input type="password" className={inputClass} value={passwords.newPassword} onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))} />
                              </div>
                              <div>
                                    <label className={labelClass}>Confirm New Password</label>
                                    <input type="password" className={inputClass} value={passwords.confirmPassword} onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))} />
                              </div>
                              <div className="pt-4 flex justify-end">
                                    <button onClick={handlePasswordChange} disabled={loading} className={`px-8 py-3 rounded-2xl text-sm font-black shadow-lg active:scale-95 transition-all w-full sm:w-auto ${isDark ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-white'}`}>{loading ? 'Updating...' : 'Change Password'}</button>
                              </div>
                        </div>
                  )}

                  {activeTab === 'restore' && (
                        <div className="space-y-3">
                              {deletedCustomers?.length === 0 ? (
                                    <div className="text-center py-10"><p className="text-slate-400 text-sm italic">No deleted customers found.</p></div>
                              ) : (
                                    deletedCustomers.map((c) => (
                                          <div key={c._id} className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                                <div>
                                                      <p className="text-sm font-bold">{c.name}</p>
                                                      <p className="text-[10px] opacity-50">{c.phone}</p>
                                                      <p className="text-[9px] text-rose-500 font-bold mt-1 uppercase">Deleted: {new Date(c.deletedAt).toLocaleDateString()}</p>
                                                </div>
                                                <button onClick={() => handleRestore(c._id)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${isDark ? 'bg-emerald-600 text-white' : 'bg-white border border-emerald-200 text-emerald-600'}`}>Restore</button>
                                          </div>
                                    ))
                              )}
                        </div>
                  )}
            </div>
      );
}
