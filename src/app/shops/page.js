'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';

const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;

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
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to add customer');
        return res.json();
    }
};

export default function OwnerDashboard() {
    const router = useRouter();
    const [customers, setCustomers] = useState([]);
    const [ownerProfile, setOwnerProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [isDark, setIsDark] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => setToast({ message, type });

    useEffect(() => {
        const load = async () => {
            try {
                const token = getToken();
                if (!token) { router.push('/'); return; }
                const [custs, ownerRes] = await Promise.all([API.listCustomers(), API.getOwner()]);
                setCustomers(Array.isArray(custs) ? custs : []);
                setOwnerProfile(ownerRes.owner);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        load();
    }, [router]);

    const handleAddCustomer = async (e) => {
        e.preventDefault();
        if (!newName || newPhone.length < 10) return showToast('Enter valid name and phone', 'error');
        try {
            const updated = await API.addCustomer(newName, newPhone);
            setCustomers(p => [updated, ...p]);
            setNewName(''); setNewPhone('');
            showToast('Customer added successfully');
        } catch (err) { showToast(err.message, 'error'); }
    };

    const filteredCustomers = useMemo(() => {
        return customers.filter(c => 
            (c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)) &&
            (filter === 'all' || (filter === 'due' ? c.currentDue > 0 : c.currentDue === 0))
        );
    }, [customers, search, filter]);

    if (loading) return <div className="h-screen flex items-center justify-center font-bold text-emerald-600">Loading InfraCredit...</div>;

    return (
        <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'} flex flex-col font-sans`}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* HEADER */}
            <header className="px-6 py-4 flex justify-between items-center sticky top-0 z-20 bg-inherit border-b border-slate-50">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" className="h-6 w-auto" alt="Logo" />
                    <span className="text-lg font-black tracking-tight text-emerald-700">InfraCredit</span>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/profile')} className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden ring-2 ring-emerald-500/20">
                        {ownerProfile?.avatarUrl ? <img src={ownerProfile.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-xs">{ownerProfile?.ownerName?.[0]}</div>}
                    </button>
                    <button onClick={() => setIsDark(!isDark)} className="text-xl">{isDark ? '☀️' : '🌙'}</button>
                </div>
            </header>

            {/* SEARCH & FILTERS */}
            <div className="px-6 py-4 space-y-4">
                <div className="bg-slate-50 rounded-2xl flex items-center px-4 py-3.5 border border-slate-100 shadow-sm">
                    <span className="opacity-40 mr-3">🔍</span>
                    <input 
                        placeholder="Search name/phone" 
                        className="bg-transparent border-none outline-none text-sm w-full font-medium"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'due', 'cleared'].map(f => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 py-2 rounded-full text-xs font-black capitalize border transition-all ${filter === f ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}
                        >
                            {f === 'due' ? 'Credit Due' : f}
                        </button>
                    ))}
                </div>
            </div>

            {/* ADD CUSTOMER FORM (MATCHING IMAGE) */}
            <div className="px-4 mb-6">
                <div className="bg-emerald-50/40 border border-emerald-100 rounded-[2rem] p-6">
                    <form onSubmit={handleAddCustomer} className="space-y-4">
                        <input 
                            placeholder="Name" 
                            className="w-full bg-white rounded-xl px-4 py-3.5 text-sm border border-emerald-100 outline-none focus:border-emerald-500 transition-all font-medium"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                        />
                        <input 
                            placeholder="Phone" 
                            className="w-full bg-white rounded-xl px-4 py-3.5 text-sm border border-emerald-100 outline-none focus:border-emerald-500 transition-all font-mono"
                            value={newPhone}
                            onChange={e => setNewPhone(e.target.value.replace(/\D/g,''))}
                        />
                        <button className="w-full bg-emerald-600 py-4 rounded-xl text-sm font-black text-white shadow-lg shadow-emerald-600/20 active:scale-95 transition-all">
                            + Add Customer
                        </button>
                    </form>
                </div>
            </div>

            {/* CUSTOMER LIST */}
            <div className="flex-1 overflow-y-auto px-2">
                {filteredCustomers.map(c => (
                    <div key={c.phone} onClick={() => router.push(`/khata/${c.phone}`)} className="flex items-center p-4 hover:bg-slate-50 rounded-3xl transition-colors cursor-pointer active:scale-98">
                        <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-inner relative overflow-hidden">
                            {c.avatarUrl ? <img src={c.avatarUrl} className="w-full h-full object-cover" /> : c.name[0].toUpperCase()}
                        </div>
                        <div className="ml-4 flex-1">
                            <p className="font-black text-slate-900 text-[15px]">{c.name}</p>
                            <p className="text-[11px] text-slate-400 font-bold">{c.phone}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <p className="font-black text-[15px] text-[#D35400]">₹{c.currentDue}</p>
                            <button className="text-slate-300 p-2">⋮</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* BOTTOM NAVIGATION */}
            <nav className="bg-white border-t border-slate-100 py-3 pb-6 flex justify-around items-center sticky bottom-0 z-20">
                <NavBtn icon="👥" label="Khatas" active />
                <NavBtn icon="📈" label="Analytics" />
                <NavBtn icon="🧮" label="Calculator" />
                <NavBtn icon="👤" label="Profile" />
            </nav>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                body { font-family: 'Inter', sans-serif; }
            `}</style>
        </div>
    );
}

function NavBtn({ icon, label, active }) {
    return (
        <button className={`flex flex-col items-center gap-1 transition-all ${active ? 'scale-110' : 'opacity-40 grayscale'}`}>
            <span className="text-2xl">{icon}</span>
            <span className={`text-[10px] font-black uppercase tracking-tighter ${active ? 'text-emerald-600' : 'text-slate-400'}`}>{label}</span>
        </button>
    );
}
