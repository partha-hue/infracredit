'use client';
import React, { useState } from 'react';

export default function OwnerProfileForm({ initialOwner, deletedCustomers }) {
      const [form, setForm] = useState({
            ownerName: initialOwner.ownerName || '',
            shopName: initialOwner.shopName || '',
            email: initialOwner.email || '',
            phone: initialOwner.phone || '',
            avatarUrl: initialOwner.avatarUrl || '',
      });
      const [loading, setLoading] = useState(false);
      const [activeTab, setActiveTab] = useState('profile');

      const notify = (title) => alert(title);

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

      return (
            <div>
                  {/* TABS */}
                  <div className="flex border-b border-slate-200 mb-6">
                        <button 
                              onClick={() => setActiveTab('profile')}
                              className={`px-4 py-2 text-sm font-bold ${activeTab === 'profile' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400'}`}
                        >
                              Basic Info
                        </button>
                        <button 
                              onClick={() => setActiveTab('restore')}
                              className={`px-4 py-2 text-sm font-bold flex items-center gap-2 ${activeTab === 'restore' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400'}`}
                        >
                              Restore Customers
                              {deletedCustomers?.length > 0 && (
                                    <span className="bg-rose-100 text-rose-600 text-[10px] px-1.5 py-0.5 rounded-full">
                                          {deletedCustomers.length}
                                    </span>
                              )}
                        </button>
                  </div>

                  {activeTab === 'profile' ? (
                        <div className="space-y-5">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shop Name</label>
                                          <input 
                                                className="w-full rounded-xl border border-slate-200 p-3 mt-1 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" 
                                                value={form.shopName} 
                                                onChange={(e) => setForm((p) => ({ ...p, shopName: e.target.value }))} 
                                          />
                                    </div>
                                    <div>
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Owner Name</label>
                                          <input 
                                                className="w-full rounded-xl border border-slate-200 p-3 mt-1 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" 
                                                value={form.ownerName} 
                                                onChange={(e) => setForm((p) => ({ ...p, ownerName: e.target.value }))} 
                                          />
                                    </div>
                              </div>
                              
                              <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                                    <input 
                                          className="w-full rounded-xl border border-slate-200 p-3 mt-1 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-mono" 
                                          value={form.phone} 
                                          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))} 
                                    />
                              </div>

                              <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                                    <input 
                                          className="w-full rounded-xl border border-slate-200 p-3 mt-1 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" 
                                          value={form.email} 
                                          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} 
                                    />
                              </div>

                              <div className="pt-4 flex justify-end">
                                    <button 
                                          onClick={handleSave} 
                                          disabled={loading}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                                    >
                                          {loading ? 'Saving...' : 'Update Profile'}
                                    </button>
                              </div>
                        </div>
                  ) : (
                        <div className="space-y-3">
                              {deletedCustomers?.length === 0 ? (
                                    <div className="text-center py-10">
                                          <p className="text-slate-400 text-sm italic">No deleted customers to restore.</p>
                                    </div>
                              ) : (
                                    deletedCustomers.map((c) => (
                                          <div key={c._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors">
                                                <div>
                                                      <p className="text-sm font-bold text-slate-900">{c.name}</p>
                                                      <p className="text-[10px] text-slate-500">{c.phone}</p>
                                                      <p className="text-[9px] text-rose-500 font-bold mt-1">Deleted: {new Date(c.deletedAt).toLocaleDateString()}</p>
                                                </div>
                                                <button 
                                                      onClick={() => handleRestore(c._id)}
                                                      className="bg-white border border-emerald-200 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-emerald-50 transition-all"
                                                >
                                                      Restore
                                                </button>
                                          </div>
                                    ))
                              )}
                        </div>
                  )}
            </div>
      );
}
