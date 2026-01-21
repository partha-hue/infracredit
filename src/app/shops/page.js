'use client';

import React, {
      useEffect,
      useState,
      useMemo,
      useRef,
      useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import {
      BarChart,
      Bar,
      XAxis,
      YAxis,
      Tooltip,
      ResponsiveContainer,
} from 'recharts';
import Toast from '@/components/Toast';

/* ======================
   HELPERS & API
====================== */
const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;

const formatDateTime = (value) => {
      if (!value) return 'N/A';
      const d = new Date(value);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
            year: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
      });
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
      getMonthlySummary: async () => {
            const res = await fetch('/api/reports/monthly-summary', { headers: { Authorization: `Bearer ${getToken()}` } });
            return res.json();
      },
      addCustomer: async (name, phone) => {
            const res = await fetch('/api/customers', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                  body: JSON.stringify({ name, phone }),
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to add customer');
            return res.json();
      },
      updateCustomer: async (phone, payload) => {
            const res = await fetch(`/api/customers/${encodeURIComponent(phone)}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                  body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to update customer');
            return res.json();
      },
      deleteCustomer: async (phone) => {
            const res = await fetch(`/api/customers/${encodeURIComponent(phone)}`, {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (!res.ok) throw new Error('Failed to delete customer');
            return res;
      },
      addTxn: async (phone, type, amount, note) => {
            const res = await fetch(`/api/customers/${encodeURIComponent(phone)}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                  body: JSON.stringify({ type, amount, note, date: new Date().toISOString() }),
            });
            if (!res.ok) throw new Error('Failed to add transaction');
            return res.json();
      },
      updateLedger: async (phone, ledger) => {
            const res = await fetch(`/api/customers/${encodeURIComponent(phone)}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                  body: JSON.stringify({ ledger }),
            });
            if (!res.ok) throw new Error('Failed to update ledger');
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
const ChartIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>;
const CalcIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>;
const UsersIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>;
const ProfileIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>;

/* ======================
   MAIN COMPONENT
====================== */
export default function OwnerDashboard() {
      const router = useRouter();
      const [customers, setCustomers] = useState([]);
      const [selected, setSelected] = useState(null);
      const [loading, setLoading] = useState(true);
      const [ownerProfile, setOwnerProfile] = useState(null);
      const [monthlyData, setMonthlyData] = useState([]);

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
      const [activeTab, setActiveTab] = useState('customers'); 
      const [showChatOnMobile, setShowChatOnMobile] = useState(false);

      const [pdfModalOpen, setPdfModalOpen] = useState(false);
      const [pdfType, setPdfType] = useState('ledger');
      const [pdfLoading, setPdfLoading] = useState(false);
      const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

      const [calcVal, setCalcVal] = useState('0');
      const [viewingProfile, setViewingProfile] = useState(null);
      
      const [toast, setToast] = useState(null);

      const showToast = (message, type = 'success') => {
            setToast({ message, type });
      };

      const load = async () => {
            try {
                  const savedTheme = localStorage.getItem('theme') || 'light';
                  setTheme(savedTheme);
                  const token = getToken();
                  if (!token) { router.push('/'); return; }
                  const [custs, ownerRes, summary] = await Promise.all([
                        API.listCustomers(), 
                        API.getOwner(),
                        API.getMonthlySummary()
                  ]);
                  setCustomers(Array.isArray(custs) ? custs : []);
                  setOwnerProfile(ownerRes.owner);
                  setMonthlyData(summary);
                  if (!selected && custs.length) setSelected(custs[0]);
            } catch (err) { console.error(err); } finally { setLoading(false); }
      };

      useEffect(() => { load(); }, []);

      useEffect(() => {
            const handleResize = () => {
                  const mobile = window.innerWidth < 768;
                  setIsMobileView(mobile);
            };
            handleResize();
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
      }, []);

      useEffect(() => {
            const handleGlobalClick = (e) => {
                  if (actionMenuFor) setActionMenuFor(null);
                  if (e.target.closest('.chat-background') && !e.target.closest('.chat-bubble') && !e.target.closest('.action-bar')) {
                        setEditingIndex(null);
                        setTxnAmount('');
                        setTxnNote('');
                  }
            };
            window.addEventListener('click', handleGlobalClick);
            return () => window.removeEventListener('click', handleGlobalClick);
      }, [actionMenuFor]);

      const handleAddOrEditCustomer = async () => {
            if (!newName || newPhone.length !== 10) return showToast('Enter valid details', 'error');
            try {
                  let updated;
                  if (editingPhone) {
                        updated = await API.updateCustomer(editingPhone, { name: newName, newPhone });
                        setCustomers(p => p.map(c => c.phone === editingPhone ? updated : c));
                        setSelected(updated);
                        showToast('Customer updated successfully');
                  } else {
                        updated = await API.addCustomer(newName, newPhone);
                        setCustomers(p => [updated, ...p]);
                        setSelected(updated);
                        showToast('New customer added');
                  }
                  setNewName(''); setNewPhone(''); setEditingPhone(null);
            } catch (err) { showToast(err.message, 'error'); }
      };

      const handleDeleteCustomer = async (phone) => {
            if (!window.confirm('Delete this customer?')) return;
            try {
                  await API.deleteCustomer(phone);
                  setCustomers(p => p.filter(c => c.phone !== phone));
                  if (selected?.phone === phone) {
                        setSelected(null);
                        setShowChatOnMobile(false);
                  }
                  showToast('Customer moved to restore bin', 'warning');
            } catch (err) { showToast(err.message, 'error'); }
      };

      const handleSaveTxn = async () => {
            if (!selected || !txnAmount) return showToast('Enter amount', 'warning');
            try {
                  let updated;
                  if (editingIndex !== null) {
                        const newLedger = [...selected.ledger];
                        const signed = txnType === 'credit' ? Math.abs(txnAmount) : -Math.abs(txnAmount);
                        newLedger[editingIndex] = { ...newLedger[editingIndex], type: txnType, amount: signed, note: txnNote };
                        updated = await API.updateLedger(selected.phone, newLedger);
                        setEditingIndex(null);
                        showToast('Transaction updated');
                  } else {
                        updated = await API.addTxn(selected.phone, txnType, Number(txnAmount), txnNote);
                        showToast('Transaction saved');
                  }
                  setSelected(updated);
                  setCustomers(prev => prev.map(c => c.phone === updated.phone ? updated : c));
                  setTxnAmount(''); setTxnNote('');
                  const summary = await API.getMonthlySummary();
                  setMonthlyData(summary);
            } catch (err) { showToast(err.message, 'error'); }
      };

      const handleBubbleClick = (idx, t) => {
            if (editingIndex === idx) {
                  setEditingIndex(null);
                  setTxnAmount('');
                  setTxnNote('');
            } else {
                  setEditingIndex(idx);
                  setTxnType(t.type);
                  setTxnAmount(Math.abs(t.amount));
                  setTxnNote(t.note);
            }
      };

      const sendWhatsAppReminder = () => {
            if (!selected) return;
            const msg = encodeURIComponent(`Hi ${selected.name}, your current due at ${ownerProfile?.shopName || 'our shop'} is ₹${selected.currentDue}. Check full khata here: ${window.location.origin}/khata/${selected.phone}`);
            window.open(`https://wa.me/91${selected.phone}?text=${msg}`, '_blank');
            showToast('Opening WhatsApp...');
      };

      const toggleTheme = () => {
            const next = theme === 'light' ? 'dark' : 'light';
            setTheme(next);
            localStorage.setItem('theme', next);
            showToast(`Theme switched to ${next}`);
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

      const handleCalc = (btn) => {
            if (btn === 'C') setCalcVal('0');
            else if (btn === '=') {
                  try { 
                        // eslint-disable-next-line no-eval
                        const result = eval(calcVal.replace(/x/g, '*'));
                        setCalcVal(Number.isInteger(result) ? result.toString() : result.toFixed(2).toString());
                  } catch { setCalcVal('Error'); }
            } else if (btn === '+Add') {
                  if (!selected) return showToast('Select a customer first', 'warning');
                  setTxnAmount(calcVal);
                  setActiveTab('customers');
                  if (isMobileView) setShowChatOnMobile(true);
                  showToast('Amount copied to txn');
            } else {
                  setCalcVal(calcVal === '0' ? btn : calcVal + btn);
            }
      };

      const handleGeneratePdf = async (phone, type) => {
            setPdfLoading(true);
            try {
                  const res = await fetch(`/api/reports/${type}/${encodeURIComponent(phone)}`, {
                        headers: { Authorization: `Bearer ${getToken()}` }
                  });
                  if (!res.ok) throw new Error('Failed to generate PDF');
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  setPdfBlobUrl(url);
                  showToast('Document ready!');
            } catch (err) {
                  showToast(err.message, 'error');
            } finally {
                  setPdfLoading(false);
            }
      };

      const isDark = theme === 'dark';

      if (loading) return <div className={`h-screen flex items-center justify-center ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>Loading...</div>;

      return (
            <div className={`fixed inset-0 transition-colors duration-200 ${isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'} flex flex-col overflow-hidden font-sans`}>
                  
                  {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

                  {/* MAIN CONTENT AREA */}
                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        {/* CUSTOMER LIST / SIDEBAR */}
                        {(activeTab === 'customers' && (!showChatOnMobile || !isMobileView)) && (
                              <aside className={`w-full md:w-80 border-r flex flex-col h-full shadow-sm transition-colors ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                                    {/* Header */}
                                    <div className={`p-4 border-b flex items-center justify-between sticky top-0 z-10 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
                                          <div className="flex items-center">
                                                <img src="/logo.png" className="h-7 w-auto object-contain" alt="Logo" />
                                          </div>
                                          <div className="flex items-center gap-3">
                                                <button onClick={() => router.push('/profile')} className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-black text-white shadow-md overflow-hidden relative border border-emerald-500">
                                                      {ownerProfile?.avatarUrl ? <img src={ownerProfile.avatarUrl} className="w-full h-full object-cover" /> : ownerProfile?.ownerName?.[0]?.toUpperCase()}
                                                </button>
                                                <button onClick={toggleTheme} className="p-2 rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">{isDark ? <SunIcon /> : <MoonIcon />}</button>
                                          </div>
                                    </div>

                                    {/* Filters & Add */}
                                    <div className="p-3 space-y-3">
                                          <div className={`rounded-xl px-3 py-2.5 flex items-center gap-2 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                                <span className="opacity-40">🔍</span>
                                                <input placeholder="Search name/phone" className={`bg-transparent text-xs outline-none flex-1 ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`} value={search} onChange={e => setSearch(e.target.value)} />
                                          </div>
                                          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                                {['all', 'due', 'cleared'].map(f => (
                                                      <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-[10px] font-black capitalize border transition-all ${filter === f ? 'bg-emerald-600 border-emerald-600 text-white' : (isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500')}`}>
                                                            {f === 'due' ? 'Credit Due' : f}
                                                      </button>
                                                ))}
                                          </div>
                                          <div className={`rounded-2xl p-3 border space-y-2 shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-emerald-50 border-emerald-100'}`}>
                                                <input placeholder="Name" className={`w-full rounded-xl px-3 py-2 text-xs border outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-emerald-100'}`} value={newName} onChange={e => setNewName(e.target.value)} />
                                                <input placeholder="Phone" className={`w-full rounded-xl px-3 py-2 text-xs border outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-emerald-100'}`} value={newPhone} onChange={e => setNewPhone(e.target.value.replace(/\D/g,''))} />
                                                <button onClick={handleAddOrEditCustomer} className="w-full bg-emerald-600 py-2 rounded-xl text-xs font-black text-white shadow-lg active:scale-95 transition-all">
                                                      {editingPhone ? 'Save Update' : '+ Add Customer'}
                                                </button>
                                          </div>
                                    </div>

                                    {/* List */}
                                    <div className="flex-1 overflow-y-auto">
                                          {filteredCustomers.map(c => (
                                                <div key={c.phone} className={`group flex items-center px-4 py-4 border-b transition-all ${isDark ? 'border-slate-800 hover:bg-slate-900' : 'border-slate-50 hover:bg-slate-50'} ${selected?.phone === c.phone ? (isDark ? 'bg-emerald-900/20 border-l-4 border-l-emerald-600' : 'bg-emerald-50 border-l-4 border-l-emerald-600') : ''}`}>
                                                      <div className="flex-1 text-left min-w-0 flex items-center gap-4">
                                                            <button onClick={(e) => { e.stopPropagation(); setViewingProfile({ name: c.name, avatarUrl: c.avatarUrl, sub: 'Customer Profile', phone: c.phone, type: 'customer' }); }} className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center font-black text-white shadow-md overflow-hidden flex-shrink-0">
                                                                  {c.avatarUrl ? <img src={c.avatarUrl} className="w-full h-full object-cover" /> : c.name[0].toUpperCase()}
                                                            </button>
                                                            <button onClick={() => { setSelected(c); setShowChatOnMobile(true); }} className="flex-1 text-left min-w-0">
                                                                  <div className="flex justify-between items-center">
                                                                        <p className={`text-sm font-bold truncate pr-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{c.name}</p>
                                                                        <p className={`text-sm font-black ${c.currentDue > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>₹{c.currentDue}</p>
                                                                  </div>
                                                                  <p className="text-[10px] opacity-50 font-medium">{c.phone}</p>
                                                            </button>
                                                      </div>
                                                      <div className="relative ml-2">
                                                            <button onClick={(e) => { e.stopPropagation(); setActionMenuFor(actionMenuFor === c.phone ? null : c.phone); }} className="p-2 opacity-40 hover:opacity-100">⋮</button>
                                                            {actionMenuFor === c.phone && (
                                                                  <div className={`absolute right-0 top-10 shadow-2xl border rounded-2xl z-20 w-32 py-2 animate-scale-up ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
                                                                        <button onClick={(e) => { e.stopPropagation(); setEditingPhone(c.phone); setNewName(c.name); setNewPhone(c.phone); setActionMenuFor(null); }} className={`w-full text-left px-4 py-2 text-xs font-bold ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>Edit</button>
                                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(c.phone); setActionMenuFor(null); }} className={`w-full text-left px-4 py-2 text-xs font-bold text-rose-500 ${isDark ? 'hover:bg-rose-900/20' : 'hover:bg-rose-50'}`}>Delete</button>
                                                                  </div>
                                                            )}
                                                      </div>
                                                </div>
                                          ))}
                                    </div>
                              </aside>
                        )}

                        {/* TRANSACTION CHAT VIEW */}
                        {(activeTab === 'customers' && (showChatOnMobile || !isMobileView)) && selected && (
                              <main className={`flex-1 flex flex-col overflow-hidden shadow-2xl transition-colors ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                                    {/* Header */}
                                    <div className={`px-4 py-3 border-b flex justify-between items-center sticky top-0 z-10 shadow-sm ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
                                          <div className="flex items-center gap-3">
                                                {isMobileView && <button onClick={() => setShowChatOnMobile(false)} className="text-xl mr-1">←</button>}
                                                <button onClick={() => setViewingProfile({ name: selected.name, avatarUrl: selected.avatarUrl, sub: 'Customer Profile', phone: selected.phone, type: 'customer' })} className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-black text-white shadow-md overflow-hidden">
                                                      {selected.avatarUrl ? <img src={selected.avatarUrl} className="w-full h-full object-cover" /> : selected.name[0].toUpperCase()}
                                                </button>
                                                <div>
                                                      <p className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{selected?.name}</p>
                                                      <p className="text-[10px] text-slate-400 font-bold tracking-widest">{selected?.phone}</p>
                                                </div>
                                          </div>
                                          <div className="flex gap-2">
                                                <button onClick={sendWhatsAppReminder} className={`p-2.5 rounded-full shadow-md active:scale-90 transition-all ${isDark ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}><WhatsAppIcon /></button>
                                                <button onClick={() => setPdfModalOpen(true)} className={`p-2.5 rounded-full shadow-md active:scale-90 transition-all ${isDark ? 'bg-slate-800 text-sky-400' : 'bg-sky-100 text-sky-700'}`}><FileIcon /></button>
                                          </div>
                                    </div>

                                    {/* BANNER STYLE PENDING */}
                                    <div className="bg-amber-500/10 border-b border-amber-500/20 py-3 px-4 flex justify-between items-center animate-slide-down">
                                          <div className="flex flex-col">
                                                <span className="text-[9px] font-black uppercase text-amber-600/70">Total Pending Balance</span>
                                                <span className="text-xl sm:text-2xl font-black text-amber-600 tracking-tight">₹{selected?.currentDue}</span>
                                          </div>
                                          <div className="bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30 hidden sm:block">
                                                <span className="text-[10px] font-black text-amber-700 uppercase">Awaiting Payment</span>
                                          </div>
                                    </div>

                                    {/* Search in chat */}
                                    <div className={`px-4 py-2 border-b flex items-center gap-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                                          <span className="opacity-40 text-sm">🔍</span>
                                          <input placeholder="Search amount, date or note..." className={`bg-transparent text-xs outline-none flex-1 font-medium ${isDark ? 'text-white placeholder-slate-600' : 'text-slate-900 placeholder-slate-400'}`} value={chatSearch} onChange={e => setChatSearch(e.target.value)} />
                                          {chatSearch && <button onClick={() => setChatSearch('')} className="opacity-30 text-xs hover:opacity-100">✕</button>}
                                    </div>

                                    {/* Ledger */}
                                    <div className={`flex-1 overflow-y-auto p-4 space-y-4 chat-background ${isDark ? 'bg-slate-900' : 'bg-slate-100/30'}`}>
                                          {filteredLedger.slice().reverse().map((t, i) => {
                                                const originalIdx = selected.ledger.indexOf(t);
                                                const isSelected = editingIndex === originalIdx;
                                                return (
                                                      <div key={i} className={`flex ${t.type === 'credit' ? 'justify-end' : 'justify-start'}`}>
                                                            <button onClick={(e) => { e.stopPropagation(); handleBubbleClick(originalIdx, t); }} 
                                                                  className={`chat-bubble p-4 rounded-[24px] text-left shadow-md max-w-[85%] border transition-all active:scale-95 ${isSelected ? 'ring-4 ring-emerald-500/30 scale-[1.02]' : ''} ${t.type === 'credit' ? (isDark ? 'bg-emerald-700 text-white border-emerald-600' : 'bg-emerald-600 text-white border-emerald-500') : (isDark ? 'bg-slate-800 text-slate-100 border-slate-700' : 'bg-white text-slate-900 border-slate-100')}`}>
                                                                  <div className="flex justify-between items-center mb-2 gap-6">
                                                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-70">{t.type === 'credit' ? 'Udhaar' : 'Payment'}</span>
                                                                        <span className="text-[8px] opacity-60 font-bold">{formatDateTime(t.createdAt || t.date)}</span>
                                                                  </div>
                                                                  <p className="text-sm font-bold leading-snug mb-2">{t.note || 'No Description'}</p>
                                                                  <div className="flex justify-between items-end">
                                                                        <p className="text-lg sm:text-xl font-black tracking-tight">₹{Math.abs(t.amount)}</p>
                                                                        <p className="text-[9px] opacity-50 font-bold uppercase tracking-tighter">Bal: ₹{t.balanceAfter}</p>
                                                                  </div>
                                                            </button>
                                                      </div>
                                                );
                                          })}
                                    </div>

                                    {/* Bottom Action Bar */}
                                    <div className={`action-bar p-4 border-t shadow-2xl space-y-3 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
                                          <div className="flex gap-3">
                                                <button onClick={() => setTxnType('credit')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all ${txnType === 'credit' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')}`}>Udhaar</button>
                                                <button onClick={() => setTxnType('payment')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all ${txnType === 'payment' ? 'bg-slate-900 text-white shadow-lg' : (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')}`}>Payment</button>
                                          </div>
                                          <div className="flex gap-2 items-center">
                                                <input type="number" placeholder="₹" className={`w-20 sm:w-24 rounded-xl px-3 sm:px-4 py-3 sm:py-3.5 text-sm font-bold outline-none border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-100 border-transparent focus:border-emerald-200 focus:bg-white'}`} value={txnAmount} onChange={e => setTxnAmount(e.target.value)} />
                                                <input placeholder="Note..." className={`flex-1 rounded-xl px-3 sm:px-4 py-3 sm:py-3.5 text-sm font-medium outline-none border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-100 border-transparent focus:border-emerald-200 focus:bg-white'}`} value={txnNote} onChange={e => setTxnNote(e.target.value)} />
                                                <button onClick={handleSaveTxn} className="bg-emerald-600 text-white font-black text-xs px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                                                      {editingIndex !== null ? 'Update' : 'Save'}
                                                </button>
                                          </div>
                                    </div>
                              </main>
                        )}

                        {/* ANALYTICS TAB */}
                        {activeTab === 'analytics' && (
                              <main className={`flex-1 p-6 transition-colors ${isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
                                    <h2 className="text-2xl font-black mb-6">Business Growth</h2>
                                    <div className={`p-6 rounded-[32px] border shadow-xl h-[400px] ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
                                          <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={monthlyData}>
                                                      <XAxis dataKey="month" stroke={isDark ? "#475569" : "#94a3b8"} fontSize={10} axisLine={false} tickLine={false} />
                                                      <YAxis stroke={isDark ? "#475569" : "#94a3b8"} fontSize={10} axisLine={false} tickLine={false} />
                                                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                                                      <Bar dataKey="credit" fill="#fbbf24" radius={[6, 6, 0, 0]} barSize={20} />
                                                      <Bar dataKey="payment" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                                                </BarChart>
                                          </ResponsiveContainer>
                                    </div>
                                    <div className="mt-8 grid grid-cols-2 gap-4">
                                          <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
                                                <p className="text-[10px] font-black uppercase opacity-50 tracking-widest mb-1">Total Udhaar</p>
                                                <p className="text-2xl font-black text-amber-500">₹{monthlyData.reduce((acc, d) => acc + d.credit, 0)}</p>
                                          </div>
                                          <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
                                                <p className="text-[10px] font-black uppercase opacity-50 tracking-widest mb-1">Total Payments</p>
                                                <p className="text-2xl font-black text-emerald-500">₹{monthlyData.reduce((acc, d) => acc + d.payment, 0)}</p>
                                          </div>
                                    </div>
                              </main>
                        )}

                        {/* CALCULATOR TAB */}
                        {activeTab === 'calculator' && (
                              <main className={`flex-1 p-6 transition-colors flex flex-col items-center justify-center ${isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
                                    <div className={`w-full max-w-xs p-6 rounded-[40px] border shadow-2xl ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
                                          <div className={`mb-6 p-6 rounded-3xl text-right text-3xl font-black font-mono overflow-hidden truncate ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
                                                {calcVal}
                                          </div>
                                          <div className="grid grid-cols-4 gap-3">
                                                {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(b => (
                                                      <button key={b} onClick={() => handleCalc(b)} className={`h-14 rounded-2xl font-black transition-all active:scale-90 ${['/','*','-','+','='].includes(b) ? 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-lg' : (isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900')}`}>{b}</button>
                                                ))}
                                                <button onClick={() => handleCalc('C')} className="col-span-2 h-14 rounded-2xl bg-rose-500 text-white font-black shadow-lg shadow-rose-500/20 active:scale-95">Clear</button>
                                                <button onClick={() => handleCalc('+Add')} className="col-span-2 h-14 rounded-2xl bg-emerald-500 text-white font-black shadow-lg shadow-emerald-500/20 active:scale-95">Add Amount</button>
                                          </div>
                                    </div>
                              </main>
                        )}
                  </div>

                  {/* BOTTOM WHATSAPP STYLE NAV BAR (Mobile Only) */}
                  {isMobileView && (
                        <nav className={`border-t flex items-center justify-around py-3 pb-6 sticky bottom-0 z-20 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
                              <button onClick={() => { setActiveTab('customers'); setShowChatOnMobile(false); }} className={`flex flex-col items-center transition-all ${activeTab === 'customers' ? 'text-emerald-500 scale-110' : 'opacity-40'}`}>
                                    <UsersIcon />
                                    <span className="text-[10px] font-bold mt-1">Khatas</span>
                              </button>
                              <button onClick={() => setActiveTab('analytics')} className={`flex flex-col items-center transition-all ${activeTab === 'analytics' ? 'text-emerald-500 scale-110' : 'opacity-40'}`}>
                                    <ChartIcon />
                                    <span className="text-[10px] font-bold mt-1">Analytics</span>
                              </button>
                              <button onClick={() => setActiveTab('calculator')} className={`flex flex-col items-center transition-all ${activeTab === 'calculator' ? 'text-emerald-500 scale-110' : 'opacity-40'}`}>
                                    <CalcIcon />
                                    <span className="text-[10px] font-bold mt-1">Calculator</span>
                              </button>
                              <button onClick={() => router.push('/profile')} className={`flex flex-col items-center transition-all opacity-40 hover:opacity-100`}>
                                    <ProfileIcon />
                                    <span className="text-[10px] font-bold mt-1">Profile</span>
                              </button>
                        </nav>
                  )}

                  {/* PROFILE VIEWER MODAL */}
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
                                                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Phone Number</p>
                                                      <p className="text-white font-bold">{viewingProfile.phone || 'N/A'}</p>
                                                </div>
                                                {viewingProfile.type === 'customer' && (
                                                      <div>
                                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Account Status</p>
                                                            <p className="text-emerald-400 font-bold">Active Customer</p>
                                                      </div>
                                                )}
                                                <div className="flex gap-4 pt-2">
                                                      <a href={`tel:${viewingProfile.phone}`} className="flex-1 p-4 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                                            <span className="text-xs font-bold">Call</span>
                                                      </a>
                                                      <a href={`https://wa.me/91${viewingProfile.phone}`} target="_blank" className="flex-1 p-4 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2">
                                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.76-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.13.57-.074 1.758-.706 2.006-1.388.248-.682.248-1.265.174-1.388-.074-.124-.272-.198-.57-.347m-4.821 7.454c-1.893 0-3.748-.508-5.37-1.467l-.385-.227-3.991 1.046 1.065-3.891-.249-.396C2.75 15.305 2.1 13.484 2.1 11.59c0-5.243 4.265-9.508 9.51-9.508 2.54 0 4.928.989 6.72 2.782 1.792 1.792 2.782 4.18 2.782 6.726 0 5.243-4.265 9.508-9.51 9.508zM12.002 0C5.373 0 0 5.373 0 12c0 2.123.55 4.197 1.594 6.02L0 24l6.135-1.61c1.746.953 3.713 1.456 5.86 1.456 6.626 0 12-5.374 12-12 0-3.212-1.25-6.232-3.515-8.497C18.232 1.25 15.213 0 12.002 0z"/></svg>
                                                            <span className="text-xs font-bold">Chat</span>
                                                      </a>
                                                </div>
                                          </div>
                                    </div>
                              </div>
                        </div>
                  )}

                  {/* PDF MODAL */}
                  {pdfModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6 text-slate-900">
                              <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl animate-scale-up">
                                    <h3 className="text-xl font-black mb-2 text-slate-900">Generate Report</h3>
                                    <p className="text-xs text-slate-400 mb-6 font-medium">Professional statements for your business.</p>
                                    <div className="space-y-4">
                                          <div className={`flex p-1 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                                <button onClick={() => { setPdfType('ledger'); setPdfBlobUrl(null); }} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${pdfType === 'ledger' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Ledger</button>
                                                <button onClick={() => { setPdfType('invoice'); setPdfBlobUrl(null); }} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${pdfType === 'invoice' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>GST Invoice</button>
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
                                          <button onClick={() => { setPdfModalOpen(false); setPdfBlobUrl(null); }} className="w-full py-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Maybe Later</button>
                                    </div>
                              </div>
                        </div>
                  )}

                  <style jsx global>{`
                        @keyframes scale-up { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                        @keyframes slide-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                        .animate-scale-up { animation: scale-up 0.2s ease-out; }
                        .animate-slide-down { animation: slide-down 0.3s ease-out; }
                        .no-scrollbar::-webkit-scrollbar { display: none; }
                        .animate-in { animation: scale-up 0.2s ease-out; }
                  `}</style>
            </div>
      );
}
