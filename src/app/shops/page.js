'use client'

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';

// Token Helper
const getToken = () => {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem('token');
};

// DateTime Formatter
const formatDateTime = (value) => {
      if (!value) return '';
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
      });
};

// Public Khata URL Helper
const getPublicKhataUrl = (phone) => {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      return `${origin}/khata/${encodeURIComponent(phone)}`;
};

// API Layer - FIXED error handling
const API = {
      listCustomers: async () => {
            try {
                  const token = getToken();
                  if (!token) throw new Error('No token found');
                  const res = await fetch('/api/customers', {
                        headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json'
                        },
                  });
                  if (!res.ok) {
                        const errorData = await res.json().catch(() => ({}));
                        throw new Error(errorData.error || `HTTP ${res.status}`);
                  }
                  return await res.json();
            } catch (error) {
                  console.error('API.listCustomers error:', error);
                  throw error;
            }
      },

      addCustomer: async (name, phone) => {
            try {
                  const token = getToken();
                  if (!token) throw new Error('No token found');
                  const res = await fetch('/api/customers', {
                        method: 'POST',
                        headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ name, phone }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'addCustomer failed');
                  return data;
            } catch (error) {
                  console.error('API.addCustomer error:', error);
                  throw error;
            }
      },

      addTxn: async (phone, type, amount, note) => {
            try {
                  const token = getToken();
                  if (!token) throw new Error('No token found');
                  const res = await fetch(`/api/customers/${encodeURIComponent(phone)}/txns`, {
                        method: 'POST',
                        headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ type, amount: Number(amount), note }),
                  });
                  if (!res.ok) {
                        const errorData = await res.json().catch(() => ({}));
                        throw new Error(errorData.error || 'addTxn failed');
                  }
                  return await res.json();
            } catch (error) {
                  console.error('API.addTxn error:', error);
                  throw error;
            }
      },

      deleteCustomer: async (phone) => {
            try {
                  const token = getToken();
                  if (!token) throw new Error('No token found');
                  const res = await fetch(`/api/customers/${encodeURIComponent(phone)}`, {
                        method: 'DELETE',
                        headers: {
                              'Authorization': `Bearer ${token}`,
                        },
                  });
                  if (!res.ok) throw new Error('deleteCustomer failed');
                  return true;
            } catch (error) {
                  console.error('API.deleteCustomer error:', error);
                  throw error;
            }
      }
};

// Toast System with Refresh Effect
const TOAST_DURATION = 4000;
const ToastContainer = ({ toasts, removeToast, isDark }) => {
      if (!toasts.length) return null;

      const baseBg = isDark ? 'bg-slate-900/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md';
      const baseBorder = isDark ? 'border-slate-700' : 'border-slate-300';
      const shadow = isDark ? 'shadow-2xl shadow-slate-900/50' : 'shadow-2xl shadow-slate-200/50';

      const typeStyles = {
            success: 'border-emerald-500/70',
            error: 'border-rose-500/70',
            info: 'border-sky-500/70',
            warning: 'border-amber-500/70'
      };

      const typeAccent = {
            success: 'bg-emerald-500',
            error: 'bg-rose-500',
            info: 'bg-sky-500',
            warning: 'bg-amber-500'
      };

      const typeIcon = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
      };

      return (
            <div className="fixed z-[100] inset-x-0 top-4 flex flex-col items-center space-y-2 pointer-events-none px-4">
                  {toasts.map((t) => (
                        <div
                              key={t.id}
                              className={`pointer-events-auto w-full max-w-sm px-4 py-3 rounded-2xl border ${baseBg} ${baseBorder} ${typeStyles[t.type]} ${shadow} flex items-start gap-3 animate-slide-down-fade`}
                        >
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 animate-pulse">
                                    {typeIcon[t.type]}
                              </div>
                              <div className="flex-1 min-w-0 py-0.5">
                                    <p className={`text-sm font-semibold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                                          {t.title}
                                    </p>
                                    {t.message && (
                                          <p className={`mt-1 text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                                {t.message}
                                          </p>
                                    )}
                              </div>
                              <button
                                    onClick={() => removeToast(t.id)}
                                    className="text-slate-400 hover:text-slate-200 text-lg font-bold transition-all hover:scale-110 ml-1 shrink-0"
                              >
                                    ×
                              </button>
                        </div>
                  ))}
                  <style jsx>{`
        @keyframes slide-down-fade {
          0% { opacity: 0; transform: translateY(-16px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-down-fade {
          animation: slide-down-fade 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
            </div>
      );
};

// Main Component - FULLY FIXED
export default function OwnerDashboard() {
      // State Management
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
      const [theme, setTheme] = useState('dark');
      const [lastDeleted, setLastDeleted] = useState(null);
      const [chatSearch, setChatSearch] = useState('');
      const [selectedTxnIds, setSelectedTxnIds] = useState(new Set());
      const [chatMenuOpen, setChatMenuOpen] = useState(false);
      const [editingIndex, setEditingIndex] = useState(null);
      const [toasts, setToasts] = useState([]);
      const [isMobileView, setIsMobileView] = useState(false);
      const [showListOnMobile, setShowListOnMobile] = useState(true);
      const messagesEndRef = useRef(null);

      const isDark = theme === 'dark';

      // Toast Notifications
      const notify = useCallback((title, type = 'info', message = '') => {
            const id = Date.now() + Math.random();
            setToasts(prev => [...prev, { id, title, message, type }]);
            setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), TOAST_DURATION);
      }, []);

      const removeToast = useCallback((id) => {
            setToasts(prev => prev.filter(t => t.id !== id));
      }, []);

      // Data Loading
      const loadCustomers = useCallback(async () => {
            try {
                  setLoading(true);
                  const data = await API.listCustomers();
                  setCustomers(data || []);
                  if (data?.length && !selected) {
                        setSelected(data[0]);
                  }
            } catch (error) {
                  console.error('Load customers error:', error);
                  notify('Load Failed', 'error', 'Please check your connection and try again');
            } finally {
                  setLoading(false);
            }
      }, [selected, notify]);

      // Responsive Detection
      useEffect(() => {
            const handleResize = () => {
                  const mobile = window.innerWidth < 768;
                  setIsMobileView(mobile);
                  if (!mobile && !showListOnMobile) {
                        setShowListOnMobile(true);
                  }
            };
            handleResize();
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
      }, [showListOnMobile]);

      // Initial Load
      useEffect(() => {
            loadCustomers();
      }, [loadCustomers]);

      // Auto-scroll to bottom
      const scrollToBottom = useCallback(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, []);

      useEffect(() => {
            scrollToBottom();
      }, [selected?.ledger?.length, scrollToBottom]);

      // Computed Values
      const filteredCustomers = useMemo(() => {
            const term = search.toLowerCase().trim();
            return customers.filter(c => {
                  const matchesSearch = !term ||
                        c.name?.toLowerCase().includes(term) ||
                        c.phone?.includes(term);

                  const matchesFilter = filter === 'all' ||
                        (filter === 'due' && c.currentDue > 0) ||
                        (filter === 'cleared' && c.currentDue <= 0);

                  return matchesSearch && matchesFilter;
            });
      }, [customers, search, filter]);

      const filteredLedger = useMemo(() => {
            if (!selected?.ledger) return [];
            const term = chatSearch.toLowerCase().trim();
            if (!term) return selected.ledger;

            return selected.ledger.filter(t => {
                  const note = (t.note || '').toLowerCase();
                  const amount = String(t.amount).toLowerCase();
                  const date = formatDateTime(t.createdAt || t.date).toLowerCase();
                  return note.includes(term) || amount.includes(term) || date.includes(term);
            });
      }, [selected, chatSearch]);

      // Event Handlers
      const handleAddCustomer = async () => {
            if (!newName.trim() || !newPhone.trim()) {
                  notify('Missing Info', 'error', 'Please enter name and phone number');
                  return;
            }
            if (newPhone.replace(/\D/g, '').length !== 10) {
                  notify('Invalid Phone', 'error', 'Phone must be 10 digits');
                  return;
            }

            try {
                  const customer = await API.addCustomer(newName.trim(), newPhone.trim());
                  setCustomers(prev => [...prev, customer]);
                  setSelected(customer);
                  setNewName('');
                  setNewPhone('');
                  notify('Customer Added', 'success', customer.name);
                  if (isMobileView) setShowListOnMobile(false);
            } catch (error) {
                  notify('Add Failed', 'error', error.message);
            }
      };

      const handleSaveTxn = async () => {
            if (!selected || !txnAmount.trim()) {
                  notify('Missing Data', 'error', 'Please select customer and enter amount');
                  return;
            }

            try {
                  if (editingIndex !== null) {
                        // Edit existing transaction (local only for now)
                        const updatedLedger = selected.ledger.map((t, i) =>
                              i === editingIndex
                                    ? { ...t, type: txnType, amount: Number(txnAmount), note: txnNote }
                                    : t
                        );
                        const updatedCustomer = { ...selected, ledger: updatedLedger };
                        setSelected(updatedCustomer);
                        setCustomers(prev => prev.map(c => c.phone === selected.phone ? updatedCustomer : c));
                        notify('Updated', 'success');
                  } else {
                        // Add new transaction
                        const updated = await API.addTxn(selected.phone, txnType, txnAmount, txnNote);
                        setSelected(updated);
                        setCustomers(prev => prev.map(c => c.phone === updated.phone ? updated : c));
                        notify('Transaction Saved', 'success');
                  }

                  // Reset form
                  setTxnAmount('');
                  setTxnNote('');
                  setEditingIndex(null);
                  setSelectedTxnIds(new Set());
                  setChatMenuOpen(false);
            } catch (error) {
                  notify('Save Failed', 'error', error.message);
            }
      };

      const handleDeleteCustomer = async (customer) => {
            if (!confirm(`Delete ${customer.name} (${customer.phone}) and all transactions?`)) return;

            const tempId = setTimeout(async () => {
                  try {
                        await API.deleteCustomer(customer.phone);
                  } catch (error) {
                        console.error('Server delete failed:', error);
                  }
            }, 10000);

            setLastDeleted({ customer, timeoutId: tempId });
            setCustomers(prev => prev.filter(c => c.phone !== customer.phone));
            if (selected?.phone === customer.phone) {
                  setSelected(null);
                  setShowListOnMobile(true);
            }
            notify('Customer Deleted', 'warning', 'Undo available for 10 seconds');
      };

      const handleUndoDelete = () => {
            if (!lastDeleted) return;
            clearTimeout(lastDeleted.timeoutId);
            setCustomers(prev => [lastDeleted.customer, ...prev]);
            setLastDeleted(null);
            notify('Delete Undone', 'success');
      };

      const handleTxnAction = (action) => {
            const ids = Array.from(selectedTxnIds);
            switch (action) {
                  case 'edit':
                        if (ids.length !== 1) {
                              notify('Select One', 'error', 'Edit works on single transaction');
                              return;
                        }
                        const txn = selected.ledger[ids[0]];
                        setEditingIndex(ids[0]);
                        setTxnType(txn.type);
                        setTxnAmount(String(txn.amount));
                        setTxnNote(txn.note || '');
                        setChatMenuOpen(false);
                        notify('Edit Mode', 'info');
                        break;
                  case 'delete':
                        setSelected({ ...selected, ledger: selected.ledger.filter((_, i) => !ids.includes(i)) });
                        notify('Deleted', 'success', `${ids.length} transaction(s)`);
                        break;
                  case 'clear':
                        setSelectedTxnIds(new Set());
                        setChatMenuOpen(false);
                        break;
            }
      };

      // Layout flags
      const showSidebar = !isMobileView || showListOnMobile;
      const showChatPane = !isMobileView || !showListOnMobile;

      // Theme classes
      const rootBg = isDark ? 'bg-gradient-to-br from-slate-900 to-slate-950' : 'bg-gradient-to-br from-slate-50 to-white';
      const textColor = isDark ? 'text-slate-100' : 'text-slate-900';
      const sidebarBg = isDark ? 'bg-slate-950/95 backdrop-blur-md' : 'bg-white/80 backdrop-blur-md';
      const chatBg = isDark ? 'bg-slate-900/50' : 'bg-white/50';

      if (loading) {
            return (
                  <div className={`h-screen w-screen flex items-center justify-center ${rootBg} ${textColor}`}>
                        <div className="text-xl animate-pulse">Loading InfraCredit...</div>
                  </div>
            );
      }

      return (
            <div className={`min-h-screen w-full ${rootBg} ${textColor} flex flex-col lg:flex-row overflow-hidden`}>
                  <ToastContainer toasts={toasts} removeToast={removeToast} isDark={isDark} />

                  {/* Sidebar - Customer List */}
                  {showSidebar && (
                        <aside className={`w-full lg:w-80 ${sidebarBg} border-r border-slate-800/50 flex flex-col h-screen`}>
                              {/* Header */}
                              <div className="p-4 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
                                    <div className="flex items-center justify-between">
                                          <div>
                                                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                                                      InfraCredit
                                                </h1>
                                                <p className="text-xs text-slate-400 mt-1">Digital Khata</p>
                                          </div>
                                          <button
                                                onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                                                className="p-2 rounded-xl hover:bg-slate-700/50 transition-all"
                                                title="Toggle Theme"
                                          >
                                                {isDark ? '☀️' : '🌙'}
                                          </button>
                                    </div>
                              </div>

                              {/* Search & Filter */}
                              <div className="p-4 space-y-3 border-b border-slate-800/30">
                                    <div className="flex bg-slate-800/50 rounded-2xl p-3 items-center gap-2">
                                          <span className="text-slate-400">🔍</span>
                                          <input
                                                value={search}
                                                onChange={e => setSearch(e.target.value)}
                                                placeholder="Search customers..."
                                                className="flex-1 bg-transparent text-sm focus:outline-none"
                                          />
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2 -mb-2">
                                          {['all', 'due', 'cleared'].map(f => (
                                                <button
                                                      key={f}
                                                      onClick={() => setFilter(f)}
                                                      className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${filter === f
                                                                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/25'
                                                                  : 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300'
                                                            }`}
                                                >
                                                      {f === 'all' ? 'All' : f === 'due' ? 'Due' : 'Cleared'}
                                                </button>
                                          ))}
                                    </div>
                              </div>

                              {/* Add Customer Form */}
                              <div className="p-4 border-b border-slate-800/30">
                                    <div className="space-y-3">
                                          <input
                                                value={newName}
                                                onChange={e => setNewName(e.target.value)}
                                                placeholder="Customer Name"
                                                className="w-full p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-emerald-500 focus:outline-none transition-all text-sm"
                                          />
                                          <input
                                                value={newPhone}
                                                onChange={e => {
                                                      const digits = e.target.value.replace(/\D/g, '');
                                                      setNewPhone(digits.slice(0, 10));
                                                }}
                                                placeholder="Phone (10 digits)"
                                                className="w-full p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 focus:border-emerald-500 focus:outline-none transition-all text-sm"
                                          />
                                          <button
                                                onClick={handleAddCustomer}
                                                disabled={!newName.trim() || newPhone.replace(/\D/g, '').length !== 10}
                                                className="w-full p-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-2xl font-semibold text-black transition-all shadow-lg hover:shadow-xl"
                                          >
                                                ➕ Add Customer
                                          </button>
                                    </div>
                              </div>

                              {/* Undo Bar */}
                              {lastDeleted && (
                                    <div className="p-3 bg-amber-900/80 border-b border-amber-800/50">
                                          <div className="flex items-center justify-between text-sm text-amber-100">
                                                <span>Deleted {lastDeleted.customer.name}</span>
                                                <button onClick={handleUndoDelete} className="font-semibold underline hover:no-underline">
                                                      Undo (10s)
                                                </button>
                                          </div>
                                    </div>
                              )}

                              {/* Customer List */}
                              <div className="flex-1 overflow-y-auto">
                                    {filteredCustomers.map(customer => (
                                          <button
                                                key={customer.phone}
                                                onClick={() => {
                                                      setSelected(customer);
                                                      if (isMobileView) setShowListOnMobile(false);
                                                }}
                                                className={`w-full p-4 border-b border-slate-800/30 hover:bg-slate-800/30 transition-all flex items-center gap-4 ${selected?.phone === customer.phone ? 'bg-emerald-500/10 border-emerald-500/30' : ''
                                                      }`}
                                          >
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-lg font-bold text-black">
                                                      {customer.name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                      <div className="flex justify-between items-start">
                                                            <div>
                                                                  <p className="font-semibold text-sm truncate">{customer.name}</p>
                                                                  <p className="text-xs text-slate-400">{customer.phone}</p>
                                                            </div>
                                                            <span className={`text-sm font-bold px-2 py-1 rounded-full ${customer.currentDue > 0
                                                                        ? 'bg-amber-500/20 text-amber-300'
                                                                        : 'bg-emerald-500/20 text-emerald-300'
                                                                  }`}>
                                                                  ₹{customer.currentDue}
                                                            </span>
                                                      </div>
                                                      {customer.ledger?.[customer.ledger.length - 1] && (
                                                            <p className="text-xs text-slate-500 mt-1 truncate">
                                                                  {customer.ledger[customer.ledger.length - 1].note || 'Recent transaction'}
                                                            </p>
                                                      )}
                                                </div>
                                                <button
                                                      onClick={e => {
                                                            e.stopPropagation();
                                                            handleDeleteCustomer(customer);
                                                      }}
                                                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-all"
                                                      title="Delete"
                                                >
                                                      🗑️
                                                </button>
                                          </button>
                                    ))}
                                    {filteredCustomers.length === 0 && (
                                          <div className="p-8 text-center text-slate-500">
                                                <p className="text-sm">No customers found</p>
                                                <p className="text-xs mt-1">Try adjusting search or filter</p>
                                          </div>
                                    )}
                              </div>
                        </aside>
                  )}

                  {/* Chat Pane */}
                  {showChatPane && (
                        <main className={`flex-1 flex flex-col overflow-hidden ${chatBg}`}>
                              {!selected ? (
                                    <div className="flex-1 flex items-center justify-center p-8 text-center">
                                          <div className="text-slate-400">
                                                <div className="text-4xl mb-4">📱</div>
                                                <p className="text-lg font-semibold mb-2">Select a customer</p>
                                                <p className="text-sm">to view their borrow & payment history</p>
                                          </div>
                                    </div>
                              ) : (
                                    <>
                                          {/* Chat Header */}
                                          <div className="p-4 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                      {isMobileView && (
                                                            <button
                                                                  onClick={() => setShowListOnMobile(true)}
                                                                  className="text-2xl text-slate-300 hover:text-white p-2 -ml-2"
                                                            >
                                                                  ←
                                                            </button>
                                                      )}
                                                      <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-lg font-bold text-black">
                                                            {selected.name?.[0]?.toUpperCase() || '?'}
                                                      </div>
                                                      <div className="min-w-0 flex-1">
                                                            <p className="font-semibold truncate">{selected.name}</p>
                                                            <p className="text-sm text-slate-400">{selected.phone}</p>
                                                      </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                      {selectedTxnIds.size > 0 && (
                                                            <span className="text-sm bg-slate-800/50 px-3 py-1 rounded-full">
                                                                  {selectedTxnIds.size}
                                                            </span>
                                                      )}
                                                      <button
                                                            onClick={() => {/* WhatsApp logic */ }}
                                                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-xl text-sm transition-all shadow-lg"
                                                      >
                                                            WhatsApp
                                                      </button>
                                                </div>
                                          </div>

                                          {/* Current Due Banner */}
                                          {selected.currentDue > 0 && (
                                                <div className="p-3 bg-amber-500/10 border-b border-amber-500/30">
                                                      <div className="flex items-center justify-between">
                                                            <span className="text-sm font-semibold text-amber-200">
                                                                  Current Due: ₹{selected.currentDue}
                                                            </span>
                                                            <button className="text-xs text-amber-300 underline hover:text-amber-200">
                                                                  Send Reminder
                                                            </button>
                                                      </div>
                                                </div>
                                          )}

                                          {/* Transaction Search */}
                                          <div className="p-4 border-b border-slate-800/30 bg-slate-900/30">
                                                <div className="flex items-center gap-2 bg-slate-800/50 rounded-2xl p-3">
                                                      <span className="text-slate-400 shrink-0">🔍</span>
                                                      <input
                                                            value={chatSearch}
                                                            onChange={e => setChatSearch(e.target.value)}
                                                            placeholder="Search transactions..."
                                                            className="flex-1 bg-transparent text-sm focus:outline-none"
                                                      />
                                                      {chatSearch && (
                                                            <button
                                                                  onClick={() => setChatSearch('')}
                                                                  className="text-slate-400 hover:text-slate-200 text-xl"
                                                            >
                                                                  ×
                                                            </button>
                                                      )}
                                                </div>
                                          </div>

                                          {/* Transactions List */}
                                          <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                                {filteredLedger.length === 0 ? (
                                                      <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-12">
                                                            <div className="text-4xl mb-4">📝</div>
                                                            <p className="text-lg font-semibold mb-2">No transactions</p>
                                                            <p className="text-sm">Add first Udhaar or Payment below</p>
                                                      </div>
                                                ) : (
                                                      filteredLedger
                                                            .slice()
                                                            .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
                                                            .map((txn, idx) => {
                                                                  const isCredit = txn.type === 'credit';
                                                                  const isSelected = selectedTxnIds.has(idx);

                                                                  return (
                                                                        <div
                                                                              key={idx}
                                                                              className={`flex ${isCredit ? 'justify-end' : 'justify-start'}`}
                                                                        >
                                                                              <button
                                                                                    onClick={() => {
                                                                                          setSelectedTxnIds(prev => {
                                                                                                const next = new Set(prev);
                                                                                                if (next.has(idx)) next.delete(idx);
                                                                                                else next.add(idx);
                                                                                                return next;
                                                                                          });
                                                                                    }}
                                                                                    className={`max-w-[85%] p-4 rounded-2xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${isCredit
                                                                                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
                                                                                                : 'bg-white/80 text-slate-900 border border-slate-200/50'
                                                                                          } ${isSelected ? 'ring-4 ring-amber-400/30 shadow-2xl' : 'hover:shadow-xl'}`}
                                                                              >
                                                                                    <div className="flex justify-between items-start gap-2 mb-2">
                                                                                          <span className="font-bold text-lg">
                                                                                                {isCredit ? 'Udhaar' : 'Payment'} ₹{txn.amount}
                                                                                          </span>
                                                                                          <span className="text-xs opacity-75">
                                                                                                {formatDateTime(txn.createdAt || txn.date)}
                                                                                          </span>
                                                                                    </div>
                                                                                    {txn.note && (
                                                                                          <p className="text-sm leading-relaxed whitespace-pre-wrap mb-2">
                                                                                                {txn.note}
                                                                                          </p>
                                                                                    )}
                                                                                    {typeof txn.balanceAfter === 'number' && (
                                                                                          <p className="text-xs opacity-75 text-right mt-2 pt-2 border-t border-current/20">
                                                                                                Balance: ₹{txn.balanceAfter}
                                                                                          </p>
                                                                                    )}
                                                                              </button>
                                                                        </div>
                                                                  );
                                                            })
                                                )}
                                                <div ref={messagesEndRef} />
                                          </div>

                                          {/* Input Bar */}
                                          <div className="p-4 border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
                                                <div className="flex items-end gap-3">
                                                      <select
                                                            value={txnType}
                                                            onChange={e => setTxnType(e.target.value)}
                                                            className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all flex-shrink-0"
                                                      >
                                                            <option value="credit">Udhaar (Credit)</option>
                                                            <option value="payment">Payment</option>
                                                      </select>

                                                      <input
                                                            type="number"
                                                            value={txnAmount}
                                                            onChange={e => setTxnAmount(e.target.value)}
                                                            placeholder="Amount"
                                                            className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm"
                                                      />

                                                      <input
                                                            value={txnNote}
                                                            onChange={e => setTxnNote(e.target.value)}
                                                            placeholder="Note (optional)"
                                                            className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl focus:outline-none focus:border-emerald-500 transition-all text-sm"
                                                      />

                                                      <button
                                                            onClick={handleSaveTxn}
                                                            disabled={!txnAmount || !selected}
                                                            className={`px-6 py-3 font-semibold rounded-xl shadow-lg transition-all ${!txnAmount || !selected
                                                                        ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                                                                        : editingIndex !== null
                                                                              ? 'bg-amber-500 hover:bg-amber-600 text-black'
                                                                              : 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-emerald-500/25 hover:shadow-emerald-500/40'
                                                                  }`}
                                                      >
                                                            {editingIndex !== null ? '✅ Update' : '💾 Save'}
                                                      </button>
                                                </div>

                                                {selectedTxnIds.size > 0 && (
                                                      <div className="mt-3 pt-3 border-t border-slate-700/50 flex gap-2">
                                                            <button
                                                                  onClick={() => handleTxnAction('edit')}
                                                                  className="flex-1 p-2 text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-xl transition-all"
                                                            >
                                                                  ✏️ Edit
                                                            </button>
                                                            <button
                                                                  onClick={() => handleTxnAction('delete')}
                                                                  className="flex-1 p-2 text-xs bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-xl transition-all"
                                                            >
                                                                  🗑️ Delete
                                                            </button>
                                                            <button
                                                                  onClick={() => handleTxnAction('clear')}
                                                                  className="px-4 py-2 text-xs bg-slate-700/50 hover:bg-slate-600 text-slate-300 rounded-xl transition-all"
                                                            >
                                                                  Clear
                                                            </button>
                                                      </div>
                                                )}
                                          </div>
                                    </>
                              )}
                        </main>
                  )}

                  <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; overscroll-behavior: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
            </div>
      );
}
