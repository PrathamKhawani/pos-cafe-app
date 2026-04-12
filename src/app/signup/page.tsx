'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', role: 'CASHIER' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { 
        toast.error(data.error || 'Registration failed'); 
        return; 
      }
      if (data.pendingApproval) {
        toast.success(data.message || 'Account created! Pending Admin approval.');
        
        // Emit Socket event to notify Admin
        const socket = (await import('socket.io-client')).io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
        socket.emit('STAFF_REGISTERED');
        setTimeout(() => { socket.disconnect(); router.push('/login'); }, 500);
      } else {
        toast.success('Account created successfully!');
        const roleMap: Record<string, string> = {
          'ADMIN': 'admin',
          'CASHIER': 'staff',
          'KITCHEN': 'kitchen'
        };
        router.push(`/${roleMap[form.role] || 'staff'}`);
      }
    } catch (err) {
      toast.error('Network failure');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center p-6 animate-fade-in relative overflow-hidden">
      <div className="absolute bottom-0 left-0 p-12 opacity-10 pointer-events-none transform -scale-x-100">
         <svg width="400" height="400" viewBox="0 0 24 24" fill="currentColor"><path d="M2.00004 12V3C2.00004 2.44772 2.44776 2 3.00004 2H21C21.5523 2 22 2.44772 22 3V12C22 14.7614 19.7615 17 17 17H16C16 19.2091 14.2092 21 12 21H8C5.7909 21 4.00004 19.2091 4.00004 17H3.00004C2.44776 17 2.00004 16.5523 2.00004 16V12ZM4.00004 12V15H17C18.6569 15 20 13.6569 20 12V4H4.00004V12ZM14 17H10C8.89543 17 8.00004 17.8954 8.00004 19C8.00004 20.1046 8.89543 21 10 21H14C15.1046 21 16 20.1046 16 19C16 17.8954 15.1046 17 14 17Z" /></svg>
      </div>

      <div className="w-full max-w-[440px] z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-sm mb-5 border border-primary-100">
            <span className="text-3xl text-primary-600">☕</span>
          </Link>
          <h1 className="text-3xl font-bold text-neutral-800 tracking-tight">Join Cafe POS</h1>
          <p className="text-sm text-neutral-500 mt-1 font-medium">Create a new staff account</p>
        </div>

        <div className="card p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Full Name</label>
                <input className="input" placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="col-span-1">
                <label className="label">Username</label>
                <input className="input" placeholder="johndoe" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
              </div>
              <div className="col-span-1">
                <label className="label">Email ID</label>
                <input className="input" type="email" placeholder="john@cafe.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-12" type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-neutral-400 hover:text-neutral-600 transition-colors">
                  {showPassword ? <span className="text-lg">👁️‍🗨️</span> : <span className="text-lg">👁️</span>}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Store Role</label>
              <select className="select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="CASHIER">Staff / Cashier</option>
                <option value="KITCHEN">Kitchen Staff / Display</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base mt-4">
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
            <p className="text-sm font-semibold text-neutral-500">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-600 hover:text-primary-700 hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
