'use client';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import BranchSwitcher from './shared/BranchSwitcher';
import { ALL_NAV_ITEMS } from '../nav-config';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const currentRoleSegment = params.role as string || 'admin';
  const rolePrefix = `/${currentRoleSegment}`;

  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    async function checkAuth() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'x-pos-role': currentRoleSegment }
        });
        if (res.ok) {
          const data = await res.json();
          setSession(data);
          setUserRole(data.role);
        } else {
          setUserRole(null);
        }
      } catch {
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (currentRoleSegment) {
        checkAuth();
    }
  }, [currentRoleSegment]);

  if (!mounted) return null;

  // Filter modules based on the 'navRole' we want to display (from URL)
  // and the actual userRole (permissions)
  const navRole = currentRoleSegment.toUpperCase() === 'STAFF' ? 'CASHIER' : currentRoleSegment.toUpperCase();
  
  const filteredNav = ALL_NAV_ITEMS
    .filter(item => {
      const hasPermission = !item.isShortcut && (
        item.roles.includes(navRole) || 
        (userRole === 'ADMIN' && item.roles.includes('ADMIN')) ||
        (userRole === 'ADMIN' && item.roles.includes(navRole))
      );
      return hasPermission;
    });

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    const fullHref = getFullHref(href);
    return pathname?.startsWith(fullHref);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const getFullHref = (href: string) => {
    if (href === '') return rolePrefix;
    if (href.startsWith('/branch-select')) return href;
    return `${rolePrefix}${href}`;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#1C0F08] text-white">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-primary-600/20 text-primary-500 shadow-inner">
          ☕
        </div>
        <div>
          <h1 className="text-sm font-black text-white tracking-tight leading-none">Odoo Cafe</h1>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">POS System</p>
        </div>
      </div>

      <BranchSwitcher />

      {/* Navigation Items */}
      <div className="flex-1 px-2.5 py-4 space-y-1">
        {filteredNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={getFullHref(item.href)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-300 group ${
                active 
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40 translate-x-1' 
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              <svg 
                className={`w-4 h-4 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} />
              </svg>
              <span className="text-xs font-bold tracking-wide">{item.label}</span>
              {active && <div className="ml-auto w-1 h-1 rounded-full bg-white shadow-[0_0_6px_white]" />}
            </Link>
          );
        })}
      </div>

      {/* User & Logout */}
      <div className="p-3 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-2.5 px-2.5 py-2.5 mb-2.5 bg-white/5 rounded-xl border border-white/5">
           <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center font-black text-xs shadow-inner uppercase">
             {session?.username?.[0] || userRole?.[0] || 'U'}
           </div>
           <div className="flex-1 min-w-0">
             <div className="text-[11px] font-black text-white truncate leading-none mb-1">
               {session?.username || 'User Profile'}
             </div>
             <div className="text-[9px] font-bold text-white/30 truncate uppercase tracking-tighter">
               {userRole || 'Loading...'}
             </div>
           </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-red-400 hover:bg-red-400/10 rounded-xl transition-all font-bold text-xs group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-6 right-6 w-12 h-12 rounded-full bg-primary-600 text-white shadow-2xl z-[60] flex items-center justify-center active:scale-90 transition-transform"
      >
        {isOpen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" /></svg>
        )}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 shadow-2xl z-50">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div className={`lg:hidden fixed inset-0 z-[55] transition-all duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsOpen(false)} />
        <aside className={`absolute top-0 bottom-0 left-0 w-[240px] transition-transform duration-500 shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {sidebarContent}
        </aside>
      </div>
    </>
  );
}
