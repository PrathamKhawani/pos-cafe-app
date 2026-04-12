'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function POSLayout({ children }: { children: React.ReactNode }) {
  const [branch, setBranch] = useState<{ name: string } | null>(null);
  const router = useRouter();

  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const branchId = document.cookie.split('; ').find(row => row.startsWith('branch-id'))?.split('=')[1];
      
      const [branchRes, meRes] = await Promise.all([
        fetch('/api/branches', { cache: 'no-store' }),
        fetch('/api/auth/me', { cache: 'no-store' })
      ]);

      if (branchRes.ok) {
        const branches = await branchRes.ok ? await branchRes.json() : [];
        if (branchId) setBranch(branches.find((b: any) => b.id === branchId));
      }

      if (meRes.ok) {
        const user = await meRes.json();
        setUserRole(user.role);
      }
    }
    loadData();
  }, []);

  const rolePrefix = userRole === 'CASHIER' ? '/staff' : userRole === 'KITCHEN' ? '/kitchen' : '/admin';

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Signed out');
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] flex flex-col font-sans">
      {/* Light POS Header */}
      <header className="bg-white border-b border-neutral-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Link href={rolePrefix} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                 style={{ background: 'rgba(124,92,62,0.1)', border: '1px solid rgba(124,92,62,0.2)' }}>
              ☕
            </div>
            <div>
              <div className="text-sm font-bold text-neutral-800 leading-none mb-1">Cafe POS</div>
              {branch && <div className="text-2xs font-semibold text-primary-600 uppercase tracking-wider">{branch.name}</div>}
            </div>
          </Link>
          <nav className="flex items-center gap-1 p-1 bg-neutral-50 rounded-lg border border-neutral-200">
            <Link href="/pos/floor" className="px-3 py-1.5 rounded-md text-xs font-semibold text-neutral-700 hover:bg-white hover:shadow-sm transition-all flex items-center gap-1.5">
              <span>🪑</span> Floor View
            </Link>
            <Link href={`${rolePrefix}/kitchen-display`} target="_blank" className="px-3 py-1.5 rounded-md text-xs font-semibold text-neutral-700 hover:bg-white hover:shadow-sm transition-all flex items-center gap-1.5">
              <span>👨‍🍳</span> Kitchen
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/branch-select" className="btn-secondary text-xs px-3 py-1.5 h-8">
            Switch Location
          </Link>
          <div className="w-px h-6 bg-neutral-200 mx-1" />
          <button onClick={() => window.location.reload()} className="p-1.5 text-neutral-400 hover:text-neutral-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
          <div className="w-px h-6 bg-neutral-200 mx-1" />
          <button onClick={handleLogout} className="text-xs font-semibold text-danger hover:underline">
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
