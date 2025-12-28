'use client';

import React, {
      useEffect,
      useState,
      useMemo,
      useRef,
      useCallback,
} from 'react';

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
            if (!token) throw new Error('No token');

            const res = await fetch('/api/customers', {
                  headers: {
                        Authorization: `Bearer ${token}`,
                  },
            });

            if (!res.ok) throw new Error('listCustomers failed');
            return res.json();
      },

      addCustomer: async (name, phone) => {
            const token = getToken();
            if (!token) throw new Error('No token');

            const res = await fetch('/api/customers', {
                  method: 'POST',
                  headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ name, phone }),
            });

            const data = await res.json();
            if (!res.ok) {
                  throw new Error(data.error || 'addCustomer failed');
            }
            return data;
      },

      addTxn: async (phone, type, amount, note) => {
            const token = getToken();
            if (!token) throw new Error('No token');

            const res = await fetch(`/api/customers/${encodeURIComponent(phone)}`, {
                  method: 'POST',
                  headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ type, amount, note }),
            });

            if (!res.ok) throw new Error('addTxn failed');
            return res.json();
      },
};

/* ======================
   TOAST SYSTEM (IN‑APP)
====================== */

const TOAST_DURATION = 3200;

const ToastContainer = ({ toasts, removeToast, isDark }) => {
      if (!toasts.length) return null;

      const baseBg = isDark ? 'bg-slate-900/95' : 'bg-white';
      const baseBorder = isDark ? 'border-slate-700' : 'border-slate-300';
      const shadow = isDark
            ? 'shadow-[0_18px_40px_rgba(15,23,42,0.75)]'
            : 'shadow-[0_18px_40px_rgba(15,23,42,0.25)]';

      const typeStyles = {
            success: 'border-emerald-500/70',
            error: 'border-rose-500/70',
            info: 'border-sky-500/70',
      };

      const typeAccent = {
            success: 'bg-emerald-500',
            error: 'bg-rose-500',
            info: 'bg-sky-500',
      };

      const typeIcon = {
            success: '✔',
            error: '⚠',
            info: 'ℹ',
      };

      return (
            <div className="fixed z-60 inset-x-0 top-4 flex flex-col items-center space-y-2 pointer-events-none">
                  {toasts.map((t) => (
                        <div
                              key={t.id}
                              className={`pointer-events-auto px-4 py-3 rounded-2xl border ${baseBg} ${baseBorder} ${typeStyles[t.type]} ${shadow} max-w-sm w-[90%] sm:w-105 flex items-start gap-3 animate-slide-down-fade`}
                        >
                              <div
                                    className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center text-xs text-white ${typeAccent[t.type]}`}
                              >
                                    {typeIcon[t.type]}
                              </div>
                              <div className="flex-1">
                                    <p
                                          className={`text-xs sm:text-sm font-semibold ${isDark ? 'text-slate-50' : 'text-slate-900'
                                                }`}
                                    >
                                          {t.title}
                                    </p>
                                    {t.message && (
                                          <p
                                                className={`mt-0.5 text-[11px] sm:text-xs leading-snug ${isDark ? 'text-slate-300' : 'text-slate-500'
                                                      }`}
                                          >
                                                {t.message}
                                          </p>
                                    )}
                              </div>
                              <button
                                    onClick={() => removeToast(t.id)}
                                    className="ml-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors select-none"
                              >
                                    ✕
                              </button>
                        </div>
                  ))}
                  <style jsx global>{`
        @keyframes slide-down-fade {
          0% {
            opacity: 0;
            transform: translateY(-12px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slide-down-fade {
          animation: slide-down-fade 0.18s ease-out both;
        }
      `}</style>
            </div>
      );
};

/* ======================
   MAIN COMPONENT
====================== */

export default function OwnerDashboard() {
      const [customers, setCustomers] = useState([]);
      const [selected, setSelected] = useState(null);
      const [loading, setLoading] = useState(true);

      const [newName, setNewName] = useState('');
      const [newPhone, setNewPhone] = useState('');

      const [txnType, setTxnType] = useState('credit');
      const [txnAmount, setTxnAmount] = useState('');
      const [txnNote, setTxnNote] = useState('');

      const [search, setSearch] = useState('');
      const [filter, setFilter] = useState('all'); // 'all' | 'due' | 'cleared'

      const [theme, setTheme] = useState('dark');

      const [lastDeleted, setLastDeleted] = useState(null); // { customer, timeoutId }

      const [chatSearch, setChatSearch] = useState('');
      const [selectedTxnIds, setSelectedTxnIds] = useState(new Set());
      const [chatMenuOpen, setChatMenuOpen] = useState(false);
      const [editingIndex, setEditingIndex] = useState(null);

      const messagesEndRef = useRef(null);

      const [toasts, setToasts] = useState([]);

      const isDark = theme === 'dark';

      const notify = (title, type = 'info', message = '') => {
            const id = Date.now() + Math.random();
            setToasts((prev) => [...prev, { id, title, message, type }]);
            setTimeout(() => {
                  setToasts((prev) => prev.filter((t) => t.id !== id));
            }, TOAST_DURATION);
      };

      const removeToast = (id) => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
      };

      const load = async () => {
            try {
                  const data = await API.listCustomers();
                  setCustomers(data);

                  if (!selected && data.length) setSelected(data[0]);
                  if (selected) {
                        const fresh = data.find((c) => c.phone === selected.phone);
                        if (fresh) setSelected(fresh);
                  }
            } catch (err) {
                  console.error(err);
                  notify('Session expired', 'error', 'Please login again.');
            } finally {
                  setLoading(false);
            }
      };

      useEffect(() => {
            load();
            // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      const filteredCustomers = useMemo(() => {
            const term = search.trim().toLowerCase();
            return customers.filter((c) => {
                  const matchesSearch =
                        !term ||
                        c.name?.toLowerCase().includes(term) ||
                        c.phone?.toLowerCase().includes(term);

                  let matchesFilter = true;
                  if (filter === 'due') {
                        matchesFilter = (c.currentDue || 0) > 0;
                  } else if (filter === 'cleared') {
                        matchesFilter = (c.currentDue || 0) === 0;
                  }

                  return matchesSearch && matchesFilter;
            });
      }, [customers, search, filter]);

      const handleAddCustomer = async () => {
            if (!newName || !newPhone) {
                  notify('Missing details', 'error', 'Enter customer name and phone.');
                  return;
            }
            if (newPhone.length !== 10) {
                  notify('Invalid phone', 'error', 'Phone number must be exactly 10 digits.');
                  return;
            }

            try {
                  const created = await API.addCustomer(newName, newPhone);
                  setCustomers((p) => [...p, created]);
                  setSelected(created);
                  setNewName('');
                  setNewPhone('');
                  notify('Customer added', 'success', created.name);
            } catch (err) {
                  notify('Failed to add customer', 'error', err.message || '');
            }
      };

      const handleSaveTxn = async () => {
            if (!selected || !txnAmount) {
                  notify('Missing amount', 'error', 'Enter a transaction amount.');
                  return;
            }

            if (editingIndex !== null && editingIndex >= 0) {
                  const old = selected.ledger[editingIndex];
                  if (!old) {
                        notify('Edit failed', 'error', 'Transaction not found.');
                        return;
                  }

                  const updatedEntry = {
                        ...old,
                        type: txnType,
                        amount: Number(txnAmount),
                        note: txnNote,
                  };

                  const newLedger = selected.ledger.map((t, i) =>
                        i === editingIndex ? updatedEntry : t,
                  );

                  const updatedCustomer = {
                        ...selected,
                        ledger: newLedger,
                  };

                  setSelected(updatedCustomer);
                  setCustomers((prev) =>
                        prev.map((c) => (c.phone === selected.phone ? updatedCustomer : c)),
                  );

                  setEditingIndex(null);
                  setSelectedTxnIds(new Set());
                  setChatMenuOpen(false);
                  setTxnAmount('');
                  setTxnNote('');

                  notify('Transaction updated', 'success');
                  return;
            }

            try {
                  const updated = await API.addTxn(
                        selected.phone,
                        txnType,
                        Number(txnAmount),
                        txnNote,
                  );

                  setSelectedTxnIds(new Set());
                  setChatMenuOpen(false);

                  setSelected(updated);
                  setCustomers((prev) =>
                        prev.map((c) => (c.phone === updated.phone ? updated : c)),
                  );

                  setTxnAmount('');
                  setTxnNote('');

                  notify('Transaction saved', 'success');
            } catch (err) {
                  notify('Failed to save', 'error', err.message || '');
            }
      };

      const handleDeleteCustomer = async (customer) => {
            const ok = window.confirm(
                  `Delete customer "${customer.name}" and all its ledger entries?`,
            );
            if (!ok) return;

            setCustomers((prev) => prev.filter((c) => c.phone !== customer.phone));
            if (selected?.phone === customer.phone) {
                  setSelected(null);
                  setSelectedTxnIds(new Set());
                  setChatMenuOpen(false);
            }

            if (lastDeleted?.timeoutId) {
                  clearTimeout(lastDeleted.timeoutId);
            }

            const timeoutId = setTimeout(async () => {
                  try {
                        await fetch(`/api/customers/${encodeURIComponent(customer.phone)}`, {
                              method: 'DELETE',
                              headers: { Authorization: `Bearer ${getToken()}` },
                        });
                  } catch (err) {
                        console.error('deleteCustomer API error (after undo window):', err);
                        notify('Server delete failed', 'error', 'Customer was removed locally.');
                  }
                  setLastDeleted(null);
            }, 10000);

            setLastDeleted({ customer, timeoutId });
            notify('Customer deleted', 'info', 'You can undo for 10 seconds.');
      };

      const handleUndoDelete = () => {
            if (!lastDeleted) return;
            const { customer, timeoutId } = lastDeleted;
            clearTimeout(timeoutId);
            setCustomers((prev) => [customer, ...prev]);
            if (!selected) setSelected(customer);
            setLastDeleted(null);
            notify('Delete undone', 'success');
      };

      const sendDueReminder = () => {
            if (!selected) return;

            const lastTxn =
                  selected.ledger && selected.ledger.length
                        ? selected.ledger[selected.ledger.length - 1]
                        : null;

            const dateStr = lastTxn?.date || '';
            const typeLabel =
                  lastTxn?.type === 'credit'
                        ? 'Udhaar'
                        : lastTxn?.type === 'payment'
                              ? 'Payment'
                              : '';
            const amountStr =
                  lastTxn && lastTxn.amount ? `₹${lastTxn.amount}` : '';
            const noteStr = lastTxn?.note ? lastTxn.note : '';

            const khataUrl = getPublicKhataUrl(selected.phone);

            const text = encodeURIComponent(
                  [
                        `InfraCredit Statement for ${selected.name}`,
                        `Phone:  ${selected.phone}`,
                        `Current Due: ₹${selected.currentDue}`,
                        '',
                        lastTxn
                              ? `Last entry: ${typeLabel} ${amountStr} on ${dateStr}${noteStr ? ` (${noteStr})` : ''
                              }.`
                              : 'There is no ledger entry yet.',
                        '',
                        'See your full khata here:',
                        khataUrl,
                        '',
                        '— InfraCredit Khata',
                  ].join('\n'),
            );

            const phoneDigits = selected.phone.replace(/[^0-9]/g, '');
            window.open(`https://wa.me/${phoneDigits}?text=${text}`, '_blank');
            notify('Opening WhatsApp', 'info');
      };

      const rootBg = isDark ? 'bg-slate-900' : 'bg-slate-100';
      const textColor = isDark ? 'text-slate-100' : 'text-slate-900';
      const sidebarBg = isDark ? 'bg-slate-950' : 'bg-white';
      const sidebarBorder = isDark ? 'border-slate-800' : 'border-slate-200';
      const headerBg = isDark ? 'bg-slate-900' : 'bg-slate-100';
      const chipBg = isDark ? 'bg-slate-900' : 'bg-slate-100';
      const inputBg = isDark ? 'bg-slate-800' : 'bg-slate-200';
      const chatBg = isDark
            ? 'bg-[radial-gradient(circle_at_top,#1f2937,#020617)]'
            : 'bg-[radial-gradient(circle_at_top,#e5e7eb,#ffffff)]';
      const bubbleCredit = isDark
            ? 'bg-emerald-600 text-slate-900'
            : 'bg-emerald-500 text-white';
      const bubblePayment = isDark
            ? 'bg-slate-800 text-slate-100'
            : 'bg-white text-slate-900';

      const scrollToBottom = useCallback(() => {
            if (messagesEndRef.current) {
                  messagesEndRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'end',
                  });
            }
      }, []);

      useEffect(() => {
            scrollToBottom();
      }, [selected?.phone, selected?.ledger?.length, scrollToBottom]);

      const toggleTxnSelect = (idx) => {
            setSelectedTxnIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(idx)) next.delete(idx);
                  else next.add(idx);
                  return next;
            });
      };

      const clearTxnSelection = () => {
            setSelectedTxnIds(new Set());
            setChatMenuOpen(false);
            setEditingIndex(null);
      };

      const handleChatMenuClick = () => {
            if (selectedTxnIds.size === 0) return;
            setChatMenuOpen((v) => !v);
      };

      const handleTxnAction = (action) => {
            if (!selected || selectedTxnIds.size === 0) return;

            const idsArray = Array.from(selectedTxnIds);
            const txns =
                  selected.ledger?.filter((_, idx) => idsArray.includes(idx)) || [];

            if (action === 'details') {
                  const msg = txns
                        .map(
                              (t) =>
                                    `${t.type.toUpperCase()} ₹${t.amount} on ${formatDateTime(
                                          t.createdAt || t.date,
                                    )}\nNote: ${t.note || '-'}`,
                        )
                        .join('\n\n');
                  notify('Transaction details', 'info', msg);
                  clearTxnSelection();
                  return;
            }

            if (action === 'delete') {
                  const remaining = selected.ledger.filter(
                        (_, idx) => !idsArray.includes(idx),
                  );
                  const updated = { ...selected, ledger: remaining };
                  setSelected(updated);
                  setCustomers((prev) =>
                        prev.map((c) => (c.phone === selected.phone ? updated : c)),
                  );
                  clearTxnSelection();
                  notify('Transactions deleted', 'success');
                  return;
            }

            if (action === 'edit') {
                  if (txns.length === 1) {
                        const t = txns[0];
                        const indexInLedger = selected.ledger.findIndex((item) => item === t);
                        setEditingIndex(indexInLedger);
                        setTxnType(t.type || 'credit');
                        setTxnAmount(String(t.amount || ''));
                        setTxnNote(t.note || '');
                        setChatMenuOpen(false);
                        notify('Edit mode', 'info', 'Update the fields and press Save.');
                  } else {
                        notify(
                              'Select only one entry',
                              'error',
                              'Edit is allowed for one entry at a time.',
                        );
                        clearTxnSelection();
                  }
            }
      };

      const filteredLedger = useMemo(() => {
            if (!selected || !selected.ledger) return [];

            const term = chatSearch.trim().toLowerCase();
            if (!term) return selected.ledger;

            return selected.ledger.filter((t) => {
                  const note = t.note?.toLowerCase() || '';
                  const amount = String(t.amount || '').toLowerCase();
                  const when = formatDateTime(t.createdAt || t.date).toLowerCase();
                  return note.includes(term) || amount.includes(term) || when.includes(term);
            });
      }, [selected, chatSearch]);

      if (loading) {
            return (
                  <div
                        className={`min-h-screen flex items-center justify-center ${rootBg} ${textColor}`}
                  >
                        Loading...
                        <ToastContainer
                              toasts={toasts}
                              removeToast={removeToast}
                              isDark={isDark}
                        />
                  </div>
            );
      }

      return (
            <div
                  className={`min-h-screen ${rootBg} ${textColor} flex flex-col md:flex-row`}
            >
                  <div className="flex flex-1 max-h-screen w-full">
                        {/* LEFT: CUSTOMER LIST */}
                        <aside
                              className={`w-full md:w-80 ${sidebarBg} border-r ${sidebarBorder} flex flex-col`}
                        >
                              {/* Top bar */}
                              <div
                                    className={`flex items-center justify-between px-4 py-3 ${headerBg} border-b ${sidebarBorder}`}
                              >
                                    <div>
                                          <h1 className="text-lg font-semibold">InfraCredit</h1>
                                          <p className="text-[10px] text-slate-400">Digital Khata</p>
                                    </div>

                                    <button
                                          onClick={() => setTheme(isDark ? 'light' : 'dark')}
                                          className="text-xl rounded-full px-2 py-1 hover:bg-slate-700/40 transition-colors select-none"
                                          title="Toggle theme"
                                    >
                                          {isDark ? '🌙' : '☀️'}
                                    </button>
                              </div>

                              {/* Search + filter */}
                              <div className={`px-3 pt-3 ${sidebarBg} space-y-2`}>
                                    <div
                                          className={`flex items-center ${chipBg} rounded-full px-3 py-1.5 gap-2`}
                                    >
                                          <span className="text-slate-400 text-sm select-none">🔍</span>
                                          <input
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                placeholder="Search name or number"
                                                className="bg-transparent flex-1 text-xs focus:outline-none"
                                          />
                                    </div>
                                    <div className="flex gap-1 text-[10px]">
                                          <button
                                                onClick={() => setFilter('all')}
                                                className={`px-3 py-1 rounded-full border ${filter === 'all'
                                                            ? 'bg-emerald-500 text-black border-emerald-500'
                                                            : `${chipBg} ${sidebarBorder} text-slate-300`
                                                      }`}
                                          >
                                                All
                                          </button>
                                          <button
                                                onClick={() => setFilter('due')}
                                                className={`px-3 py-1 rounded-full border ${filter === 'due'
                                                            ? 'bg-amber-500 text-black border-amber-500'
                                                            : `${chipBg} ${sidebarBorder} text-slate-300`
                                                      }`}
                                          >
                                                Credit Due
                                          </button>
                                          <button
                                                onClick={() => setFilter('cleared')}
                                                className={`px-3 py-1 rounded-full border ${filter === 'cleared'
                                                            ? 'bg-sky-500 text-black border-sky-500'
                                                            : `${chipBg} ${sidebarBorder} text-slate-300`
                                                      }`}
                                          >
                                                Cleared
                                          </button>
                                    </div>
                              </div>

                              {/* New customer form */}
                              <div
                                    className={`px-3 pb-3 pt-2 ${sidebarBg} border-b ${sidebarBorder}`}
                              >
                                    <div className={`${headerBg} rounded-2xl p-3 space-y-2`}>
                                          <input
                                                placeholder="Customer Name"
                                                className={`${inputBg} rounded-full px-3 py-2 w-full text-xs focus:outline-none`}
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                          />
                                          <input
                                                placeholder="Phone (10 digits)"
                                                className={`${inputBg} rounded-full px-3 py-2 w-full text-xs focus:outline-none`}
                                                value={newPhone}
                                                onChange={(e) => {
                                                      const digits = e.target.value.replace(/\D/g, '');
                                                      if (digits.length <= 10) setNewPhone(digits);
                                                }}
                                          />
                                          <button
                                                onClick={handleAddCustomer}
                                                className="mt-1 w-full bg-emerald-500 hover:bg-emerald-600 rounded-full py-2 text-xs font-semibold text-black"
                                          >
                                                + Add Customer
                                          </button>
                                    </div>
                              </div>

                              {/* Undo bar */}
                              {lastDeleted && (
                                    <div className="px-3 py-2 bg-amber-900 text-amber-100 text-[11px] flex items-center justify-between">
                                          <span>
                                                Deleted {lastDeleted.customer.name}. Undo within 10 seconds.
                                          </span>
                                          <button
                                                onClick={handleUndoDelete}
                                                className="underline font-semibold"
                                          >
                                                Undo
                                          </button>
                                    </div>
                              )}

                              {/* Customer list */}
                              <div className={`flex-1 overflow-y-auto ${sidebarBg}`}>
                                    {filteredCustomers.map((c) => (
                                          <div
                                                key={c.phone}
                                                className={`w-full px-3 py-3 flex items-center gap-3 border-b ${sidebarBorder} ${selected?.phone === c.phone && isDark ? 'bg-slate-900' : ''
                                                      } ${selected?.phone === c.phone && !isDark ? 'bg-slate-100' : ''
                                                      }`}
                                          >
                                                <button
                                                      onClick={() => {
                                                            setSelected(c);
                                                            clearTxnSelection();
                                                      }}
                                                      className="flex-1 flex items-center gap-3 text-left"
                                                >
                                                      <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                                                            {c.name?.[0]?.toUpperCase() || 'C'}
                                                      </div>

                                                      <div className="flex-1">
                                                            <div className="flex justify-between items-center">
                                                                  <p className="text-sm font-semibold">{c.name}</p>
                                                                  <span className="text-[10px] text-slate-500">
                                                                        {c.ledger && c.ledger.length
                                                                              ? formatDateTime(
                                                                                    c.ledger[c.ledger.length - 1].createdAt ||
                                                                                    c.ledger[c.ledger.length - 1].date,
                                                                              )
                                                                              : ''}
                                                                  </span>
                                                            </div>
                                                            <div className="flex justify-between items-center mt-1">
                                                                  <p className="text-[11px] text-slate-400 truncate max-w-40">
                                                                        {c.ledger && c.ledger.length
                                                                              ? c.ledger[c.ledger.length - 1].note ||
                                                                              `${c.ledger[c.ledger.length - 1].type.toUpperCase()} ₹${c.ledger[c.ledger.length - 1].amount
                                                                              }`
                                                                              : 'No transactions yet'}
                                                                  </p>
                                                                  <span
                                                                        className={`ml-2 text-[11px] font-semibold ${(c.currentDue || 0) > 0
                                                                                    ? 'text-amber-500'
                                                                                    : 'text-emerald-500'
                                                                              }`}
                                                                  >
                                                                        ₹{c.currentDue}
                                                                  </span>
                                                            </div>
                                                      </div>
                                                </button>

                                                <button
                                                      onClick={() => handleDeleteCustomer(c)}
                                                      className="text-[11px] text-red-400 hover:text-red-300 select-none"
                                                      title="Delete customer"
                                                >
                                                      🗑
                                                </button>
                                          </div>
                                    ))}
                                    {filteredCustomers.length === 0 && (
                                          <div className="text-center text-xs text-slate-500 mt-8 px-4">
                                                No customers match this search/filter.
                                          </div>
                                    )}
                              </div>
                        </aside>

                        {/* RIGHT: CHAT WINDOW */}
                        <main className={`flex-1 flex flex-col ${chatBg}`}>
                              {!selected ? (
                                    <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                                          Select a customer to view Borrow &amp; Payment history.
                                    </div>
                              ) : (
                                    <>
                                          {/* Top bar */}
                                          <div
                                                className={`flex items-center justify-between px-4 py-3 ${headerBg} border-b ${sidebarBorder}`}
                                          >
                                                <div className="flex items-center gap-3">
                                                      <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                                                            {selected.name?.[0]?.toUpperCase() || 'C'}
                                                      </div>
                                                      <div>
                                                            <p className="text-sm font-semibold">{selected.name}</p>
                                                            <p className="text-[10px] text-slate-400">
                                                                  {selected.phone}
                                                            </p>
                                                      </div>
                                                </div>
                                                <div className="flex items-center gap-3 text-slate-300">
                                                      {selectedTxnIds.size > 0 && (
                                                            <span className="text-[11px]">
                                                                  {selectedTxnIds.size} selected
                                                            </span>
                                                      )}
                                                      <button
                                                            onClick={sendDueReminder}
                                                            className="hidden sm:inline-flex text-[11px] bg-emerald-600 hover:bg-emerald-500 text-black rounded-full px-3 py-1"
                                                      >
                                                            WhatsApp Reminder
                                                      </button>
                                                      <button
                                                            onClick={handleChatMenuClick}
                                                            disabled={selectedTxnIds.size === 0}
                                                            className={`text-xl relative select-none ${selectedTxnIds.size === 0
                                                                        ? 'text-slate-500 cursor-default'
                                                                        : 'cursor-pointer'
                                                                  }`}
                                                      >
                                                            ⋮
                                                            {chatMenuOpen && selectedTxnIds.size > 0 && (
                                                                  <div className="absolute right-0 mt-2 w-32 bg-slate-800 text-[11px] rounded-md shadow-lg z-20">
                                                                        <button
                                                                              className="w-full text-left px-3 py-2 hover:bg-slate-700"
                                                                              onClick={() => handleTxnAction('edit')}
                                                                        >
                                                                              Edit
                                                                        </button>
                                                                        <button
                                                                              className="w-full text-left px-3 py-2 hover:bg-slate-700"
                                                                              onClick={() => handleTxnAction('delete')}
                                                                        >
                                                                              Delete
                                                                        </button>
                                                                        <button
                                                                              className="w-full text-left px-3 py-2 hover:bg-slate-700"
                                                                              onClick={() => handleTxnAction('details')}
                                                                        >
                                                                              Details
                                                                        </button>
                                                                        <button
                                                                              className="w-full text-left px-3 py-2 hover:bg-slate-700"
                                                                              onClick={clearTxnSelection}
                                                                        >
                                                                              Clear selection
                                                                        </button>
                                                                  </div>
                                                            )}
                                                      </button>
                                                </div>
                                          </div>

                                          {/* Current due banner */}
                                          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                                                <span>Current Due: ₹{selected.currentDue}</span>
                                                <button
                                                      onClick={sendDueReminder}
                                                      className="sm:hidden text-[11px] underline"
                                                >
                                                      WhatsApp Reminder
                                                </button>
                                          </div>

                                          {/* Chat search bar */}
                                          <div className="px-4 py-2 border-b border-slate-700 text-[11px] flex items-center gap-2">
                                                <span className="text-slate-400 select-none">🔍</span>
                                                <input
                                                      value={chatSearch}
                                                      onChange={(e) => setChatSearch(e.target.value)}
                                                      placeholder="Search in this khata by note, amount or date"
                                                      className="flex-1 bg-transparent focus:outline-none text-xs"
                                                />
                                                {chatSearch && (
                                                      <button
                                                            onClick={() => setChatSearch('')}
                                                            className="text-slate-400 select-none"
                                                      >
                                                            ✕
                                                      </button>
                                                )}
                                          </div>

                                          {/* Messages area */}
                                          <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 space-y-2">
                                                {filteredLedger.length > 0 && (
                                                      <div className="flex justify-center mb-2">
                                                            <span className="text-[10px] bg-slate-800 text-slate-300 rounded-full px-3 py-1">
                                                                  Borrow history
                                                            </span>
                                                      </div>
                                                )}

                                                {filteredLedger
                                                      .slice()
                                                      .sort(
                                                            (a, b) =>
                                                                  new Date(a.createdAt || a.date).getTime() -
                                                                  new Date(b.createdAt || b.date).getTime(),
                                                      )
                                                      .map((t, idx) => {
                                                            const isCredit = t.type === 'credit';
                                                            const bubbleClass = isCredit
                                                                  ? bubbleCredit
                                                                  : bubblePayment;
                                                            const justify = isCredit ? 'flex-end' : 'flex-start';

                                                            const when = formatDateTime(t.createdAt || t.date);
                                                            const title =
                                                                  t.type === 'credit'
                                                                        ? 'Due'
                                                                        : t.type === 'payment'
                                                                              ? 'Payment'
                                                                              : 'Entry';

                                                            const isSelected = selectedTxnIds.has(idx);

                                                            return (
                                                                  <div
                                                                        key={idx}
                                                                        className="w-full flex"
                                                                        style={{ justifyContent: justify }}
                                                                  >
                                                                        <button
                                                                              type="button"
                                                                              onClick={() => toggleTxnSelect(idx)}
                                                                              className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs shadow-sm text-left ${bubbleClass} border ${isSelected
                                                                                          ? 'border-amber-400'
                                                                                          : 'border-transparent'
                                                                                    }`}
                                                                        >
                                                                              <div className="flex justify-between items-center gap-2">
                                                                                    <span className="font-semibold">
                                                                                          {title} · ₹{t.amount}
                                                                                    </span>
                                                                                    <span className="text-[10px] opacity-80">
                                                                                          {when}
                                                                                    </span>
                                                                              </div>

                                                                              {t.note && (
                                                                                    <div className="mt-1 text-[11px] whitespace-pre-line">
                                                                                          {t.note}
                                                                                    </div>
                                                                              )}

                                                                              {typeof t.balanceAfter === 'number' && (
                                                                                    <div className="mt-1 text-[10px] opacity-80 text-right">
                                                                                          Due after entry: ₹{t.balanceAfter}
                                                                                    </div>
                                                                              )}
                                                                        </button>
                                                                  </div>
                                                            );
                                                      })}

                                                {filteredLedger.length === 0 && (
                                                      <div className="flex flex-col items-center justify-center h-full text-xs text-slate-500">
                                                            <p>No transactions match this search.</p>
                                                            <p>Clear search or add a new Udhaar/Payment below.</p>
                                                      </div>
                                                )}

                                                <div ref={messagesEndRef} />
                                          </div>

                                          {/* Bottom input bar */}
                                          <div
                                                className={`px-2 sm:px-4 py-2 ${headerBg} border-t ${sidebarBorder} flex items-center gap-2`}
                                          >
                                                <select
                                                      className={`${inputBg} text-[11px] rounded-full px-2 py-2 text-slate-100 focus:outline-none`}
                                                      value={txnType}
                                                      onChange={(e) => setTxnType(e.target.value)}
                                                >
                                                      <option value="credit">Credit Due</option>
                                                      <option value="payment">Payment</option>
                                                </select>

                                                <input
                                                      type="number"
                                                      placeholder="₹ Amount"
                                                      className={`${inputBg} rounded-full px-3 py-2 w-24 text-xs focus:outline-none`}
                                                      value={txnAmount}
                                                      onChange={(e) => setTxnAmount(e.target.value)}
                                                />

                                                <input
                                                      placeholder="Note"
                                                      className={`${inputBg} rounded-full px-3 py-2 flex-1 text-xs focus:outline-none`}
                                                      value={txnNote}
                                                      onChange={(e) => setTxnNote(e.target.value)}
                                                />

                                                <button
                                                      onClick={handleSaveTxn}
                                                      disabled={!selected || !txnAmount}
                                                      className={`rounded-full px-4 py-2 text-xs font-semibold ${!selected || !txnAmount
                                                                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                                                  : 'bg-emerald-500 hover:bg-emerald-600 text-black'
                                                            }`}
                                                >
                                                      {editingIndex !== null ? 'Update' : 'Save'}
                                                </button>
                                          </div>
                                    </>
                              )}
                        </main>
                  </div>

                  <ToastContainer
                        toasts={toasts}
                        removeToast={removeToast}
                        isDark={isDark}
                  />
            </div>
      );
}
