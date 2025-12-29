'use client';
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
      View,
      Text,
      TextInput,
      TouchableOpacity,
      FlatList,
      SafeAreaView,
      StatusBar,
      ScrollView,
      RefreshControl,
      Alert,
      Platform,
      Dimensions,
      Picker
} from 'react-native';
import { useWindowDimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ================================
// TOKEN HELPER
// ================================
const getToken = () => {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem('token');
};

// ================================
// DATETIME FORMATTER
// ================================
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

// ================================
// PUBLIC KHATA URL HELPER
// ================================
const getPublicKhataUrl = (phone) => {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      return `${origin}/khata/${encodeURIComponent(phone)}`;
};

// ================================
// API LAYER
// ================================
const API = {
      listCustomers: async () => {
            const token = getToken();
            if (!token) throw new Error('No token');
            const res = await fetch('/api/customers', {
                  headers: { 'Authorization': `Bearer ${token}` },
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
                        'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ name, phone }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'addCustomer failed');
            return data;
      },

      addTxn: async (phone, type, amount, note) => {
            const token = getToken();
            if (!token) throw new Error('No token');
            const res = await fetch(`/api/customers/${encodeURIComponent(phone)}`, {
                  method: 'POST',
                  headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ type, amount, note }),
            });
            if (!res.ok) throw new Error('addTxn failed');
            return res.json();
      },

      deleteCustomer: async (phone) => {
            const token = getToken();
            if (!token) throw new Error('No token');
            const res = await fetch(`/api/customers/${encodeURIComponent(phone)}`, {
                  method: 'DELETE',
                  headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('deleteCustomer failed');
      },
};

// ================================
// TOAST SYSTEM
// ================================
const TOAST_DURATION = 3200;

const ToastContainer = ({ toasts, removeToast, isDark }) => {
      if (!toasts.length) return null;

      const baseBg = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';
      const baseBorder = isDark ? '#334155' : '#d1d5db';
      const shadow = isDark ? '0 18px 40px rgba(15,23,42,0.75)' : '0 18px 40px rgba(15,23,42,0.25)';

      const typeStyles = {
            success: `border-emerald-500/70`,
            error: `border-rose-500/70`,
            info: `border-sky-500/70`,
      };

      const typeAccent = {
            success: '#10b981',
            error: '#ef4444',
            info: '#0ea5e9',
      };

      return (
            <View style={{
                  position: 'absolute',
                  zIndex: 9999,
                  top: 20,
                  left: 0,
                  right: 0,
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  gap: 8,
            }}>
                  {toasts.map((t) => (
                        <View
                              key={t.id}
                              style={{
                                    backgroundColor: baseBg,
                                    borderRadius: 16,
                                    borderWidth: 1,
                                    borderColor: baseBorder,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 8 },
                                    shadowOpacity: 0.44,
                                    shadowRadius: 20,
                                    elevation: 24,
                                    maxWidth: '90%',
                                    padding: 16,
                                    flexDirection: 'row',
                                    gap: 12,
                                    alignItems: 'flex-start',
                              }}
                        >
                              <View style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    backgroundColor: typeAccent[t.type],
                                    alignItems: 'center',
                                    justifyContent: 'center',
                              }}>
                                    <Text style={{ fontSize: 12, color: 'white', fontWeight: 'bold' }}>
                                          {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
                                    </Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                    <Text style={{
                                          fontSize: 14,
                                          fontWeight: '600',
                                          color: isDark ? '#f8fafc' : '#1e293b',
                                          marginBottom: 4,
                                    }}>
                                          {t.title}
                                    </Text>
                                    <Text style={{
                                          fontSize: 13,
                                          color: isDark ? '#cbd5e1' : '#64748b',
                                          lineHeight: 18,
                                    }}>
                                          {t.message}
                                    </Text>
                              </View>
                              <TouchableOpacity onPress={() => removeToast(t.id)}>
                                    <Text style={{ fontSize: 16, color: '#94a3b8' }}>✕</Text>
                              </TouchableOpacity>
                        </View>
                  ))}
            </View>
      );
};

// ================================
// MAIN COMPONENT
// ================================
export default function OwnerDashboard() {
      const { width: screenWidth, height: screenHeight } = useWindowDimensions();

      // Responsive breakpoints
      const isMobile = screenWidth < 768;
      const isTablet = screenWidth >= 768 && screenWidth < 1024;
      const fontScale = Math.min(1, screenWidth / 400);

      // All existing state
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
      const [isMobileView, setIsMobileView] = useState(true);
      const [showListOnMobile, setShowListOnMobile] = useState(true);
      const [refreshing, setRefreshing] = useState(false); // NEW: Pull to refresh

      const isDark = theme === 'dark';
      const messagesEndRef = useRef(null);

      // Responsive values
      const sidebarWidth = isMobile ? '100%' : isTablet ? '40%' : '30%';
      const safeTop = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
      const safeBottom = 20;

      // Toast notifications
      const notify = (title, type = 'info', message) => {
            const id = Date.now() + Math.random();
            setToasts(prev => [...prev, { id, title, message, type }]);
            setTimeout(() => {
                  setToasts(prev => prev.filter(t => t.id !== id));
            }, TOAST_DURATION);
      };

      const removeToast = (id) => {
            setToasts(prev => prev.filter(t => t.id !== id));
      };

      // Load customers
      const load = async () => {
            try {
                  const data = await API.listCustomers();
                  setCustomers(data);
                  if (!selected && data.length) setSelected(data[0]);
                  if (selected) {
                        const fresh = data.find(c => c.phone === selected.phone);
                        if (fresh) setSelected(fresh);
                  }
            } catch (err) {
                  console.error(err);
                  notify('Session expired', 'error', 'Please login again.');
            } finally {
                  setLoading(false);
            }
      };

      // NEW: Refresh customer data
      const refreshCustomers = async () => {
            setRefreshing(true);
            try {
                  await load();
                  notify('Data refreshed', 'success');
            } catch (err) {
                  notify('Refresh failed', 'error');
            } finally {
                  setRefreshing(false);
            }
      };

      // Refresh specific customer
      const refreshCustomer = async (phone) => {
            try {
                  const data = await API.listCustomers();
                  const fresh = data.find(c => c.phone === phone);
                  if (fresh) {
                        setSelected(fresh);
                        setCustomers(prev => prev.map(c => c.phone === phone ? fresh : c));
                        notify('Customer data refreshed', 'success');
                  }
            } catch (err) {
                  notify('Refresh failed', 'error');
            }
      };

      useEffect(() => {
            load();
      }, []);

      // Responsive layout detection
      useEffect(() => {
            const handleResize = () => {
                  const mobile = screenWidth < 768;
                  setIsMobileView(mobile);
                  if (!mobile) {
                        setShowListOnMobile(true);
                  } else if (!selected) {
                        setShowListOnMobile(true);
                  }
            };
            handleResize();
            Dimensions.addEventListener('change', handleResize);
            return () => {
                  // Cleanup listener
            };
      }, [screenWidth]);

      const filteredCustomers = useMemo(() => {
            const term = search.trim().toLowerCase();
            return customers.filter(c => {
                  const matchesSearch = !term ||
                        c.name?.toLowerCase().includes(term) ||
                        c.phone?.toLowerCase().includes(term);
                  let matchesFilter = true;
                  if (filter === 'due') matchesFilter = c.currentDue > 0;
                  else if (filter === 'cleared') matchesFilter = c.currentDue === 0;
                  return matchesSearch && matchesFilter;
            });
      }, [customers, search, filter]);

      const filteredLedger = useMemo(() => {
            if (!selected || !selected.ledger) return [];
            const term = chatSearch.trim().toLowerCase();
            if (!term) return selected.ledger;
            return selected.ledger.filter(t => {
                  const note = t.note?.toLowerCase();
                  const amount = String(t.amount).toLowerCase();
                  const when = formatDateTime(t.createdAt || t.date).toLowerCase();
                  return note?.includes(term) || amount.includes(term) || when.includes(term);
            });
      }, [selected, chatSearch]);

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
                  setCustomers(prev => [...prev, created]);
                  setSelected(created);
                  setNewName('');
                  setNewPhone('');
                  notify('Customer added', 'success', created.name);
                  if (isMobileView) setShowListOnMobile(false);
            } catch (err) {
                  notify('Failed to add customer', 'error', err.message);
            }
      };

      const handleSaveTxn = async () => {
            if (!selected || !txnAmount) {
                  notify('Missing amount', 'error', 'Enter a transaction amount.');
                  return;
            }

            if (editingIndex !== null && editingIndex >= 0) {
                  // Edit existing transaction
                  const old = selected.ledger[editingIndex];
                  if (!old) {
                        notify('Edit failed', 'error', 'Transaction not found.');
                        return;
                  }
                  const updatedEntry = { ...old, type: txnType, amount: Number(txnAmount), note: txnNote };
                  const newLedger = selected.ledger.map((t, i) => i === editingIndex ? updatedEntry : t);
                  const updatedCustomer = { ...selected, ledger: newLedger };
                  setSelected(updatedCustomer);
                  setCustomers(prev => prev.map(c => c.phone === selected.phone ? updatedCustomer : c));
                  setEditingIndex(null);
                  setSelectedTxnIds(new Set());
                  setChatMenuOpen(false);
                  setTxnAmount('');
                  setTxnNote('');
                  notify('Transaction updated', 'success');
                  return;
            }

            try {
                  const updated = await API.addTxn(selected.phone, txnType, Number(txnAmount), txnNote);
                  setSelectedTxnIds(new Set());
                  setChatMenuOpen(false);
                  setSelected(updated);
                  setCustomers(prev => prev.map(c => c.phone === updated.phone ? updated : c));
                  setTxnAmount('');
                  setTxnNote('');
                  notify('Transaction saved', 'success');
                  refreshCustomer(selected.phone); // Auto-refresh after save
            } catch (err) {
                  notify('Failed to save', 'error', err.message);
            }
      };

      const handleDeleteCustomer = async (customer) => {
            const ok = await new Promise(resolve => {
                  Alert.alert(
                        'Delete Customer',
                        `Delete ${customer.name} and all its ledger entries?`,
                        [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => resolve(true) }]
                  );
            });
            if (!ok) return;

            setCustomers(prev => prev.filter(c => c.phone !== customer.phone));
            if (selected?.phone === customer.phone) {
                  setSelected(null);
                  setSelectedTxnIds(new Set());
                  setChatMenuOpen(false);
                  if (isMobileView) setShowListOnMobile(true);
            }

            if (lastDeleted?.timeoutId) clearTimeout(lastDeleted.timeoutId);
            const timeoutId = setTimeout(async () => {
                  try {
                        await API.deleteCustomer(customer.phone);
                  } catch (err) {
                        console.error('deleteCustomer API error after undo window', err);
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
            setCustomers(prev => [customer, ...prev.filter(c => c.phone !== customer.phone)]);
            if (!selected) setSelected(customer);
            setLastDeleted(null);
            notify('Delete undone', 'success');
      };

      const sendDueReminder = () => {
            if (!selected) return;
            const lastTxn = selected.ledger?.length ? selected.ledger[selected.ledger.length - 1] : null;
            const dateStr = lastTxn?.date;
            const typeLabel = lastTxn?.type === 'credit' ? 'Udhaar' : 'Payment';
            const amountStr = lastTxn?.amount ? `₹${lastTxn.amount}` : '';
            const noteStr = lastTxn?.note ? ` - ${lastTxn.note}` : '';
            const khataUrl = getPublicKhataUrl(selected.phone);

            const text = `InfraCredit Statement for ${selected.name}\n\n` +
                  `Phone: ${selected.phone}\n` +
                  `Current Due: ₹${selected.currentDue}\n\n` +
                  (lastTxn ? `Last entry: ${typeLabel} ${amountStr} on ${dateStr}${noteStr}` : 'There is no ledger entry yet.') +
                  `\n\nSee your full khata here: ${khataUrl}\n\nInfraCredit Khata.`;

            const rawDigits = String(selected.phone).replace(/[^0-9]/g, '');
            const waNumber = rawDigits.length === 10 ? `91${rawDigits}` : rawDigits; // E.164 for India
            window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
            notify('Opening WhatsApp', 'info');
      };

      const toggleTxnSelect = (idx) => {
            setSelectedTxnIds(prev => {
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
            setChatMenuOpen(v => !v);
      };

      const handleTxnAction = (action) => {
            if (!selected || selectedTxnIds.size === 0) return;
            const idsArray = Array.from(selectedTxnIds);
            const txns = selected.ledger?.filter((_, idx) => idsArray.includes(idx));

            if (action === 'details') {
                  const msg = txns.map(t =>
                        `${t.type.toUpperCase()} ₹${t.amount} on ${formatDateTime(t.createdAt || t.date)}, ${t.note || '-'}.`
                  ).join('\n');
                  notify('Transaction details', 'info', msg);
                  clearTxnSelection();
                  return;
            }

            if (action === 'delete') {
                  const remaining = selected.ledger.filter((_, idx) => !idsArray.includes(idx));
                  const updated = { ...selected, ledger: remaining };
                  setSelected(updated);
                  setCustomers(prev => prev.map(c => c.phone === selected.phone ? updated : c));
                  clearTxnSelection();
                  notify('Transactions deleted', 'success');
                  return;
            }

            if (action === 'edit') {
                  if (txns.length !== 1) {
                        notify('Select only one entry', 'error', 'Edit is allowed for one entry at a time.');
                        clearTxnSelection();
                        return;
                  }
                  const t = txns[0];
                  const indexInLedger = selected.ledger.findIndex(item => item === t);
                  setEditingIndex(indexInLedger);
                  setTxnType(t.type || 'credit');
                  setTxnAmount(String(t.amount));
                  setTxnNote(t.note);
                  setChatMenuOpen(false);
                  notify('Edit mode', 'info', 'Update the fields and press Save.');
            }
      };

      const showSidebar = !isMobileView || (isMobileView && showListOnMobile);
      const showChatPane = !isMobileView || (isMobileView && !showListOnMobile);

      if (loading) {
            return (
                  <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
                        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                              <Text style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 16 }}>Loading...</Text>
                        </View>
                  </SafeAreaView>
            );
      }

      return (
            <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
                  <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

                  <View style={{ flex: 1, paddingTop: safeTop, paddingBottom: safeBottom }}>

                        {/* Sidebar - Customer List */}
                        {showSidebar && (
                              <View style={{
                                    width: isMobile ? '100%' : sidebarWidth,
                                    flexDirection: 'column',
                                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                    borderRightWidth: isMobile ? 0 : 1,
                                    borderRightColor: isDark ? '#334155' : '#e2e8f0',
                                    minHeight: '100%',
                              }}>

                                    {/* Header */}
                                    <View style={{
                                          paddingHorizontal: Math.max(16, screenWidth * 0.04),
                                          paddingVertical: 16,
                                          backgroundColor: isDark ? '#1e40af' : '#3b82f6',
                                          borderBottomWidth: 1,
                                          borderBottomColor: isDark ? '#1e40af' : '#60a5fa',
                                          alignItems: 'center',
                                    }}>
                                          <Text style={{
                                                fontSize: Math.max(18, screenWidth * 0.05),
                                                fontWeight: '700',
                                                color: '#ffffff',
                                          }}>InfraCredit</Text>
                                          <Text style={{
                                                fontSize: Math.max(13, screenWidth * 0.035),
                                                color: '#bfdbfe',
                                                marginTop: 4,
                                          }}>Digital Khata</Text>
                                    </View>

                                    {/* Content */}
                                    <ScrollView
                                          style={{ flex: 1 }}
                                          refreshControl={
                                                <RefreshControl refreshing={refreshing} onRefresh={refreshCustomers} tintColor="#10b981" />
                                          }
                                    >
                                          {/* Search & Filter */}
                                          <View style={{ padding: Math.max(16, screenWidth * 0.04) }}>

                                                {/* Search */}
                                                <View style={{
                                                      backgroundColor: isDark ? '#334155' : '#f1f5f9',
                                                      borderRadius: 24,
                                                      paddingHorizontal: 16,
                                                      paddingVertical: 12,
                                                      marginBottom: 16,
                                                      flexDirection: 'row',
                                                      alignItems: 'center',
                                                }}>
                                                      <TextInput
                                                            style={{
                                                                  flex: 1,
                                                                  fontSize: Math.max(15, fontScale * 16),
                                                                  color: isDark ? '#f8fafc' : '#1e293b',
                                                                  paddingVertical: 0,
                                                            }}
                                                            value={search}
                                                            onChangeText={setSearch}
                                                            placeholder="Search name or number"
                                                            placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
                                                      />
                                                </View>

                                                {/* Filter Chips */}
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                                                      <View style={{ flexDirection: 'row', gap: 8 }}>
                                                            <TouchableOpacity
                                                                  onPress={() => setFilter('all')}
                                                                  style={{
                                                                        paddingHorizontal: 16,
                                                                        paddingVertical: 8,
                                                                        borderRadius: 20,
                                                                        borderWidth: 1,
                                                                        backgroundColor: filter === 'all' ? '#10b981' : 'transparent',
                                                                        borderColor: filter === 'all' ? '#10b981' : (isDark ? '#475569' : '#d1d5db'),
                                                                  }}
                                                            >
                                                                  <Text style={{
                                                                        fontSize: Math.max(13, fontScale * 14),
                                                                        fontWeight: filter === 'all' ? '600' : '400',
                                                                        color: filter === 'all' ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569'),
                                                                  }}>All</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                  onPress={() => setFilter('due')}
                                                                  style={{
                                                                        paddingHorizontal: 16,
                                                                        paddingVertical: 8,
                                                                        borderRadius: 20,
                                                                        borderWidth: 1,
                                                                        backgroundColor: filter === 'due' ? '#f59e0b' : 'transparent',
                                                                        borderColor: filter === 'due' ? '#f59e0b' : (isDark ? '#475569' : '#d1d5db'),
                                                                  }}
                                                            >
                                                                  <Text style={{
                                                                        fontSize: Math.max(13, fontScale * 14),
                                                                        fontWeight: filter === 'due' ? '600' : '400',
                                                                        color: filter === 'due' ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569'),
                                                                  }}>Credit Due</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                  onPress={() => setFilter('cleared')}
                                                                  style={{
                                                                        paddingHorizontal: 16,
                                                                        paddingVertical: 8,
                                                                        borderRadius: 20,
                                                                        borderWidth: 1,
                                                                        backgroundColor: filter === 'cleared' ? '#0ea5e9' : 'transparent',
                                                                        borderColor: filter === 'cleared' ? '#0ea5e9' : (isDark ? '#475569' : '#d1d5db'),
                                                                  }}
                                                            >
                                                                  <Text style={{
                                                                        fontSize: Math.max(13, fontScale * 14),
                                                                        fontWeight: filter === 'cleared' ? '600' : '400',
                                                                        color: filter === 'cleared' ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569'),
                                                                  }}>Cleared</Text>
                                                            </TouchableOpacity>
                                                      </View>
                                                </ScrollView>

                                                {/* Add Customer Form */}
                                                <View style={{
                                                      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                                                      borderRadius: 16,
                                                      padding: 16,
                                                      marginBottom: 20,
                                                      borderWidth: 1,
                                                      borderColor: isDark ? '#475569' : '#e2e8f0',
                                                }}>
                                                      <TextInput
                                                            style={{
                                                                  backgroundColor: isDark ? '#334155' : '#f1f5f9',
                                                                  borderRadius: 12,
                                                                  paddingHorizontal: 16,
                                                                  paddingVertical: 12,
                                                                  marginBottom: 12,
                                                                  fontSize: Math.max(15, fontScale * 16),
                                                                  color: isDark ? '#f8fafc' : '#1e293b',
                                                            }}
                                                            placeholder="Customer Name"
                                                            value={newName}
                                                            onChangeText={setNewName}
                                                      />
                                                      <TextInput
                                                            style={{
                                                                  backgroundColor: isDark ? '#334155' : '#f1f5f9',
                                                                  borderRadius: 12,
                                                                  paddingHorizontal: 16,
                                                                  paddingVertical: 12,
                                                                  marginBottom: 12,
                                                                  fontSize: Math.max(15, fontScale * 16),
                                                                  color: isDark ? '#f8fafc' : '#1e293b',
                                                            }}
                                                            placeholder="Phone (10 digits)"
                                                            value={newPhone}
                                                            onChangeText={(text) => {
                                                                  const digits = text.replace(/\D/g, '');
                                                                  if (digits.length <= 10) setNewPhone(digits);
                                                            }}
                                                            keyboardType="phone-pad"
                                                      />
                                                      <TouchableOpacity onPress={handleAddCustomer} style={{
                                                            backgroundColor: '#10b981',
                                                            borderRadius: 12,
                                                            paddingVertical: 14,
                                                            alignItems: 'center',
                                                      }}>
                                                            <Text style={{
                                                                  color: '#ffffff',
                                                                  fontSize: Math.max(15, fontScale * 16),
                                                                  fontWeight: '600',
                                                            }}>Add Customer</Text>
                                                      </TouchableOpacity>
                                                </View>

                                                {/* Undo Bar */}
                                                {lastDeleted && (
                                                      <View style={{
                                                            padding: 12,
                                                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                                            borderRadius: 12,
                                                            marginBottom: 16,
                                                            flexDirection: 'row',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                      }}>
                                                            <Text style={{
                                                                  fontSize: 13,
                                                                  color: '#d97706',
                                                            }}>
                                                                  Deleted {lastDeleted.customer.name}. Undo within 10 seconds.
                                                            </Text>
                                                            <TouchableOpacity onPress={handleUndoDelete}>
                                                                  <Text style={{
                                                                        fontSize: 13,
                                                                        fontWeight: '600',
                                                                        color: '#d97706',
                                                                        textDecorationLine: 'underline',
                                                                  }}>Undo</Text>
                                                            </TouchableOpacity>
                                                      </View>
                                                )}

                                                {/* Customer List */}
                                                <FlatList
                                                      data={filteredCustomers}
                                                      keyExtractor={(c) => c.phone}
                                                      renderItem={({ item: c }) => (
                                                            <TouchableOpacity
                                                                  onPress={() => {
                                                                        setSelected(c);
                                                                        clearTxnSelection();
                                                                        if (isMobileView) setShowListOnMobile(false);
                                                                  }}
                                                                  style={{
                                                                        flexDirection: 'row',
                                                                        padding: 16,
                                                                        borderBottomWidth: 1,
                                                                        borderBottomColor: isDark ? '#475569' : '#f1f5f9',
                                                                        backgroundColor: selected?.phone === c.phone
                                                                              ? (isDark ? '#0f766e' : '#ecfdf5')
                                                                              : 'transparent',
                                                                  }}
                                                            >
                                                                  <View style={{
                                                                        width: 48,
                                                                        height: 48,
                                                                        borderRadius: 24,
                                                                        backgroundColor: '#059669',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        marginRight: 16,
                                                                  }}>
                                                                        <Text style={{
                                                                              color: '#ffffff',
                                                                              fontSize: 18,
                                                                              fontWeight: '700',
                                                                        }}>{c.name?.[0]?.toUpperCase() || 'C'}</Text>
                                                                  </View>
                                                                  <View style={{ flex: 1 }}>
                                                                        <Text style={{
                                                                              fontSize: Math.max(16, fontScale * 17),
                                                                              fontWeight: '600',
                                                                              color: isDark ? '#f8fafc' : '#1e293b',
                                                                              marginBottom: 4,
                                                                        }}>{c.name}</Text>
                                                                        <Text style={{
                                                                              fontSize: Math.max(13, fontScale * 14),
                                                                              color: isDark ? '#94a3b8' : '#64748b',
                                                                        }}>
                                                                              {c.ledger?.length ? formatDateTime(c.ledger[c.ledger.length - 1].createdAt || c.ledger[c.ledger.length - 1].date) : ''}
                                                                        </Text>
                                                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                                                                              <Text style={{
                                                                                    fontSize: Math.max(13, fontScale * 14),
                                                                                    color: isDark ? '#94a3b8' : '#64748b',
                                                                              }}>
                                                                                    {c.ledger?.length ? `${c.ledger[c.ledger.length - 1].type.toUpperCase()} ₹${c.ledger[c.ledger.length - 1].amount}` : 'No transactions yet'}
                                                                              </Text>
                                                                              <Text style={{
                                                                                    fontSize: Math.max(14, fontScale * 15),
                                                                                    fontWeight: '600',
                                                                                    color: c.currentDue > 0 ? '#f59e0b' : '#10b981',
                                                                              }}>
                                                                                    ₹{c.currentDue}
                                                                              </Text>
                                                                        </View>
                                                                  </View>
                                                                  <TouchableOpacity
                                                                        onPress={() => handleDeleteCustomer(c)}
                                                                        style={{ padding: 8 }}
                                                                  >
                                                                        <Text style={{
                                                                              fontSize: 14,
                                                                              color: '#ef4444',
                                                                              fontWeight: '500',
                                                                        }}>🗑️</Text>
                                                                  </TouchableOpacity>
                                                            </TouchableOpacity>
                                                      )}
                                                      ListEmptyComponent={
                                                            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                                                                  <Text style={{
                                                                        fontSize: 15,
                                                                        color: isDark ? '#94a3b8' : '#64748b',
                                                                  }}>No customers match this search/filter</Text>
                                                            </View>
                                                      }
                                                />
                                          </View>
                                    </ScrollView>
                              </View>
                        )}

                        {/* Chat Pane */}
                        {showChatPane && (
                              <View style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
                                    {!selected ? (
                                          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                                                <Text style={{
                                                      fontSize: Math.max(17, fontScale * 18),
                                                      color: isDark ? '#94a3b8' : '#64748b',
                                                      textAlign: 'center',
                                                      lineHeight: 24,
                                                }}>
                                                      Select a customer to view{'\n'}Borrow & Payment history
                                                </Text>
                                          </View>
                                    ) : (
                                          <>
                                                {/* Chat Header */}
                                                <View style={{
                                                      flexDirection: 'row',
                                                      alignItems: 'center',
                                                      paddingHorizontal: Math.max(16, screenWidth * 0.04),
                                                      paddingVertical: 16,
                                                      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                                                      borderBottomWidth: 1,
                                                      borderBottomColor: isDark ? '#475569' : '#e2e8f0',
                                                }}>
                                                      {isMobileView && (
                                                            <TouchableOpacity
                                                                  onPress={() => {
                                                                        setShowListOnMobile(true);
                                                                        clearTxnSelection();
                                                                  }}
                                                                  style={{ marginRight: 16 }}
                                                            >
                                                                  <Text style={{ fontSize: 22, color: '#94a3b8' }}>←</Text>
                                                            </TouchableOpacity>
                                                      )}
                                                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                            <View style={{
                                                                  width: 44,
                                                                  height: 44,
                                                                  borderRadius: 22,
                                                                  backgroundColor: '#059669',
                                                                  alignItems: 'center',
                                                                  justifyContent: 'center',
                                                                  marginRight: 16,
                                                            }}>
                                                                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>
                                                                        {selected.name?.[0]?.toUpperCase()}
                                                                  </Text>
                                                            </View>
                                                            <View>
                                                                  <Text style={{
                                                                        fontSize: Math.max(17, fontScale * 18),
                                                                        fontWeight: '600',
                                                                        color: isDark ? '#f8fafc' : '#1e293b',
                                                                  }}>{selected.name}</Text>
                                                                  <Text style={{
                                                                        fontSize: Math.max(14, fontScale * 15),
                                                                        color: isDark ? '#94a3b8' : '#64748b',
                                                                  }}>{selected.phone}</Text>
                                                            </View>
                                                      </View>

                                                      {/* Selection Menu */}
                                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                            {selectedTxnIds.size > 0 && (
                                                                  <Text style={{
                                                                        fontSize: 14,
                                                                        color: isDark ? '#f8fafc' : '#1e293b',
                                                                        fontWeight: '600',
                                                                  }}>
                                                                        {selectedTxnIds.size} selected
                                                                  </Text>
                                                            )}
                                                            <TouchableOpacity onPress={sendDueReminder}>
                                                                  <Text style={{
                                                                        fontSize: 13,
                                                                        backgroundColor: '#10b981',
                                                                        color: '#ffffff',
                                                                        paddingHorizontal: 16,
                                                                        paddingVertical: 8,
                                                                        borderRadius: 20,
                                                                        fontWeight: '500',
                                                                  }}>WhatsApp</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                  onPress={handleChatMenuClick}
                                                                  disabled={selectedTxnIds.size === 0}
                                                                  style={{
                                                                        padding: 8,
                                                                        borderRadius: 20,
                                                                        backgroundColor: selectedTxnIds.size === 0 ? 'transparent' : 'rgba(245, 158, 11, 0.2)',
                                                                  }}
                                                            >
                                                                  <Text style={{
                                                                        fontSize: 20,
                                                                        color: selectedTxnIds.size === 0 ? '#94a3b8' : '#f59e0b',
                                                                  }}>⋮⋮</Text>
                                                            </TouchableOpacity>
                                                      </View>
                                                </View>

                                                {/* Selection Menu Dropdown */}
                                                {chatMenuOpen && selectedTxnIds.size > 0 && (
                                                      <View style={{
                                                            position: 'absolute',
                                                            top: 80,
                                                            right: Math.max(16, screenWidth * 0.04),
                                                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                                            borderRadius: 12,
                                                            padding: 8,
                                                            shadowColor: '#000',
                                                            shadowOffset: { width: 0, height: 4 },
                                                            shadowOpacity: 0.3,
                                                            shadowRadius: 12,
                                                            elevation: 8,
                                                            zIndex: 1000,
                                                            minWidth: 140,
                                                      }}>
                                                            <TouchableOpacity
                                                                  onPress={() => handleTxnAction('edit')}
                                                                  style={{ padding: 12, borderRadius: 8 }}
                                                            >
                                                                  <Text style={{ fontSize: 14, color: isDark ? '#f8fafc' : '#1e293b' }}>Edit</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                  onPress={() => handleTxnAction('delete')}
                                                                  style={{ padding: 12, borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                                                            >
                                                                  <Text style={{ fontSize: 14, color: '#ef4444' }}>Delete</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                  onPress={() => handleTxnAction('details')}
                                                                  style={{ padding: 12, borderRadius: 8 }}
                                                            >
                                                                  <Text style={{ fontSize: 14, color: isDark ? '#f8fafc' : '#1e293b' }}>Details</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                  onPress={clearTxnSelection}
                                                                  style={{ padding: 12, borderRadius: 8 }}
                                                            >
                                                                  <Text style={{ fontSize: 14, color: '#94a3b8' }}>Clear selection</Text>
                                                            </TouchableOpacity>
                                                      </View>
                                                )}

                                                {/* Current Due Banner */}
                                                {selected.currentDue > 0 && (
                                                      <View style={{
                                                            padding: 16,
                                                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: 'rgba(245, 158, 11, 0.2)',
                                                      }}>
                                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                  <Text style={{
                                                                        fontSize: Math.max(15, fontScale * 16),
                                                                        color: '#d97706',
                                                                        fontWeight: '600',
                                                                  }}>Current Due: ₹{selected.currentDue}</Text>
                                                                  <TouchableOpacity onPress={sendDueReminder}>
                                                                        <Text style={{
                                                                              fontSize: 13,
                                                                              color: '#d97706',
                                                                              textDecorationLine: 'underline',
                                                                        }}>WhatsApp Reminder</Text>
                                                                  </TouchableOpacity>
                                                            </View>
                                                      </View>
                                                )}

                                                {/* Chat Search */}
                                                <View style={{
                                                      paddingHorizontal: Math.max(16, screenWidth * 0.04),
                                                      paddingVertical: 12,
                                                      borderBottomWidth: 1,
                                                      borderBottomColor: isDark ? '#475569' : '#e2e8f0',
                                                      flexDirection: 'row',
                                                      alignItems: 'center',
                                                      gap: 8,
                                                }}>
                                                      <Text style={{
                                                            fontSize: 13,
                                                            color: isDark ? '#94a3b8' : '#64748b',
                                                      }}>🔍</Text>
                                                      <TextInput
                                                            style={{
                                                                  flex: 1,
                                                                  fontSize: Math.max(14, fontScale * 15),
                                                                  color: isDark ? '#f8fafc' : '#1e293b',
                                                                  paddingVertical: 4,
                                                            }}
                                                            value={chatSearch}
                                                            onChangeText={setChatSearch}
                                                            placeholder="Search in this khata by note, amount or date"
                                                            placeholderTextColor={isDark ? '#94a3b8' : '#64748b'}
                                                      />
                                                      {chatSearch ? (
                                                            <TouchableOpacity onPress={() => setChatSearch('')}>
                                                                  <Text style={{ fontSize: 16, color: '#94a3b8' }}>✕</Text>
                                                            </TouchableOpacity>
                                                      ) : null}
                                                </View>

                                                {/* Transactions List with Pull to Refresh */}
                                                <FlatList
                                                      data={filteredLedger.slice().sort((a, b) =>
                                                            new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
                                                      )}
                                                      keyExtractor={(_, idx) => idx.toString()}
                                                      style={{ flex: 1 }}
                                                      contentContainerStyle={{ padding: Math.max(16, screenWidth * 0.04), paddingBottom: 20 }}
                                                      refreshControl={
                                                            <RefreshControl
                                                                  refreshing={refreshing}
                                                                  onRefresh={() => refreshCustomer(selected.phone)}
                                                                  tintColor="#10b981"
                                                                  title="Refreshing customer data..."
                                                            />
                                                      }
                                                      renderItem={({ item: t, index }) => {
                                                            const isCredit = t.type === 'credit';
                                                            const isSelected = selectedTxnIds.has(index);
                                                            return (
                                                                  <TouchableOpacity
                                                                        onPress={() => toggleTxnSelect(index)}
                                                                        style={{
                                                                              flexDirection: 'row',
                                                                              justifyContent: isCredit ? 'flex-end' : 'flex-start',
                                                                              marginVertical: 6,
                                                                        }}
                                                                  >
                                                                        <View style={{
                                                                              maxWidth: '85%',
                                                                              padding: 16,
                                                                              borderRadius: 20,
                                                                              backgroundColor: isCredit
                                                                                    ? (isDark ? '#047857' : '#d1fae5')
                                                                                    : (isDark ? '#1e293b' : '#f8fafc'),
                                                                              borderWidth: isSelected ? 2 : 0,
                                                                              borderColor: '#f59e0b',
                                                                              shadowColor: '#000',
                                                                              shadowOffset: { width: 0, height: 2 },
                                                                              shadowOpacity: 0.1,
                                                                              shadowRadius: 8,
                                                                              elevation: 3,
                                                                        }}>
                                                                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                                                                    <Text style={{
                                                                                          fontSize: Math.max(16, fontScale * 17),
                                                                                          fontWeight: '600',
                                                                                          color: isCredit ? '#065f46' : (isDark ? '#f8fafc' : '#1e293b'),
                                                                                    }}>
                                                                                          {isCredit ? 'Due' : 'Payment'} ₹{t.amount}
                                                                                    </Text>
                                                                              </View>
                                                                              <Text style={{
                                                                                    fontSize: Math.max(13, fontScale * 14),
                                                                                    color: isDark ? '#94a3b8' : '#64748b',
                                                                                    marginBottom: 8,
                                                                              }}>
                                                                                    {formatDateTime(t.createdAt || t.date)}
                                                                              </Text>
                                                                              {t.note && (
                                                                                    <Text style={{
                                                                                          fontSize: Math.max(14, fontScale * 15),
                                                                                          color: isDark ? '#cbd5e1' : '#475569',
                                                                                          lineHeight: 20,
                                                                                    }}>
                                                                                          {t.note}
                                                                                    </Text>
                                                                              )}
                                                                              {typeof t.balanceAfter === 'number' && (
                                                                                    <Text style={{
                                                                                          marginTop: 8,
                                                                                          fontSize: Math.max(12, fontScale * 13),
                                                                                          color: isDark ? '#94a3b8' : '#64748b',
                                                                                          textAlign: 'right',
                                                                                    }}>
                                                                                          Due after entry: ₹{t.balanceAfter}
                                                                                    </Text>
                                                                              )}
                                                                        </View>
                                                                  </TouchableOpacity>
                                                            );
                                                      }}
                                                      ListEmptyComponent={
                                                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 }}>
                                                                  <Text style={{
                                                                        fontSize: 15,
                                                                        color: isDark ? '#94a3b8' : '#64748b',
                                                                        textAlign: 'center',
                                                                  }}>
                                                                        {chatSearch ? 'No transactions match this search' : 'No transactions yet'}
                                                                        {'\n'}
                                                                        <Text style={{ fontWeight: '500' }}>
                                                                              Clear search or add a new Udhaar/Payment below
                                                                        </Text>
                                                                  </Text>
                                                            </View>
                                                      }
                                                />

                                                {/* Input Bar */}
                                                <View style={{
                                                      paddingHorizontal: Math.max(16, screenWidth * 0.04),
                                                      paddingVertical: 16,
                                                      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                                                      borderTopWidth: 1,
                                                      borderTopColor: isDark ? '#475569' : '#e2e8f0',
                                                      flexDirection: 'row',
                                                      alignItems: 'flex-end',
                                                      gap: 12,
                                                }}>
                                                      <View style={{ flex: 0.3 }}>
                                                            <Picker
                                                                  selectedValue={txnType}
                                                                  onValueChange={setTxnType}
                                                                  style={{
                                                                        backgroundColor: isDark ? '#334155' : '#f1f5f9',
                                                                        borderRadius: 12,
                                                                        height: 44,
                                                                  }}
                                                                  itemStyle={{
                                                                        fontSize: Math.max(14, fontScale * 15),
                                                                        color: isDark ? '#f8fafc' : '#1e293b',
                                                                  }}
                                                            >
                                                                  <Picker.Item label="Credit Due" value="credit" />
                                                                  <Picker.Item label="Payment" value="payment" />
                                                            </Picker>
                                                      </View>

                                                      <TextInput
                                                            style={{
                                                                  flex: 0.25,
                                                                  height: 44,
                                                                  backgroundColor: isDark ? '#334155' : '#f1f5f9',
                                                                  borderRadius: 22,
                                                                  paddingHorizontal: 16,
                                                                  fontSize: Math.max(15, fontScale * 16),
                                                                  color: isDark ? '#f8fafc' : '#1e293b',
                                                            }}
                                                            placeholder="Amount"
                                                            value={txnAmount}
                                                            onChangeText={setTxnAmount}
                                                            keyboardType="numeric"
                                                      />

                                                      <TextInput
                                                            style={{
                                                                  flex: 1,
                                                                  height: 44,
                                                                  backgroundColor: isDark ? '#334155' : '#f1f5f9',
                                                                  borderRadius: 22,
                                                                  paddingHorizontal: 16,
                                                                  fontSize: Math.max(15, fontScale * 16),
                                                                  color: isDark ? '#f8fafc' : '#1e293b',
                                                            }}
                                                            placeholder="Note (optional)"
                                                            value={txnNote}
                                                            onChangeText={setTxnNote}
                                                      />

                                                      <TouchableOpacity
                                                            onPress={handleSaveTxn}
                                                            disabled={!selected || !txnAmount}
                                                            style={{
                                                                  backgroundColor: (!selected || !txnAmount) ? '#475569' : '#10b981',
                                                                  borderRadius: 22,
                                                                  paddingHorizontal: 24,
                                                                  paddingVertical: 12,
                                                                  minWidth: 70,
                                                                  alignItems: 'center',
                                                            }}
                                                      >
                                                            <Text style={{
                                                                  color: '#ffffff',
                                                                  fontSize: Math.max(15, fontScale * 16),
                                                                  fontWeight: '600',
                                                            }}>
                                                                  {editingIndex !== null ? 'Update' : 'Save'}
                                                            </Text>
                                                      </TouchableOpacity>
                                                </View>
                                          </>
                                    )}
                              </View>
                        )}
                  </View>

                  {/* Toast Container */}
                  <ToastContainer toasts={toasts} removeToast={removeToast} isDark={isDark} />
            </SafeAreaView>
      );
}
