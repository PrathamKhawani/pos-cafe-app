'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Login failed'); return; }
      toast.success('Access Granted');
      router.push('/branch-select');
    } catch {
      toast.error('Network error. Check connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center p-6 animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
         <svg width="400" height="400" viewBox="0 0 24 24" fill="currentColor"><path d="M2.00004 12V3C2.00004 2.44772 2.44776 2 3.00004 2H21C21.5523 2 22 2.44772 22 3V12C22 14.7614 19.7615 17 17 17H16C16 19.2091 14.2092 21 12 21H8C5.7909 21 4.00004 19.2091 4.00004 17H3.00004C2.44776 17 2.00004 16.5523 2.00004 16V12ZM4.00004 12V15H17C18.6569 15 20 13.6569 20 12V4H4.00004V12ZM14 17H10C8.89543 17 8.00004 17.8954 8.00004 19C8.00004 20.1046 8.89543 21 10 21H14C15.1046 21 16 20.1046 16 19C16 17.8954 15.1046 17 14 17Z" /></svg>
      </div>

      <div className="w-full max-w-[400px] z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-sm mb-5 border border-primary-100">
            <span className="text-3xl text-primary-600">☕</span>
          </Link>
          <h1 className="text-3xl font-bold text-neutral-800 tracking-tight">Cafe POS</h1>
          <p className="text-sm text-neutral-500 mt-1 uppercase tracking-wider font-semibold">Staff & Admin Portal</p>
        </div>

        <div className="card p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email or Username</label>
              <input
                className="input"
                placeholder="admin@cafe.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label !mb-0">Password</label>
                <Link href="/forgot-password" className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline">Forgot?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input pr-12"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {showPassword ? <span className="text-lg">👁️‍🗨️</span> : <span className="text-lg">👁️</span>}
                </button>
              </div>
            </div>
            
            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base mt-2">
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
            <p className="text-sm font-semibold text-neutral-500">
              New employee?{' '}
              <Link href="/signup" className="text-primary-600 hover:text-primary-700 hover:underline">Register Account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
