'use client';

import React, {
      useEffect,
      useState,
      useMemo,
      useRef,
      useCallback,
} from 'react';
import { useRouter } from 'next/navigation';

/* ======================
   TOKEN HELPER
====================== */
const getToken = () => {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem('token');
};

/* ======================
   DATE/TIME FORMATTER
====================== */
const formatDateTime = (value) => {
      if (!value) return '';
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
      });
};

/* ======================
   PUBLIC KHATA URL HELPER
====================== */
const getPublicKhataUrl = (phone) => {
      const origin =
            typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      return `${origin}/khata/${encodeURIComponent(phone)}`;
};

/* ======================
   API LAYER
====================== */
const API = {
      listCustomers: async () => {
            const token = getToken();
            const res = await fetch('/api/customers', { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Failed to load');
            return data;
      },
      getOwner: async () => {
            const token = getToken();
            const res = await fetch('/api/owner/profile', { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Failed to load owner');
            return data;
      },
      addCustomer: async (name, phone) => {
            const token = getToken();
            const res = await fetch('/api/customers', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ name, phone }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Failed to add');
            return data;
      },
      addTxn: async (phone, type, amount, note) => {
            const token = getToken();
            const res = await fetch(`/api/customers/${encodeURIComponent(phone)}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ type, amount, note, date: new Date().toISOString() }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Transaction failed');
            return data;
      },
      updateLedger: async (phone, ledger) => {
            const token = getToken();
            const res = await fetch(`/api/customers/${encodeURIComponent(phone)}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ ledger }),
            });
            return res.json();
      }
};

/* ======================
   ICONS
====================== */
const MoonIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor" /></svg>;
const SunIcon = () => <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="4" fill="currentColor" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>;

export default function OwnerDashboard() {
      const router = useRouter();
      const [customers, setCustomers] = useState([]);
      const [selected, setSelected] = useState(null);
      const [loading, setLoading] = useState(true);
      const [ownerProfile, setOwnerProfile] = useState(null);

      const [newName, setNewName] = useState('');
      const [newPhone, setNewPhone] = useState('');
      const [txnType, setTxnType] = useState('credit');
      const [txnAmount, setTxnAmount] = useState('');
      const [txnNote, setTxnNote] = useState('');

      const [search, setSearch] = useState('');
      const [filter, setFilter] = useState('all');
      const [theme, setTheme] = useState('dark');
      const isDark = theme === 'dark';

      const [isMobileView, setIsMobileView] = useState(true);
      const [showListOnMobile, setShowListOnMobile] = useState(true);

      const [pdfModalOpen, setPdfModalOpen] = useState(false);
      const [pdfType, setPdfType] = useState('ledger');
      const [pdfLoading, setPdfLoading] = useState(false);
      const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

      const load = async () => {
            try {
                  const token = getToken();
                  if (!token) { router.push('/'); return; }
                  const [data, ownerRes] = await Promise.all([API.listCustomers(), API.getOwner()]);
                  setCustomers(data);
                  setOwnerProfile(ownerRes.owner);
                  if (!selected && data.length) setSelected(data[0]);
            } catch (err) { console.error(err); } finally { setLoading(false); }
      };

      useEffect(() => { load(); }, []);

      useEffect(() => {
            const handleResize = () => {
                  const mobile = window.innerWidth < 768;
                  setIsMobileView(mobile);
                  if (!mobile) setShowListOnMobile(true);
            };
            handleResize();
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
      }, []);

      const handleAddCustomer = async () => {
            if (!newName || newPhone.length !== 10) return alert('Enter valid details');
            try {
                  const created = await API.addCustomer(newName, newPhone);
                  setCustomers(p => [...p, created]);
                  setSelected(created);
                  setNewName(''); setNewPhone('');
                  if (isMobileView) setShowListOnMobile(false);
            } catch (err) { alert(err.message); }
      };

      const handleSaveTxn = async () => {
            if (!selected || !txnAmount) return;
            try {
                  const updated = await API.addTxn(selected.phone, txnType, Number(txnAmount), txnNote);
                  setSelected(updated);
                  setCustomers(prev => prev.map(c => c.phone === updated.phone ? updated : c));
                  setTxnAmount(''); setTxnNote('');
            } catch (err) { alert(err.message); }
      };

      const handleGeneratePdf = async (phone, type) => {
            setPdfLoading(true);
            try {
                  const url = type === 'invoice' ? '/api/invoice/gst' : `/api/customers/${encodeURIComponent(phone)}/pdf?type=ledger`;
                  const body = type === 'invoice' ? JSON.stringify({ customer: selected.name, amount: selected.currentDue }) : null;
                  
                  const res = await fetch(url, {
                        method: type === 'invoice' ? 'POST' : 'GET',
                        headers: { 
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${getToken()}` 
                        },
                        body
                  });
                  if (!res.ok) throw new Error('Failed to generate PDF');
                  const blob = await res.blob();
                  setPdfBlobUrl(URL.createObjectURL(blob));
            } catch (err) { alert(err.message); } finally { setPdfLoading(false); }
      };

      const rootBg = isDark ? 'bg-slate-900' : 'bg-slate-50';
      const textColor = isDark ? 'text-slate-100' : 'text-slate-900';
      const sidebarBg = isDark ? 'bg-slate-950' : 'bg-white';
      const headerBg = isDark ? 'bg-slate-900' : 'bg-white';

      if (loading) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white">Loading Dashboard...</div>;

      return (
            <div className={`fixed inset-0 ${rootBg} ${textColor} flex flex-col md:flex-row overflow-hidden`}>
                  <div className="flex flex-1 h-full w-full overflow-hidden">
                        {/* SIDEBAR */}
                        {(showListOnMobile || !isMobileView) && (
                              <aside className={`w-full md:w-80 ${sidebarBg} border-r border-slate-800 flex flex-col h-full`}>
                                    <div className={`flex items-center justify-between px-4 py-3 ${headerBg} border-b border-slate-800`}>
                                          <div>
                                                <h1 className="text-lg font-bold text-emerald-500">InfraCredit</h1>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Digital Khata</p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                                <button onClick={() => router.push('/profile')} className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white shadow-lg overflow-hidden">
                                                      {ownerProfile?.avatarUrl ? <img src={ownerProfile.avatarUrl} className="w-full h-full object-cover" /> : ownerProfile?.ownerName?.[0]}
                                                </button>
                                                <button onClick={() => setTheme(isDark ? 'light' : 'dark')}>{isDark ? <MoonIcon /> : <SunIcon />}</button>
                                          </div>
                                    </div>

                                    {/* Add Customer */}
                                    <div className="p-4 border-b border-slate-800 space-y-2">
                                          <input placeholder="Name" className="w-full bg-slate-800 rounded-xl px-4 py-2 text-xs outline-none" value={newName} onChange={e => setNewName(e.target.value)} />
                                          <input placeholder="Phone" className="w-full bg-slate-800 rounded-xl px-4 py-2 text-xs outline-none" value={newPhone} onChange={e => setNewPhone(e.target.value.replace(/\D/g,''))} />
                                          <button onClick={handleAddCustomer} className="w-full bg-emerald-600 py-2 rounded-xl text-xs font-bold text-black">+ Add Customer</button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto">
                                          {customers.map(c => (
                                                <button key={c.phone} onClick={() => { setSelected(c); if(isMobileView) setShowListOnMobile(false); }} className={`w-full p-4 text-left border-b border-slate-800 flex justify-between items-center ${selected?.phone === c.phone ? 'bg-emerald-600/10' : ''}`}>
                                                      <div>
                                                            <p className="text-sm font-bold">{c.name}</p>
                                                            <p className="text-[10px] text-slate-500">{c.phone}</p>
                                                      </div>
                                                      <p className="text-sm font-bold text-amber-500">₹{c.currentDue}</p>
                                                </button>
                                          ))}
                                    </div>
                              </aside>
                        )}

                        {/* CHAT PANE */}
                        {(!showListOnMobile || !isMobileView) && (
                              <main className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
                                    <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                                          <div className="flex items-center gap-3">
                                                {isMobileView && <button onClick={() => setShowListOnMobile(true)} className="text-xl mr-2">←</button>}
                                                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white">{selected?.name?.[0]}</div>
                                                <div>
                                                      <p className="text-sm font-bold">{selected?.name}</p>
                                                      <p className="text-[10px] text-slate-500">{selected?.phone}</p>
                                                </div>
                                          </div>
                                          <div className="flex gap-2">
                                                <button onClick={() => setPdfModalOpen(true)} className="text-[10px] bg-sky-600 px-3 py-1 rounded-full font-bold text-white">PDF</button>
                                          </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                          {[...(selected?.ledger || [])].reverse().map((t, i) => (
                                                <div key={i} className={`flex ${t.type === 'credit' ? 'justify-end' : 'justify-start'}`}>
                                                      <div className={`p-3 rounded-2xl text-xs max-w-[80%] shadow-lg ${t.type === 'credit' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                                                            <div className="flex justify-between gap-4 opacity-70 text-[9px] mb-1">
                                                                  <span className="font-bold uppercase">{t.type}</span>
                                                                  <span>{new Date(t.date).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="font-medium mb-1">{t.note || 'No note'}</p>
                                                            <p className="text-lg font-black">₹{t.amount}</p>
                                                      </div>
                                                </div>
                                          ))}
                                    </div>

                                    <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2 items-center">
                                          <select className="bg-slate-800 text-[10px] rounded-xl px-2 py-2 outline-none" value={txnType} onChange={e => setTxnType(e.target.value)}>
                                                <option value="credit">Udhaar</option>
                                                <option value="payment">Payment</option>
                                          </select>
                                          <input type="number" placeholder="₹ Amount" className="w-20 bg-slate-800 rounded-xl px-3 py-2 text-xs outline-none" value={txnAmount} onChange={e => setTxnAmount(e.target.value)} />
                                          <input placeholder="Note" className="flex-1 bg-slate-800 rounded-xl px-4 py-2 text-xs outline-none" value={txnNote} onChange={e => setTxnNote(e.target.value)} />
                                          <button onClick={handleSaveTxn} className="bg-emerald-600 text-black font-bold text-xs px-4 py-2 rounded-xl">Save</button>
                                    </div>
                              </main>
                        )}
                  </div>

                  {/* PDF MODAL */}
                  {pdfModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm">
                                    <h3 className="font-bold mb-4">Generate Report</h3>
                                    <div className="space-y-4">
                                          <div className="flex gap-4">
                                                <button onClick={() => setPdfType('ledger')} className={`flex-1 py-3 rounded-xl border ${pdfType === 'ledger' ? 'bg-emerald-600 text-black border-emerald-600' : 'border-slate-800 text-slate-400'}`}>Ledger</button>
                                                <button onClick={() => setPdfType('invoice')} className={`flex-1 py-3 rounded-xl border ${pdfType === 'invoice' ? 'bg-emerald-600 text-black border-emerald-600' : 'border-slate-800 text-slate-400'}`}>GST Invoice</button>
                                          </div>
                                          
                                          {!pdfBlobUrl ? (
                                                <button onClick={() => handleGeneratePdf(selected.phone, pdfType)} className="w-full bg-sky-600 py-3 rounded-xl font-bold text-white shadow-lg shadow-sky-500/20">{pdfLoading ? 'Generating...' : 'Create PDF'}</button>
                                          ) : (
                                                <div className="flex gap-2">
                                                      <a href={pdfBlobUrl} download="Report.pdf" className="flex-1 bg-emerald-600 text-black py-3 rounded-xl font-bold text-center">Download</a>
                                                      <button onClick={() => { URL.revokeObjectURL(pdfBlobUrl); setPdfBlobUrl(null); }} className="flex-1 bg-slate-800 py-3 rounded-xl font-bold">New</button>
                                                </div>
                                          )}
                                          <button onClick={() => setPdfModalOpen(false)} className="w-full py-2 text-xs text-slate-500 font-bold">Close</button>
                                    </div>
                              </div>
                        </div>
                  )}
            </div>
      );
}
