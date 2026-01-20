'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerDashboard() {
      const router = useRouter();
      const [khatas, setKhatas] = useState([]);
      const [loading, setLoading] = useState(true);
      const [selectedKhata, setSelectedKhata] = useState(null);

      useEffect(() => {
            const fetchKhatas = async () => {
                  const token = localStorage.getItem('token');
                  if (!token) {
                        router.push('/');
                        return;
                  }

                  try {
                        // We need an API to fetch all khatas for a logged-in customer phone
                        const res = await fetch('/api/customer/my-khatas', {
                              headers: { Authorization: `Bearer ${token}` }
                        });
                        if (res.ok) {
                              const data = await res.json();
                              setKhatas(data);
                        } else {
                              console.error('Failed to fetch khatas');
                        }
                  } catch (err) {
                        console.error(err);
                  } finally {
                        setLoading(false);
                  }
            };

            fetchKhatas();
      }, [router]);

      const handleLogout = () => {
            localStorage.clear();
            router.push('/');
      };

      if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50">Loading your Khatas...</div>;

      return (
            <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
                  {/* HEADER */}
                  <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm flex justify-between items-center">
                        <div className="flex items-center gap-2">
                              <img src="/logo.png" className="h-8 w-auto object-contain" alt="Logo" />
                              <h1 className="text-xl font-bold">My Khatas</h1>
                        </div>
                        <button onClick={handleLogout} className="text-rose-500 font-bold text-xs uppercase tracking-widest">Logout</button>
                  </div>

                  <main className="max-w-3xl mx-auto p-4 space-y-4">
                        {!selectedKhata ? (
                              <>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Shops you owe or paid</p>
                                    {khatas.length === 0 ? (
                                          <div className="bg-white p-10 rounded-3xl text-center border border-slate-100">
                                                <p className="text-slate-400 text-sm">No active khatas found for your number.</p>
                                          </div>
                                    ) : (
                                          khatas.map((k) => (
                                                <button 
                                                      key={k._id} 
                                                      onClick={() => setSelectedKhata(k)}
                                                      className="w-full bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex justify-between items-center active:scale-[0.98] transition-all"
                                                >
                                                      <div className="text-left">
                                                            <p className="text-lg font-black text-slate-900">{k.ownerId.shopName}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{k.ownerId.ownerName}</p>
                                                      </div>
                                                      <div className="text-right">
                                                            <p className={`text-xl font-black ${k.currentDue > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>₹{k.currentDue}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Balance</p>
                                                      </div>
                                                </button>
                                          ))
                                    )}
                              </>
                        ) : (
                              <div className="space-y-4">
                                    <button onClick={() => setSelectedKhata(null)} className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-4">
                                          ← Back to Shops
                                    </button>
                                    
                                    <div className="bg-emerald-600 p-6 rounded-[32px] text-white shadow-xl shadow-emerald-500/20">
                                          <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">{selectedKhata.ownerId.shopName}</p>
                                          <h2 className="text-3xl font-black mt-1">₹{selectedKhata.currentDue}</h2>
                                          <p className="text-[10px] font-bold opacity-60 uppercase mt-1">Current Pending Balance</p>
                                    </div>

                                    <div className="space-y-3">
                                          {selectedKhata.ledger.slice().reverse().map((t, i) => (
                                                <div key={i} className={`flex ${t.type === 'credit' ? 'justify-end' : 'justify-start'}`}>
                                                      <div className={`p-4 rounded-[24px] text-left max-w-[85%] border shadow-sm ${t.type === 'credit' ? 'bg-white border-emerald-100' : 'bg-slate-100 border-slate-200'}`}>
                                                            <div className="flex justify-between items-center mb-1 gap-4">
                                                                  <span className={`text-[9px] font-black uppercase tracking-widest ${t.type === 'credit' ? 'text-emerald-600' : 'text-slate-500'}`}>{t.type === 'credit' ? 'Purchase' : 'Payment'}</span>
                                                                  <span className="text-[8px] opacity-40 font-bold">{new Date(t.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-sm font-bold text-slate-800">{t.note || 'No description'}</p>
                                                            <p className={`text-lg font-black mt-1 ${t.type === 'credit' ? 'text-emerald-700' : 'text-slate-900'}`}>₹{Math.abs(t.amount)}</p>
                                                      </div>
                                                </div>
                                          ))}
                                    </div>
                              </div>
                        )}
                  </main>
            </div>
      );
}
