"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';

// === UNIVERSAL MOBILE FIXES ===
const setViewportHeight = () => {
      if (typeof window === 'undefined') return;
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
};

const getSafeArea = () => {
      if (typeof window === 'undefined') return { top: 0, bottom: 0 };

      const isAndroid = /Android/i.test(navigator.userAgent);
      const bottomNav = isAndroid ? 34 : 34; // Gesture nav + status bar

      return {
            top: 0,
            bottom: Math.max(0, bottomNav)
      };
};

// === UTILITIES ===
const getToken = () => typeof window === 'undefined' ? null : localStorage.getItem('token');
const formatDateTime = (value) => {
      if (!value) return '';
      return new Date(value).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
      });
};

// === API ===
const API = {
      listCustomers: async () => {
            const token = getToken();
            const res = await fetch('/api/customers', {
                  headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to load');
            return res.json();
      },
      addCustomer: async (name, phone) => {
            const token = getToken();
            const res = await fetch('/api/customers', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ name, phone })
            });
            if (!res.ok) throw new Error('Failed to add');
            return res.json();
      },
      addTxn: async (phone, type, amount, note) => {
            const token = getToken();
            const res = await fetch(`/api/customers/${encodeURIComponent(phone)}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ type, amount, note })
            });
            if (!res.ok) throw new Error('Failed to save');
            return res.json();
      }
};

// === TOAST ===
const ToastContainer = ({ toasts, removeToast }) => (
      <div className="fixed inset-x-0 top-4 z-[10000] flex flex-col items-center space-y-2 px-4 pointer-events-none">
            {toasts.map(t => (
                  <div key={t.id} className="w-full max-w-sm p-4 rounded-2xl shadow-2xl bg-white/95 backdrop-blur-xl border animate-slide-down">
                        <div className="flex items-center gap-3">
                              <span className="text-2xl">{t.type === 'error' ? '❌' : '✅'}</span>
                              <div className="flex-1">
                                    <p className="font-bold">{t.title}</p>
                                    {t.message && <p className="text-sm opacity-75">{t.message}</p>}
                              </div>
                              <button onClick={() => removeToast(t.id)} className="p-1 rounded-full hover:bg-slate-200">✕</button>
                        </div>
                  </div>
            ))}
      </div>
);

// === MAIN APP ===
export default function OwnerDashboard() {
      // STATE
      const [customers, setCustomers] = useState([]);
      const [selected, setSelected] = useState(null);
      const [loading, setLoading] = useState(true);
      const [newName, setNewName] = useState('');
      const [newPhone, setNewPhone] = useState('');
      const [txnType, setTxnType] = useState('credit');
      const [txnAmount, setTxnAmount] = useState('');
      const [txnNote, setTxnNote] = useState('');
      const [search, setSearch] = useState('');
      const [filter, setFilter] = useState('all');
      const [chatSearch, setChatSearch] = useState('');
      const [showListView, setShowListView] = useState(true);
      const [toasts, setToasts] = useState([]);
      const [safeArea, setSafeArea] = useState({ top: 0, bottom: 0 });
      const messagesEndRef = useRef(null);

      // MOBILE DETECTION
      const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

      // NOTIFY
      const notify = (title, type = 'info', message) => {
            const id = Date.now();
            setToasts(prev => [...prev, { id, title, message, type }]);
            setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
      };

      // LOAD DATA
      const loadData = async () => {
            try {
                  setLoading(true);
                  const data = await API.listCustomers();
                  setCustomers(data);
                  if (data.length > 0 && !selected) setSelected(data[0]);
            } catch (err) {
                  notify('Error', 'error', 'Please login again');
            } finally {
                  setLoading(false);
            }
      };

      // EFFECTS
      useEffect(() => {
            loadData();

            // PERFECT VIEWPORT HANDLING
            setViewportHeight();
            window.addEventListener('resize', setViewportHeight);
            window.addEventListener('orientationchange', () => {
                  setTimeout(setViewportHeight, 100);
            });

            // SAFE AREA
            setSafeArea(getSafeArea());

            return () => {
                  window.removeEventListener('resize', setViewportHeight);
                  window.removeEventListener('orientationchange', () => { });
            };
      }, []);

      useEffect(() => {
            if (messagesEndRef.current) {
                  messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
      }, [customers, selected]);

      // COMPUTED
      const filteredCustomers = useMemo(() => {
            const term = search.toLowerCase();
            return customers.filter(c => {
                  const match = !term ||
                        c.name?.toLowerCase().includes(term) ||
                        c.phone.includes(term);
                  const filterMatch = filter === 'all' ||
                        (filter === 'due' && c.currentDue > 0) ||
                        (filter === 'cleared' && c.currentDue <= 0);
                  return match && filterMatch;
            });
      }, [customers, search, filter]);

      const selectedCustomer = customers.find(c => c.phone === selected?.phone) || selected;
      const filteredLedger = selectedCustomer?.ledger?.filter(t => {
            const term = chatSearch.toLowerCase();
            if (!term) return true;
            return t.note?.toLowerCase().includes(term) ||
                  String(t.amount).includes(term);
      }) || [];

      // HANDLERS
      const handleAddCustomer = async () => {
            if (!newName.trim() || newPhone.length !== 10) {
                  notify('Error', 'error', 'Enter valid name & 10-digit phone');
                  return;
            }
            try {
                  const customer = await API.addCustomer(newName.trim(), newPhone);
                  setCustomers(prev => [...prev, customer]);
                  setSelected(customer);
                  setNewName(''); setNewPhone('');
                  notify('Success', 'success', `${customer.name} added`);
                  if (isMobile) setShowListView(false);
            } catch (err) {
                  notify('Error', 'error', err.message);
            }
      };

      const handleSaveTxn = async () => {
            if (!selectedCustomer || !txnAmount) {
                  notify('Error', 'error', 'Select customer & enter amount');
                  return;
            }
            try {
                  const updated = await API.addTxn(selectedCustomer.phone, txnType, Number(txnAmount), txnNote);
                  setSelected(updated);
                  setCustomers(prev => prev.map(c => c.phone === updated.phone ? updated : c));
                  setTxnAmount(''); setTxnNote('');
                  notify('Saved', 'success', 'Transaction recorded');
            } catch (err) {
                  notify('Error', 'error', 'Failed to save');
            }
      };

      const toggleCustomerView = () => setShowListView(!showListView);

      if (loading) {
            return (
                  <div className="fixed inset-0 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                        <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
            );
      }

      return (
            <>
                  {/* PERFECT MOBILE CSS */}
                  <style jsx global>{`
        :root {
          --vh: 1vh;
          --safe-bottom: ${safeArea.bottom}px;
        }
        
        * {
          box-sizing: border-box;
        }
        
        html, body {
          margin: 0;
          padding: 0;
          height: 100vh;
          height: calc(var(--vh) * 100);
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        
        #__next {
          height: 100vh;
          height: calc(var(--vh) * 100);
          overflow: hidden;
        }
        
        input, select, button {
          font-size: 16px; /* Prevent zoom */
          -webkit-appearance: none;
          appearance: none;
        }
        
        /* HIDE ALL SCROLLBARS */
        ::-webkit-scrollbar { display: none; }
        ::-moz-scrollbar { display: none; }
        * { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

                  {/* FULLSCREEN APP */}
                  <div className="h-[100vh] h-[calc(var(--vh)*100)] w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col overflow-hidden">

                        {/* TOASTS */}
                        <ToastContainer toasts={toasts} removeToast={id => setToasts(p => p.filter(t => t.id !== id))} />

                        <div className="flex flex-1 overflow-hidden">

                              {/* CUSTOMER LIST - MOBILE FULLSCREEN */}
                              {showListView && (
                                    <div className="w-full h-[100vh] h-[calc(var(--vh)*100)] bg-slate-950/95 backdrop-blur-xl flex flex-col">

                                          {/* HEADER */}
                                          <div className="p-6 border-b border-slate-800/50 sticky top-0 z-50 bg-slate-900/95 backdrop-blur-2xl">
                                                <div className="flex items-center justify-between">
                                                      <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent">
                                                            InfraCredit
                                                      </h1>
                                                      <div className="flex items-center gap-4">
                                                            <button className="p-3 rounded-2xl hover:bg-emerald-500/20 transition-all">⭐</button>
                                                      </div>
                                                </div>
                                                <p className="text-slate-400 text-lg mt-2">Digital Khata App</p>
                                          </div>

                                          {/* SEARCH */}
                                          <div className="p-6 sticky top-[120px] z-20 bg-slate-900/90 backdrop-blur-xl">
                                                <div className="relative">
                                                      <input
                                                            value={search}
                                                            onChange={e => setSearch(e.target.value)}
                                                            placeholder="Search customers..."
                                                            className="w-full h-16 px-5 pl-14 pr-5 bg-slate-800/60 rounded-3xl text-xl backdrop-blur-xl border-2 border-slate-700/50 focus:border-emerald-400 focus:outline-none transition-all shadow-xl"
                                                      />
                                                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl text-slate-500">🔍</span>
                                                </div>
                                          </div>

                                          {/* FILTERS */}
                                          <div className="px-6 py-4 sticky top-[200px] z-10 bg-slate-900/90 backdrop-blur-xl">
                                                <div className="flex gap-3 overflow-x-auto pb-4 -mb-4">
                                                      {['all', 'due', 'cleared'].map(f => (
                                                            <button
                                                                  key={f}
                                                                  onClick={() => setFilter(f)}
                                                                  className={`flex-shrink-0 px-8 py-4 rounded-3xl font-bold text-lg shadow-2xl transition-all ${filter === f
                                                                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-black shadow-emerald-500/50 scale-105'
                                                                              : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/70 hover:shadow-slate-500/30'
                                                                        }`}
                                                            >
                                                                  {f === 'all' ? 'All' : f === 'due' ? 'Due' : 'Cleared'}
                                                            </button>
                                                      ))}
                                                </div>
                                          </div>

                                          {/* ADD CUSTOMER */}
                                          <div className="px-6 py-8 border-b border-slate-800/30 bg-gradient-to-b from-slate-900/70 to-transparent">
                                                <div className="space-y-4 bg-slate-900/50 backdrop-blur-xl rounded-3xl p-6 border border-slate-800/30 shadow-2xl">
                                                      <input
                                                            placeholder="👤 Customer Name"
                                                            value={newName}
                                                            onChange={e => setNewName(e.target.value)}
                                                            className="w-full h-14 px-6 bg-slate-800/70 rounded-2xl text-xl backdrop-blur-xl border border-slate-700/50 focus:border-emerald-400 focus:outline-none shadow-lg"
                                                      />
                                                      <input
                                                            placeholder="📱 Phone (10 digits)"
                                                            value={newPhone}
                                                            maxLength={10}
                                                            onChange={e => setNewPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                                                            className="w-full h-14 px-6 bg-slate-800/70 rounded-2xl text-xl backdrop-blur-xl border border-slate-700/50 focus:border-emerald-400 focus:outline-none shadow-lg"
                                                      />
                                                      <button
                                                            onClick={handleAddCustomer}
                                                            className="w-full h-16 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-500 text-xl font-black rounded-3xl shadow-2xl hover:shadow-emerald-500/50 hover:scale-[1.02] transition-all border-2 border-emerald-400/50"
                                                      >
                                                            ➕ Add New Customer
                                                      </button>
                                                </div>
                                          </div>

                                          {/* CUSTOMER LIST */}
                                          <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-24">
                                                {filteredCustomers.map(customer => (
                                                      <button
                                                            key={customer.phone}
                                                            onClick={() => {
                                                                  setSelected(customer);
                                                                  if (isMobile) setShowListView(false);
                                                            }}
                                                            className="w-full p-8 rounded-3xl bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 hover:from-emerald-500/10 hover:to-teal-500/10 hover:border-emerald-400/30 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all shadow-xl hover:scale-[1.02]"
                                                      >
                                                            <div className="flex items-center gap-6">
                                                                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center text-3xl font-black shadow-2xl ring-2 ring-emerald-400/30">
                                                                        {customer.name?.[0]?.toUpperCase() || 'C'}
                                                                  </div>
                                                                  <div className="flex-1 text-left">
                                                                        <h3 className="text-2xl font-black text-white">{customer.name}</h3>
                                                                        <p className="text-slate-400 text-lg mt-1">{customer.phone}</p>
                                                                        <div className={`mt-3 px-6 py-3 rounded-2xl font-bold text-xl ${customer.currentDue > 0
                                                                                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-2 border-amber-400/50 shadow-amber-500/20'
                                                                                    : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-2 border-emerald-400/50 shadow-emerald-500/20'
                                                                              }`}>
                                                                              ₹{Math.abs(customer.currentDue)}
                                                                              {customer.currentDue > 0 ? ' Due' : ' Paid'}
                                                                        </div>
                                                                  </div>
                                                            </div>
                                                      </button>
                                                ))}

                                                {filteredCustomers.length === 0 && (
                                                      <div className="flex flex-col items-center justify-center text-center py-32 text-slate-500">
                                                            <div className="w-32 h-32 bg-slate-800/50 rounded-3xl flex items-center justify-center text-5xl mb-8 shadow-xl">
                                                                  👥
                                                            </div>
                                                            <h2 className="text-3xl font-black mb-4">No Customers</h2>
                                                            <p className="text-xl opacity-75">Add your first customer to get started</p>
                                                      </div>
                                                )}
                                          </div>
                                    </div>
                              )}

                              {/* KHATA DETAIL VIEW */}
                              {!showListView && selectedCustomer && (
                                    <div className="flex-1 flex flex-col h-[100vh] h-[calc(var(--vh)*100)] overflow-hidden">

                                          {/* HEADER */}
                                          <div className="p-6 border-b border-slate-800/50 sticky top-0 z-50 bg-slate-900/95 backdrop-blur-3xl shadow-2xl">
                                                <div className="flex items-center justify-between">
                                                      <button
                                                            onClick={() => setShowListView(true)}
                                                            className="p-4 text-3xl rounded-3xl hover:bg-slate-800/50 backdrop-blur-xl transition-all"
                                                      >
                                                            ←
                                                      </button>
                                                      <div className="flex items-center gap-6">
                                                            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center text-3xl font-black shadow-2xl">
                                                                  {selectedCustomer.name?.[0]?.toUpperCase()}
                                                            </div>
                                                            <div>
                                                                  <h2 className="text-3xl font-black">{selectedCustomer.name}</h2>
                                                                  <p className="text-slate-400 text-xl">{selectedCustomer.phone}</p>
                                                            </div>
                                                      </div>
                                                </div>

                                                {/* DUE BANNER */}
                                                {selectedCustomer.currentDue > 0 && (
                                                      <div className="mt-6 p-6 rounded-3xl bg-gradient-to-r from-amber-500/30 via-orange-500/20 to-amber-500/30 border-4 border-amber-400/60 shadow-2xl shadow-amber-500/40 animate-pulse">
                                                            <div className="flex items-center justify-between">
                                                                  <span className="text-4xl font-black text-amber-100">₹{selectedCustomer.currentDue}</span>
                                                                  <span className="text-2xl font-bold text-amber-200">Outstanding</span>
                                                            </div>
                                                      </div>
                                                )}
                                          </div>

                                          {/* SEARCH TRANSACTIONS */}
                                          <div className="px-6 py-4 sticky top-[140px] z-20 bg-slate-900/90 backdrop-blur-xl">
                                                <div className="relative">
                                                      <input
                                                            value={chatSearch}
                                                            onChange={e => setChatSearch(e.target.value)}
                                                            placeholder="Search transactions..."
                                                            className="w-full h-16 px-6 pl-16 pr-16 bg-slate-800/70 rounded-3xl text-xl backdrop-blur-xl border-2 border-slate-700/50 focus:border-emerald-400 focus:outline-none shadow-xl transition-all"
                                                      />
                                                      <span className="absolute left-7 top-1/2 -translate-y-1/2 text-2xl text-slate-500">🔍</span>
                                                      {chatSearch && (
                                                            <button
                                                                  onClick={() => setChatSearch('')}
                                                                  className="absolute right-7 top-1/2 -translate-y-1/2 p-3 rounded-3xl hover:bg-slate-700/50 text-2xl transition-all"
                                                            >
                                                                  ✕
                                                            </button>
                                                      )}
                                                </div>
                                          </div>

                                          {/* TRANSACTIONS */}
                                          <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-[calc(var(--safe-bottom)+120px)]">
                                                {filteredLedger.length === 0 ? (
                                                      <div className="flex flex-col items-center justify-center h-full py-40 text-center text-slate-500">
                                                            <div className="w-32 h-32 bg-slate-800/50 rounded-3xl flex items-center justify-center text-6xl mb-12 shadow-2xl">
                                                                  📜
                                                            </div>
                                                            <h3 className="text-4xl font-black mb-6">No Transactions</h3>
                                                            <p className="text-2xl opacity-75">Record your first udhaar or payment</p>
                                                      </div>
                                                ) : (
                                                      filteredLedger
                                                            .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
                                                            .map((txn, idx) => {
                                                                  const isCredit = txn.type === 'credit';
                                                                  return (
                                                                        <div key={idx} className={`flex ${isCredit ? 'justify-end' : 'justify-start'}`}>
                                                                              <div className={`max-w-[85%] p-8 rounded-3xl shadow-2xl backdrop-blur-xl border-2 transition-all hover:scale-[1.02] cursor-pointer ${isCredit
                                                                                          ? 'bg-gradient-to-br from-emerald-500/95 to-teal-500/95 border-emerald-400/60 shadow-emerald-500/40'
                                                                                          : 'bg-gradient-to-br from-slate-800/95 to-slate-900/95 border-slate-700/60 shadow-slate-500/30'
                                                                                    }`}>
                                                                                    <div className="flex justify-between items-start gap-6 mb-4">
                                                                                          <span className={`text-3xl font-black px-4 py-2 rounded-2xl ${isCredit
                                                                                                      ? 'bg-emerald-400/30 text-emerald-100 border-2 border-emerald-400/50'
                                                                                                      : 'bg-slate-700/50 text-slate-200 border-2 border-slate-600/50'
                                                                                                }`}>
                                                                                                {isCredit ? 'Udhaar' : 'Payment'}
                                                                                          </span>
                                                                                          <span className="text-xl opacity-90 whitespace-nowrap">{formatDateTime(txn.createdAt || txn.date)}</span>
                                                                                    </div>
                                                                                    <div className="text-center">
                                                                                          <p className="text-5xl font-black mb-4">₹{txn.amount}</p>
                                                                                          {txn.note && (
                                                                                                <p className="text-2xl leading-relaxed opacity-95 mb-6 px-6 py-4 bg-black/20 rounded-2xl backdrop-blur-sm border border-slate-700/30">
                                                                                                      {txn.note}
                                                                                                </p>
                                                                                          )}
                                                                                          {txn.balanceAfter !== undefined && (
                                                                                                <div className="px-6 py-4 bg-black/30 rounded-2xl backdrop-blur-sm border border-slate-700/50">
                                                                                                      <span className="text-xl font-bold opacity-90">Balance: ₹{txn.balanceAfter}</span>
                                                                                                </div>
                                                                                          )}
                                                                                    </div>
                                                                              </div>
                                                                        </div>
                                                                  );
                                                            })
                                                )}
                                                <div ref={messagesEndRef} />
                                          </div>

                                          {/* FIXED BOTTOM INPUT - ALWAYS VISIBLE */}
                                          <div className="px-6 pb-[max(24px,var(--safe-bottom))] pt-6 bg-gradient-to-t from-slate-900/95 to-transparent sticky bottom-0 z-[100] shadow-2xl">
                                                <div className="bg-slate-900/95 backdrop-blur-3xl rounded-3xl p-6 border-2 border-slate-800/50 shadow-2xl">
                                                      <div className="flex items-stretch gap-4">
                                                            <select
                                                                  value={txnType}
                                                                  onChange={e => setTxnType(e.target.value)}
                                                                  className="h-20 px-6 bg-slate-800/70 rounded-3xl text-2xl font-bold border-2 border-slate-700/50 focus:border-emerald-400 focus:outline-none flex-1 min-w-[120px] backdrop-blur-xl"
                                                            >
                                                                  <option value="credit">Udhaar</option>
                                                                  <option value="payment">Payment</option>
                                                            </select>

                                                            <input
                                                                  type="number"
                                                                  inputMode="decimal"
                                                                  placeholder="Amount"
                                                                  value={txnAmount}
                                                                  onChange={e => setTxnAmount(e.target.value)}
                                                                  className="h-20 flex-1 px-8 bg-slate-800/70 rounded-3xl text-3xl font-black border-2 border-slate-700/50 focus:border-emerald-400 focus:outline-none backdrop-blur-xl shadow-xl"
                                                            />

                                                            <input
                                                                  placeholder="Note"
                                                                  value={txnNote}
                                                                  onChange={e => setTxnNote(e.target.value)}
                                                                  className="h-20 flex-1 px-8 bg-slate-800/70 rounded-3xl text-xl border-2 border-slate-700/50 focus:border-emerald-400 focus:outline-none backdrop-blur-xl shadow-xl"
                                                            />

                                                            <button
                                                                  onClick={handleSaveTxn}
                                                                  disabled={!selectedCustomer || !txnAmount}
                                                                  className={`h-20 px-12 rounded-3xl font-black text-2xl shadow-2xl transition-all flex items-center justify-center ${!selectedCustomer || !txnAmount
                                                                              ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed border-2 border-slate-700/50'
                                                                              : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-black border-2 border-emerald-400/50 shadow-emerald-500/50 hover:shadow-emerald-500/75 hover:scale-[1.05]'
                                                                        }`}
                                                            >
                                                                  ➕
                                                            </button>
                                                      </div>
                                                </div>
                                          </div>
                                    </div>
                              )}
                        </div>
                  </div>
            </>
      );
}
