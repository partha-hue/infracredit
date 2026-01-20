'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userRole, setUserRole] = useState('owner'); // 'owner' or 'customer'
  const [authType, setAuthType] = useState('login'); // 'login' or 'signup'
  const [form, setForm] = useState({ email: '', phone: '', password: '', shopName: '', ownerName: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token) {
      if (role === 'owner') router.push('/shops');
      else if (role === 'customer') router.push('/customer/dashboard');
    }
  }, [router]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Determine endpoint
    let endpoint = '';
    let payload = { ...form };

    if (userRole === 'owner') {
      endpoint = authType === 'login' ? '/api/auth/login' : '/api/auth/register';
    } else {
      endpoint = '/api/auth/customer-login';
      // For customer, if they are clicking "Register", we pass isRegistering: true
      if (authType === 'signup') {
        payload.isRegistering = true;
      }
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', userRole);
        router.push(userRole === 'owner' ? '/shops' : '/customer/dashboard');
      } else {
        alert(data.message || 'Success! You can now login.');
        setAuthType('login');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <img src="/logo.png" alt="Logo" className="h-20 mb-4 object-contain" />
      <h1 className="text-2xl font-black mb-2">InfraCredit</h1>
      <p className="text-slate-400 text-sm mb-10 text-center">Secure Digital Khata for Owners & Customers</p>

      <div className="w-full max-w-sm space-y-4">
        <button 
          onClick={() => { setUserRole('owner'); setAuthType('login'); setAuthModalOpen(true); }}
          className="w-full bg-emerald-600 py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all"
        >
          Shop Owner Login
        </button>
        <button 
          onClick={() => { setUserRole('customer'); setAuthType('login'); setAuthModalOpen(true); }}
          className="w-full bg-slate-800 py-4 rounded-2xl font-black border border-slate-700 active:scale-95 transition-all"
        >
          Customer Login
        </button>
      </div>

      {authModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] w-full max-w-sm relative shadow-2xl">
            <div className="flex flex-col items-center mb-6">
                <img src="/logo.png" className="h-10 mb-2" alt="Logo" />
                <h2 className="text-xl font-black capitalize tracking-tight">{userRole} {authType}</h2>
            </div>
            
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {userRole === 'owner' ? (
                <>
                  {authType === 'signup' && (
                    <>
                      <input placeholder="Shop Name" className="w-full p-4 bg-slate-950 rounded-xl outline-none border border-slate-800 focus:border-emerald-500 text-sm" onChange={e => setForm({...form, shopName: e.target.value})} required />
                      <input placeholder="Owner Name" className="w-full p-4 bg-slate-950 rounded-xl outline-none border border-slate-800 focus:border-emerald-500 text-sm" onChange={e => setForm({...form, ownerName: e.target.value})} required />
                    </>
                  )}
                  <input type="email" placeholder="Email Address" className="w-full p-4 bg-slate-950 rounded-xl outline-none border border-slate-800 focus:border-emerald-500 text-sm" onChange={e => setForm({...form, email: e.target.value})} required />
                </>
              ) : (
                <input placeholder="Registered Phone Number" className="w-full p-4 bg-slate-950 rounded-xl outline-none border border-slate-800 focus:border-emerald-500 text-sm font-mono" onChange={e => setForm({...form, phone: e.target.value})} required />
              )}
              
              <input type="password" placeholder="Password" className="w-full p-4 bg-slate-950 rounded-xl outline-none border border-slate-800 focus:border-emerald-500 text-sm" onChange={e => setForm({...form, password: e.target.value})} required />

              <button className="w-full bg-emerald-600 py-4 rounded-2xl font-black text-white shadow-lg disabled:opacity-50 active:scale-95 transition-all" disabled={loading}>
                {loading ? 'Processing...' : (authType === 'login' ? 'Login Now' : 'Set Password')}
              </button>
            </form>

            <button 
              onClick={() => setAuthType(authType === 'login' ? 'signup' : 'login')}
              className="w-full mt-6 text-xs text-slate-500 font-bold hover:text-emerald-400"
            >
              {userRole === 'owner' 
                ? (authType === 'login' ? "New Shop Owner? Create Account" : "Back to Login")
                : (authType === 'login' ? "First time? Set your Password" : "Already set password? Login")
              }
            </button>

            <button onClick={() => setAuthModalOpen(false)} className="absolute top-4 right-4 text-slate-500 text-xl hover:text-white">✕</button>
          </div>
        </div>
      )}
    </main>
  );
}
