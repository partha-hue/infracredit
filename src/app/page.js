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
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-between p-8 pt-safe pb-safe">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        <div className="w-24 h-24 bg-emerald-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-8 animate-pulse-slow">
          <img src="/logo.png" alt="Logo" className="w-14 h-14 object-contain" />
        </div>
        <h1 className="text-4xl font-black mb-2 tracking-tighter">InfraCredit</h1>
        <p className="text-slate-400 text-sm mb-12 text-center font-medium leading-relaxed">
          Manage your business khata <br/> with professional digital ledgers
        </p>

        <div className="w-full space-y-4">
          <button 
            onClick={() => { setUserRole('owner'); setAuthType('login'); setAuthModalOpen(true); }}
            className="ripple w-full bg-emerald-600 py-5 rounded-[1.5rem] text-sm font-black shadow-xl active:scale-95 transition-all uppercase tracking-widest"
          >
            Shop Owner
          </button>
          <button 
            onClick={() => { setUserRole('customer'); setAuthType('login'); setAuthModalOpen(true); }}
            className="ripple w-full bg-slate-900 py-5 rounded-[1.5rem] text-sm font-black border border-slate-800 active:scale-95 transition-all uppercase tracking-widest"
          >
            Customer Login
          </button>
        </div>
      </div>

      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] mt-8">
        Designed for India • 2024
      </p>

      {authModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-slate-900 border-t border-slate-800 sm:border sm:rounded-[2.5rem] rounded-t-[2.5rem] w-full max-w-md relative shadow-2xl animate-in slide-in-from-bottom duration-500">
            {/* Handle for Bottom Sheet on mobile */}
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mt-4 sm:hidden"></div>
            
            <div className="p-8 pb-10">
              <div className="flex flex-col items-start mb-8">
                  <h2 className="text-2xl font-black capitalize tracking-tight">{userRole} {authType}</h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">Please enter your credentials to continue</p>
              </div>
              
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {userRole === 'owner' ? (
                  <>
                    {authType === 'signup' && (
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="Shop Name" className="w-full p-4 bg-slate-950 rounded-2xl outline-none border border-slate-800 focus:border-emerald-500 text-sm font-medium transition-all" onChange={e => setForm({...form, shopName: e.target.value})} required />
                        <input placeholder="Owner Name" className="w-full p-4 bg-slate-950 rounded-2xl outline-none border border-slate-800 focus:border-emerald-500 text-sm font-medium transition-all" onChange={e => setForm({...form, ownerName: e.target.value})} required />
                      </div>
                    )}
                    <input type="email" placeholder="Email Address" className="w-full p-4 bg-slate-950 rounded-2xl outline-none border border-slate-800 focus:border-emerald-500 text-sm font-medium transition-all" onChange={e => setForm({...form, email: e.target.value})} required />
                  </>
                ) : (
                  <input placeholder="Registered Phone Number" className="w-full p-4 bg-slate-950 rounded-2xl outline-none border border-slate-800 focus:border-emerald-500 text-sm font-mono transition-all" onChange={e => setForm({...form, phone: e.target.value})} required />
                )}
                
                <input type="password" placeholder="Password" className="w-full p-4 bg-slate-950 rounded-2xl outline-none border border-slate-800 focus:border-emerald-500 text-sm font-medium transition-all" onChange={e => setForm({...form, password: e.target.value})} required />

                <button className="ripple w-full bg-emerald-600 py-5 rounded-2xl font-black text-sm text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50 active:scale-95 transition-all uppercase tracking-widest mt-4" disabled={loading}>
                  {loading ? 'Processing...' : (authType === 'login' ? 'Continue' : 'Create Account')}
                </button>
              </form>

              <button 
                onClick={() => setAuthType(authType === 'login' ? 'signup' : 'login')}
                className="w-full mt-8 text-[11px] text-slate-500 font-black uppercase tracking-widest hover:text-emerald-400 transition-colors"
              >
                {userRole === 'owner' 
                  ? (authType === 'login' ? "New Shop? Register" : "Have an account? Login")
                  : (authType === 'login' ? "First time? Set Password" : "Back to Login")
                }
              </button>
            </div>

            <button onClick={() => setAuthModalOpen(false)} className="absolute top-6 right-6 text-slate-500 w-8 h-8 flex items-center justify-center bg-slate-800 rounded-full hover:text-white transition-colors">✕</button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s infinite ease-in-out;
        }
      `}</style>
    </main>
  );
}
