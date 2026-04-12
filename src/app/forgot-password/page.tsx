'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: '', otp: '', newPassword: '', confirmP: '' });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch { toast.error('Network error'); }
    finally { setLoading(false); }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirmP) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp: form.otp, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success('Password reset successfully!');
      router.push('/login');
    } catch { toast.error('Network error'); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-xl shadow-sm mb-4 border border-neutral-200">
            <span className="text-2xl">☕</span>
          </Link>
          <h1 className="text-2xl font-bold text-neutral-800 tracking-tight">Recover Password</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {step === 1 ? 'Enter your registered email address' : step === 2 ? 'Check your email for the OTP' : 'Set a new secure password'}
          </p>
        </div>

        <div className="card p-6 md:p-8">
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-5 animate-slide-up">
              <div>
                <label className="label">Email Address</label>
                <input className="input" type="email" placeholder="admin@cafe.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Sending OTP...' : 'Send Recovery Code'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-5 animate-slide-up">
              <div>
                <label className="label text-center block mb-2">6-Digit Verification Code</label>
                <input className="input text-center text-2xl tracking-[0.5em] font-mono py-4" maxLength={6} placeholder="000000" value={form.otp} onChange={e => setForm({ ...form, otp: e.target.value })} required />
              </div>
              <button type="submit" className="btn-primary w-full py-3">Verify Code</button>
              <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-primary-600 font-semibold hover:text-primary-700">Incorrect Email?</button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5 animate-slide-up">
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input className="input pr-12" type={showNewPassword ? "text" : "password"} placeholder="••••••••" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} required />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-neutral-400 hover:text-neutral-600">
                    {showNewPassword ? <span className="text-lg">👁️‍🗨️</span> : <span className="text-lg">👁️</span>}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <div className="relative">
                  <input className="input pr-12" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={form.confirmP} onChange={e => setForm({ ...form, confirmP: e.target.value })} required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-neutral-400 hover:text-neutral-600">
                    {showConfirmPassword ? <span className="text-lg">👁️‍🗨️</span> : <span className="text-lg">👁️</span>}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Processing...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-neutral-100 text-center">
            <Link href="/login" className="text-sm font-semibold text-neutral-500 hover:text-primary-600">
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
