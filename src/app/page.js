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
      redirect_uri: '/auth/google/callback',
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
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-4xl font-bold">InfraCredit</h1>
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
              className="px-6 py-3 bg-emerald-500 rounded-lg"
            >
              {isAuthenticated ? 'Open Dashboard' : 'Dashboard'}
            </button>

            {!isAuthenticated && (
              <>
                <button
                  onClick={() => {
                    setAuthType('login');
                    setAuthModalOpen(true);
                  }}
                  className="px-6 py-3 bg-slate-800 rounded-lg"
                >
                  Owner Login
                </button>
                <button
                  onClick={() => {
                    setAuthType('signup');
                    setAuthModalOpen(true);
                  }}
                  className="px-6 py-3 bg-emerald-600 rounded-lg"
                >
                  Owner Signup
                </button>
              </>
            )}

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-red-600 rounded-lg"
              >
                Logout
              </button>
            )}
          </div>
        </section>

        {/* CHART – visible only when authenticated and data available */}
        {isAuthenticated && !loading && ledger.length > 0 && (
          <section ref={pdfRef} className="bg-slate-900 rounded-xl p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ledger}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="credit" fill="#f59e0b" />
                <Bar dataKey="payment" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </section>
        )}

        {/* ACTIONS */}
        <section className="bg-slate-900 p-6 rounded-xl grid md:grid-cols-3 gap-4">
          <button className="bg-emerald-500 py-3 rounded-lg">
            📲 WhatsApp
          </button>
          <button
            onClick={generatePDF}
            className="bg-slate-800 py-3 rounded-lg"
          >
            📄 PDF
          </button>
          <button
            onClick={generateGST}
            className="bg-emerald-600 py-3 rounded-lg"
          >
            GST Invoice
          </button>
        </section>
      </div>

      {/* AUTH MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-xl w-80 relative">
            <h2 className="text-xl font-bold mb-4 capitalize">{authType}</h2>

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {authType === 'signup' && (
                <>
                  <input
                    name="shopName"
                    placeholder="Shop Name"
                    onChange={handleAuthChange}
                    className="w-full p-2 bg-slate-800 rounded"
                    required
                  />
                  <input
                    name="ownerName"
                    placeholder="Owner Name"
                    onChange={handleAuthChange}
                    className="w-full p-2 bg-slate-800 rounded"
                    required
                  />
                </>
              )}
              <input
                name="email"
                type="email"
                placeholder="Email"
                onChange={handleAuthChange}
                className="w-full p-2 bg-slate-800 rounded"
                required
              />
              <input
                name="password"
                type="password"
                placeholder="Password"
                onChange={handleAuthChange}
                className="w-full p-2 bg-slate-800 rounded"
                required
              />

              <button className="w-full bg-emerald-500 py-2 rounded font-semibold">
                {authType === 'login' ? 'Login' : 'Signup'}
              </button>
            </form>

            <button
              onClick={handleGoogleLogin}
              className="w-full mt-3 bg-blue-600 py-2 rounded"
            >
              Continue with Google
            </button>

            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-3 right-3"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
