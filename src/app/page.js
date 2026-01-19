'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function Home() {
  const router = useRouter();
  const pdfRef = useRef(null);

  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authType, setAuthType] = useState('login');
  const [authForm, setAuthForm] = useState({
    shopName: '',
    ownerName: '',
    email: '',
    password: '',
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  };

  useEffect(() => {
    const init = async () => {
      const token = getToken();
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      try {
        const res = await fetch('/api/reports/monthly-summary', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setLedger(await res.json());
        } else {
          setLedger([]);
        }
      } catch {
        setLedger([]);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setIsAuthenticated(false);
    setLedger([]);
    setAuthModalOpen(false);
    router.push('/');
  };

  const generatePDF = async () => {
    const token = getToken();
    if (!token) {
      alert('Login required');
      setAuthType('login');
      setAuthModalOpen(true);
      return;
    }

    if (!pdfRef.current) return;

    const canvas = await html2canvas(pdfRef.current, { scale: 2 });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const img = canvas.toDataURL('image/png');

    const width = 210;
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(img, 'PNG', 0, 0, width, height);
    pdf.save('InfraCredit_Report.pdf');
  };

  const generateGST = async () => {
    const token = getToken();
    if (!token) {
      alert('Login required');
      setAuthType('login');
      setAuthModalOpen(true);
      return;
    }

    const res = await fetch('/api/invoice/gst', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        customer: 'Demo Customer',
        amount: 1200,
      }),
    });

    if (!res.ok) {
      alert('GST generation failed');
      return;
    }

    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gst-invoice.pdf';
    a.click();
  };

  const handleAuthChange = (e) => {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();

    const url =
      authType === 'login' ? '/api/auth/login' : '/api/auth/register';

    const payload =
      authType === 'login'
        ? { email: authForm.email, password: authForm.password }
        : authForm;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Auth failed');
      return;
    }

    if (data.token) {
      localStorage.setItem('token', data.token);
      setIsAuthenticated(true);
      setAuthModalOpen(false);
      try {
        const reportRes = await fetch('/api/reports/monthly-summary', {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        if (reportRes.ok) {
          setLedger(await reportRes.json());
        }
      } catch {
        // ignore
      }
    } else {
      alert('Signup successful. Please login now.');
      setAuthType('login');
    }
  };

  const handleGoogleLogin = () => {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      redirect_uri: '/api/auth/google/callback',
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });

    window.location.href =
      'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
  };


  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* HERO */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-center md:text-left space-y-4">
            <img src="/logo.png" alt="InfraCredit Logo" className="h-16 mx-auto md:mx-0 object-contain" />
            <p className="text-slate-400">
              Digital Khata with GST &amp; Analytics
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center md:justify-end">
            <button
              onClick={() => {
                const token = getToken();
                if (!token) {
                  setAuthType('login');
                  setAuthModalOpen(true);
                  return;
                }
                router.push('/shops');
              }}
              className="px-6 py-3 bg-emerald-500 text-black font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              {isAuthenticated ? 'Open Dashboard' : 'Get Started'}
            </button>

            {!isAuthenticated && (
              <>
                <button
                  onClick={() => {
                    setAuthType('login');
                    setAuthModalOpen(true);
                  }}
                  className="px-6 py-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Login
                </button>
              </>
            )}

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-rose-600/20 text-rose-500 border border-rose-500/30 rounded-xl font-bold"
              >
                Logout
              </button>
            )}
          </div>
        </section>

        {/* CHART */}
        {isAuthenticated && !loading && ledger.length > 0 && (
          <section ref={pdfRef} className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl">
            <h3 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-widest">Business Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ledger}>
                <XAxis dataKey="month" stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="credit" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                <Bar dataKey="payment" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        )}

        {/* QUICK ACTIONS */}
        <section className="grid md:grid-cols-3 gap-4">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
             <h4 className="font-bold mb-2">WhatsApp Alerts</h4>
             <p className="text-xs text-slate-500 mb-4">Send payment reminders to your customers instantly.</p>
             <button className="w-full bg-emerald-500/10 text-emerald-500 py-3 rounded-xl font-bold text-sm">📲 Try Now</button>
          </div>
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
             <h4 className="font-bold mb-2">PDF Statements</h4>
             <p className="text-xs text-slate-500 mb-4">Generate professional ledger reports in seconds.</p>
             <button onClick={generatePDF} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold text-sm">📄 View Sample</button>
          </div>
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
             <h4 className="font-bold mb-2">GST Billing</h4>
             <p className="text-xs text-slate-500 mb-4">Create tax-compliant invoices for your business.</p>
             <button onClick={generateGST} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm">🧾 Generate GST</button>
          </div>
        </section>
      </div>

      {/* AUTH MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-sm relative shadow-2xl">
            <div className="flex flex-col items-center mb-8">
                <img src="/logo.png" alt="Logo" className="h-10 mb-2" />
                <h2 className="text-xl font-black capitalize tracking-tight">{authType} to Account</h2>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authType === 'signup' && (
                <>
                  <input
                    name="shopName"
                    placeholder="Shop Name"
                    onChange={handleAuthChange}
                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                  <input
                    name="ownerName"
                    placeholder="Owner Name"
                    onChange={handleAuthChange}
                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </>
              )}
              <input
                name="email"
                type="email"
                placeholder="Email Address"
                onChange={handleAuthChange}
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
              <input
                name="password"
                type="password"
                placeholder="Password"
                onChange={handleAuthChange}
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />

              <button className="w-full bg-emerald-500 py-4 rounded-xl font-black text-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                {authType === 'login' ? 'Login Now' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-3">
                <button
                onClick={handleGoogleLogin}
                className="w-full bg-white text-black py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                >
                Continue with Google
                </button>
                <button 
                   onClick={() => setAuthType(authType === 'login' ? 'signup' : 'login')}
                   className="text-xs text-slate-500 hover:text-emerald-400 transition-colors"
                >
                   {authType === 'login' ? "Don't have an account? Sign up" : "Already have an account? Login"}
                </button>
            </div>

            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
