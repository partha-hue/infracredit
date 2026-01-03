'use client';
import React, { useState } from 'react';

export default function OwnerProfileForm({ initialOwner }) {
      const [form, setForm] = useState({
            ownerName: initialOwner.ownerName || '',
            shopName: initialOwner.shopName || '',
            email: initialOwner.email || '',
            phone: initialOwner.phone || '',
            avatarUrl: initialOwner.avatarUrl || '',
      });
      const [loading, setLoading] = useState(false);

      const notify = (title) => alert(title);

      const handleSave = async () => {
            setLoading(true);
            try {
                  const res = await fetch('/api/owner/profile', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(form),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) throw new Error(data.error || data.message || 'Update failed');

                  // update local token if provided
                  if (data.token) localStorage.setItem('token', data.token);

                  notify('Profile updated');
                  // reload page to reflect server-side data
                  window.location.reload();
            } catch (err) {
                  console.error('Profile save error:', err);
                  notify('Failed to update profile');
            } finally {
                  setLoading(false);
            }
      };

      return (
            <div className="space-y-4">
                  <div>
                        <label className="text-xs text-slate-400">Owner Name</label>
                        <input className="w-full rounded-md p-2 mt-1 text-sm bg-slate-900 text-white" value={form.ownerName} onChange={(e) => setForm((p) => ({ ...p, ownerName: e.target.value }))} />
                  </div>
                  <div>
                        <label className="text-xs text-slate-400">Shop Name</label>
                        <input className="w-full rounded-md p-2 mt-1 text-sm bg-slate-900 text-white" value={form.shopName} onChange={(e) => setForm((p) => ({ ...p, shopName: e.target.value }))} />
                  </div>
                  <div>
                        <label className="text-xs text-slate-400">Email</label>
                        <input className="w-full rounded-md p-2 mt-1 text-sm bg-slate-900 text-white" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                        <label className="text-xs text-slate-400">Phone</label>
                        <input className="w-full rounded-md p-2 mt-1 text-sm bg-slate-900 text-white" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))} />
                  </div>
                  <div>
                        <label className="text-xs text-slate-400">Avatar URL</label>
                        <input className="w-full rounded-md p-2 mt-1 text-sm bg-slate-900 text-white" value={form.avatarUrl} onChange={(e) => setForm((p) => ({ ...p, avatarUrl: e.target.value }))} />
                  </div>

                  <div className="flex gap-2 justify-end">
                        <button onClick={handleSave} className={`px-4 py-2 rounded-full ${loading ? 'bg-slate-600' : 'bg-emerald-500 text-black'}`}>
                              {loading ? 'Saving…' : 'Save Changes'}
                        </button>
                  </div>
            </div>
      );
}
