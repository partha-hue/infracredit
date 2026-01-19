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
   HELPERS & API
====================== */
const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;

const formatDateTime = (value) => {
      if (!value) return 'N/A';
      const d = new Date(value);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const API = {
      listCustomers: async () => {
            const res = await fetch('/api/customers', { headers: { Authorization: `Bearer ${getToken()}` } });
            return res.json();
      },
      getOwner: async () => {
            const res = await fetch('/api/owner/profile', { headers: { Authorization: `Bearer ${getToken()}` } });
            return res.json();
      },
      addCustomer: async (name, phone) => {
            const res = await fetch('/api/customers', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                  body: JSON.stringify({ name, phone }),
            });
            return res.json();
      },
      updateCustomer: async (phone, payload) => {
            const res = await fetch(`/api/customers/${encodeURIComponent(phone)}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                  body: JSON.stringify(payload),
            });
            return res.json();
      },
      deleteCustomer: async (phone) => {
            return fetch(`/api/customers/${encodeURIComponent(phone)}`, {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${getToken()}` },
            });
      },
      addTxn: async (phone, type, amount, note) => {
            const res = await fetch(`/api/customers/${encodeURIComponent(phone)}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                  body: JSON.stringify({ type, amount, note, date: new Date().toISOString() }),
            });
            return res.json();
      },
      updateLedger: async (phone, ledger) => {
            const res = await fetch(`/api/customers/${encodeURIComponent(phone)}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                  body: JSON.stringify({ ledger }),
            });
            return res.json();
      }
};

/* ======================
   2D ICONS (SVG)
====================== */
const MoonIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path></svg>;
const SunIcon = () => <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg>;
const WhatsAppIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.76-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.13.57-.074 1.758-.706 2.006-1.388.248-.682.248-1.265.174-1.388-.074-.124-.272-.198-.57-.347m-4.821 7.454c-1.893 0-3.748-.508-5.37-1.467l-.385-.227-3.991 1.046 1.065-3.891-.249-.396C2.75 15.305 2.1 13.484 2.1 11.59c0-5.243 4.265-9.508 9.51-9.508 2.54 0 4.928.989 6.72 2.782 1.792 1.792 2.782 4.18 2.782 6.726 0 5.243-4.265 9.508-9.51 9.508zM12.002 0C5.373 0 0 5.373 0 12c0 2.123.55 4.197 1.594 6.02L0 24l6.135-1.61c1.746.953 3.713 1.456 5.86 1.456 6.626 0 12-5.374 12-12 0-3.212-1.25-6.232-3.515-8.497C18.232 1.25 15.213 0 12.002 0z"/></svg>;
const FileIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path><path d="M14 2v6h6"></path></svg>;

export default function OwnerDashboard() {
      const router = useRouter();
      const [customers, setCustomers] = useState([]);
      const [selected, setSelected] = useState(null);
      const [loading, setLoading] = useState(true);
      const [ownerProfile, setOwnerProfile] = useState(null);

      const [newName, setNewName] = useState('');
      const [newPhone, setNewPhone] = useState('');
      const [editingPhone, setEditingPhone] = useState(null);

      const [txnType, setTxnType] = useState('credit');
      const [txnAmount, setTxnAmount] = useState('');
      const [txnNote, setTxnNote] = useState('');

      const [search, setSearch] = useState('');
      const [chatSearch, setChatSearch] = useState('');
      const [filter, setFilter] = useState('all');
      const [theme, setTheme] = useState('light');
      const [actionMenuFor, setActionMenuFor] = useState(null);
      const [editingIndex, setEditingIndex] = useState(null);

      const [isMobileView, setIsMobileView] = useState(true);
      const [showListOnMobile, setShowListOnMobile] = useState(true);

      const [pdfModalOpen, setPdfModalOpen] = useState(false);
      const [pdfType, setPdfType] = useState('ledger');
      const [pdfLoading, setPdfLoading] = useState(false);
      const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

      const load = async () => {
            try {
                  const savedTheme = localStorage.getItem('theme') || 'light';
                  setTheme(savedTheme);
                  const token = getToken();
                  if (!token) { router.push('/'); return; }
                  const [data, ownerRes] = await Promise.all([API.listCustomers(), API.getOwner()]);
                  setCustomers(Array.isArray(data) ? data : []);
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

      // Close dropdown when clicking anywhere
      useEffect(() => {
            const handleGlobalClick = () => setActionMenuFor(null);
            if (actionMenuFor) window.addEventListener('click', handleGlobalClick);
            return () => window.removeEventListener('click', handleGlobalClick);
      }, [actionMenuFor]);

      const handleAddOrEditCustomer = async () => {
            if (!newName || newPhone.length !== 10) return alert('Enter valid details');
            try {
                  let updated;
                  if (editingPhone) {
                        updated = await API.updateCustomer(editingPhone, { name: newName, newPhone });
                        setCustomers(p => p.map(c => c.phone === editingPhone ? updated : c));
                        setSelected(updated);
                  } else {
                        updated = await API.addCustomer(newName, newPhone);
                        setCustomers(p => [updated, ...p]);
                        setSelected(updated);
                  }
                  setNewName(''); setNewPhone(''); setEditingPhone(null);
                  if (isMobileView) setShowListOnMobile(false);
            } catch (err) { alert(err.message); }
      };

      const handleDeleteCustomer = async (phone) => {
            if (!window.confirm('Delete this customer?')) return;
            try {
                  await API.deleteCustomer(phone);
                  setCustomers(p => p.filter(c => c.phone !== phone));
                  if (selected?.phone === phone) setSelected(null);
            } catch (err) { alert(err.message); }
      };

      const handleSaveTxn = async () => {
            if (!selected || !txnAmount) return;
            try {
                  let updated;
                  if (editingIndex !== null) {
                        const newLedger = [...selected.ledger];
                        const signed = txnType === 'credit' ? Math.abs(txnAmount) : -Math.abs(txnAmount);
                        newLedger[editingIndex] = { ...newLedger[editingIndex], type: txnType, amount: signed, note: txnNote };
                        updated = await API.updateLedger(selected.phone, newLedger);
                        setEditingIndex(null);
                  } else {
                        updated = await API.addTxn(selected.phone, txnType, Number(txnAmount), txnNote);
                  }
                  setSelected(updated);
                  setCustomers(prev => prev.map(c => c.phone === updated.phone ? updated : c));
                  setTxnAmount(''); setTxnNote('');
            } catch (err) { alert(err.message); }
      };

      const sendWhatsAppReminder = () => {
            if (!selected) return;
            const msg = encodeURIComponent(`Hi ${selected.name}, your current due at ${ownerProfile?.shopName || 'our shop'} is ₹${selected.currentDue}. Check full khata here: ${window.location.origin}/khata/${selected.phone}`);
            window.open(`https://wa.me/91${selected.phone}?text=${msg}`, '_blank');
      };

      const handleGeneratePdf = async (phone, type) => {
            setPdfLoading(true);
            try {
                  const url = type === 'invoice' ? '/api/invoice/gst' : `/api/customers/${encodeURIComponent(phone)}/pdf?type=ledger`;
                  const body = type === 'invoice' ? JSON.stringify({ customer: selected.name, amount: selected.currentDue }) : null;
                  const res = await fetch(url, {
                        method: type === 'invoice' ? 'POST' : 'GET',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                        body
                  });
                  const blob = await res.blob();
                  setPdfBlobUrl(URL.createObjectURL(blob));
            } catch (err) { alert(err.message); } finally { setPdfLoading(false); }
      };

      const toggleTheme = () => {
            const next = theme === 'light' ? 'dark' : 'light';
            setTheme(next);
            localStorage.setItem('theme', next);
      };

      const filteredCustomers = useMemo(() => {
            return customers.filter(c => (c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)) && (filter === 'all' || (filter === 'due' ? c.currentDue > 0 : c.currentDue === 0)));
      }, [customers, search, filter]);

      const filteredLedger = useMemo(() => {
            if (!selected || !selected.ledger) return [];
            const term = chatSearch.trim().toLowerCase();
            return selected.ledger.filter(t => {
                  const note = t.note?.toLowerCase() || '';
                  const amount = String(t.amount).toLowerCase();
                  const dateStr = formatDateTime(t.createdAt || t.date).toLowerCase();
                  return note.includes(term) || amount.includes(term) || dateStr.includes(term);
            });
      }, [selected, chatSearch]);

      const isDark = theme === 'dark';

      if (loading) return <div className={`h-screen flex items-center justify-center ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>Loading...</div>;

      return (
            <div className={`fixed inset-0 transition-colors duration-200 ${isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'} flex flex-col md:flex-row overflow-hidden font-sans`}>
                  
                  {/* SIDEBAR */}
                  {(showListOnMobile || !isMobileView) && (
                        <aside className={`w-full md:w-80 border-r flex flex-col h-full shadow-sm transition-colors ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                              <div className={`p-4 border-b flex items-center justify-between sticky top-0 z-10 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
                                    <img src="/logo.png" className="h-8 object-contain" alt="Logo" />
                                    <div className="flex items-center gap-3">
                                          <button onClick={() => router.push('/profile')} className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-black text-white shadow-md overflow-hidden relative border border-emerald-500">
                                                {ownerProfile?.avatarUrl ? <img src={ownerProfile.avatarUrl} className="w-full h-full object-cover" /> : ownerProfile?.ownerName?.[0]?.toUpperCase()}
                                          </button>
                                          <button onClick={toggleTheme} className="p-2 rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">{isDark ? <SunIcon /> : <MoonIcon />}</button>
                                    </div>
                              </div>

                              <div className="p-3 space-y-3">
                                    <div className={`rounded-xl px-3 py-2 flex items-center gap-2 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                          <span className="opacity-40">🔍</span>
                                          <input placeholder="Search name/phone" className={`bg-transparent text-xs outline-none flex-1 ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`} value={search} onChange={e => setSearch(e.target.value)} />
                                    </div>

                                    {/* Whatsapp style filters */}
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                          {['all', 'due', 'cleared'].map(f => (
                                                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-[10px] font-black capitalize whitespace-nowrap border transition-all ${filter === f ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20' : (isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200')}`}>
                                                      {f === 'due' ? 'Credit Due' : f}
                                                </button>
                                          ))}
                                    </div>

                                    <div className={`rounded-2xl p-3 border space-y-2 shadow-sm transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-emerald-50 border-emerald-100'}`}>
                                          <input placeholder="Customer Name" className={`w-full rounded-xl px-3 py-2.5 text-xs border outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-emerald-100'}`} value={newName} onChange={e => setNewName(e.target.value)} />
                                          <input placeholder="Phone (10 digits)" className={`w-full rounded-xl px-3 py-2.5 text-xs border outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-emerald-100'}`} value={newPhone} onChange={e => setNewPhone(e.target.value.replace(/\D/g,''))} />
                                          <div className="flex gap-2">
                                                <button onClick={handleAddOrEditCustomer} className="flex-1 bg-emerald-600 py-2.5 rounded-xl text-xs font-black text-white shadow-lg active:scale-95 transition-all">
                                                      {editingPhone ? 'Save Update' : '+ Add Customer'}
                                                </button>
                                                {editingPhone && <button onClick={() => { setEditingPhone(null); setNewName(''); setNewPhone(''); }} className={`px-3 py-2 rounded-xl text-[10px] font-bold ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>✕</button>}
                                          </div>
                                    </div>
                              </div>

                              <div className="flex-1 overflow-y-auto">
                                    {filteredCustomers.map(c => (
                                          <div key={c.phone} className={`group flex items-center px-4 py-4 border-b transition-all ${isDark ? 'border-slate-800 hover:bg-slate-900' : 'border-slate-50 hover:bg-slate-50'} ${selected?.phone === c.phone ? (isDark ? 'bg-emerald-900/20 border-l-4 border-l-emerald-600' : 'bg-emerald-50 border-l-4 border-l-emerald-600') : ''}`}>
                                                <button onClick={() => { setSelected(c); if(isMobileView) setShowListOnMobile(false); }} className="flex-1 text-left min-w-0">
                                                      <div className="flex justify-between items-center mb-0.5">
                                                            <p className={`text-sm font-bold truncate pr-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{c.name}</p>
                                                            <p className={`text-sm font-black ${c.currentDue > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>₹{c.currentDue}</p>
                                                      </div>
                                                      <p className="text-[10px] opacity-50 font-medium">{c.phone}</p>
                                                </button>
                                                <div className="relative ml-2">
                                                      <button onClick={(e) => { e.stopPropagation(); setActionMenuFor(actionMenuFor === c.phone ? null : c.phone); }} className="p-2 opacity-40 hover:opacity-100">⋮</button>
                                                      {actionMenuFor === c.phone && (
                                                            <div className={`absolute right-0 top-10 shadow-2xl border rounded-2xl z-20 w-32 py-2 animate-scale-up ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
                                                                  <button onClick={() => { setEditingPhone(c.phone); setNewName(c.name); setNewPhone(c.phone); setActionMenuFor(null); }} className={`w-full text-left px-4 py-2 text-xs font-bold ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>Edit</button>
                                                                  <button onClick={() => { handleDeleteCustomer(c.phone); setActionMenuFor(null); }} className={`w-full text-left px-4 py-2 text-xs font-bold text-rose-500 ${isDark ? 'hover:bg-rose-900/20' : 'hover:bg-rose-50'}`}>Delete</button>
                                                            </div>
                                                      )}
                                                </div>
                                          </div>
                                    ))}
                              </div>
                        </aside>
                  )}

                  {/* TRANSACTION PANE */}
                  {(!showListOnMobile || !isMobileView) && (
                        <main className={`flex-1 flex flex-col overflow-hidden shadow-2xl transition-colors ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                              {/* Header */}
                              <div className={`px-4 py-3 border-b flex justify-between items-center sticky top-0 z-10 shadow-sm ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
                                    <div className="flex items-center gap-3">
                                          {isMobileView && <button onClick={() => setShowListOnMobile(true)} className="text-xl mr-1">←</button>}
                                          <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-black text-white shadow-md">{selected?.name?.[0]?.toUpperCase()}</div>
                                          <div>
                                                <p className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{selected?.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">₹{selected?.currentDue} Pending</p>
                                          </div>
                                    </div>
                                    <div className="flex gap-2">
                                          <button onClick={sendWhatsAppReminder} className={`p-2.5 rounded-full shadow-md active:scale-90 transition-all ${isDark ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}><WhatsAppIcon /></button>
                                          <button onClick={() => setPdfModalOpen(true)} className={`p-2.5 rounded-full shadow-md active:scale-90 transition-all ${isDark ? 'bg-slate-800 text-sky-400' : 'bg-sky-100 text-sky-700'}`}><FileIcon /></button>
                                    </div>
                              </div>

                              {/* WhatsApp style search in chat */}
                              <div className={`px-4 py-2 border-b flex items-center gap-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                                    <span className="opacity-40 text-sm">🔍</span>
                                    <input placeholder="Search amount, date or note..." className={`bg-transparent text-xs outline-none flex-1 font-medium ${isDark ? 'text-white placeholder-slate-600' : 'text-slate-900 placeholder-slate-400'}`} value={chatSearch} onChange={e => setChatSearch(e.target.value)} />
                                    {chatSearch && <button onClick={() => setChatSearch('')} className="opacity-30 text-xs hover:opacity-100">✕</button>}
                              </div>

                              {/* Ledger */}
                              <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDark ? 'bg-slate-900' : 'bg-slate-100/30'}`}>
                                    {filteredLedger.slice().reverse().map((t, i) => {
                                          const originalIdx = selected.ledger.indexOf(t);
                                          return (
                                                <div key={i} className={`flex ${t.type === 'credit' ? 'justify-end' : 'justify-start'}`}>
                                                      <button onClick={() => { setEditingIndex(originalIdx); setTxnType(t.type); setTxnAmount(Math.abs(t.amount)); setTxnNote(t.note); }} 
                                                            className={`p-4 rounded-[24px] text-left shadow-md max-w-[85%] border transition-all active:scale-95 ${t.type === 'credit' ? (isDark ? 'bg-emerald-700 text-white border-emerald-600' : 'bg-emerald-600 text-white border-emerald-500') : (isDark ? 'bg-slate-800 text-slate-100 border-slate-700' : 'bg-white text-slate-900 border-slate-100')}`}>
                                                            <div className="flex justify-between items-center mb-2 gap-6">
                                                                  <span className="text-[9px] font-black uppercase tracking-widest opacity-70">{t.type === 'credit' ? 'Udhaar' : 'Payment'}</span>
                                                                  <span className="text-[8px] opacity-60 font-bold">{formatDateTime(t.createdAt || t.date)}</span>
                                                            </div>
                                                            <p className="text-sm font-bold leading-snug mb-2">{t.note || 'No Description'}</p>
                                                            <div className="flex justify-between items-end">
                                                                  <p className="text-xl font-black tracking-tight">₹{Math.abs(t.amount)}</p>
                                                                  <p className="text-[9px] opacity-50 font-bold uppercase tracking-tighter">Bal: ₹{t.balanceAfter}</p>
                                                            </div>
                                                      </button>
                                                </div>
                                          );
                                    })}
                              </div>

                              {/* Bottom Action Bar */}
                              <div className={`p-4 border-t shadow-2xl space-y-3 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
                                    <div className="flex gap-3">
                                          <button onClick={() => setTxnType('credit')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all ${txnType === 'credit' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')}`}>Udhaar</button>
                                          <button onClick={() => setTxnType('payment')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all ${txnType === 'payment' ? 'bg-slate-900 text-white shadow-lg' : (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')}`}>Payment</button>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                          <input type="number" placeholder="₹ Amount" className={`w-24 rounded-xl px-4 py-3.5 text-sm font-bold outline-none border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-100 border-transparent focus:border-emerald-200 focus:bg-white'}`} value={txnAmount} onChange={e => setTxnAmount(e.target.value)} />
                                          <input placeholder="Transaction Note..." className={`flex-1 rounded-xl px-4 py-3.5 text-sm font-medium outline-none border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-100 border-transparent focus:border-emerald-200 focus:bg-white'}`} value={txnNote} onChange={e => setTxnNote(e.target.value)} />
                                          <button onClick={handleSaveTxn} className="bg-emerald-600 text-white font-black text-xs px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                                                {editingIndex !== null ? 'Update' : 'Save'}
                                          </button>
                                          {editingIndex !== null && (
                                                <button onClick={() => { setEditingIndex(null); setTxnAmount(''); setTxnNote(''); }} className="bg-rose-500 text-white p-3.5 rounded-xl font-bold shadow-lg active:scale-95">✕</button>
                                          )}
                                    </div>
                              </div>
                        </main>
                  )}

                  {/* PDF MODAL */}
                  {pdfModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
                              <div className={`rounded-[32px] p-8 w-full max-w-sm shadow-2xl animate-scale-up ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
                                    <h3 className="text-xl font-black mb-2">Generate Report</h3>
                                    <p className="text-xs opacity-50 mb-6 font-medium">Professional statements for your business.</p>
                                    <div className="space-y-4">
                                          <div className={`flex p-1 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                                <button onClick={() => { setPdfType('ledger'); setPdfBlobUrl(null); }} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${pdfType === 'ledger' ? 'bg-white text-slate-900 shadow-sm' : 'opacity-40'}`}>Ledger</button>
                                                <button onClick={() => { setPdfType('invoice'); setPdfBlobUrl(null); }} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${pdfType === 'invoice' ? 'bg-white text-slate-900 shadow-sm' : 'opacity-40'}`}>GST Invoice</button>
                                          </div>
                                          
                                          {!pdfBlobUrl ? (
                                                <button onClick={() => handleGeneratePdf(selected.phone, pdfType)} disabled={pdfLoading} className="w-full bg-emerald-600 py-4 rounded-2xl font-black text-white shadow-xl active:scale-95 transition-all disabled:opacity-50">
                                                      {pdfLoading ? 'Building PDF...' : 'Create Document'}
                                                </button>
                                          ) : (
                                                <div className="flex flex-col gap-3">
                                                      <a href={pdfBlobUrl} download={`${pdfType === 'invoice' ? 'Invoice' : 'Ledger'}.pdf`} className="w-full bg-sky-600 text-white py-4 rounded-2xl font-black text-center shadow-lg active:scale-95 transition-all">Download PDF</a>
                                                      <button onClick={() => sendWhatsAppReminder()} className="w-full bg-emerald-500 text-white py-3 rounded-2xl font-bold text-sm">Share on WhatsApp</button>
                                                </div>
                                          )}
                                          <button onClick={() => { setPdfModalOpen(false); setPdfBlobUrl(null); }} className="w-full py-2 text-[10px] opacity-40 font-bold uppercase tracking-widest">Maybe Later</button>
                                    </div>
                              </div>
                        </div>
                  )}

                  <style jsx global>{`
                        @keyframes scale-up {
                              from { opacity: 0; transform: scale(0.9); }
                              to { opacity: 1; transform: scale(1); }
                        }
                        .animate-scale-up { animation: scale-up 0.2s ease-out; }
                        .no-scrollbar::-webkit-scrollbar { display: none; }
                  `}</style>
            </div>
      );
}
