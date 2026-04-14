'use client';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import BranchSwitcher from './shared/BranchSwitcher';
import { NavItem, ALL_NAV_ITEMS } from '../nav-config';

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
    if (currentRoleSegment) checkAuth();
  }, [currentRoleSegment]);

  const { mainItems, shortcutItems } = useMemo(() => {
    const navRole = currentRoleSegment.toUpperCase() === 'STAFF' ? 'CASHIER' : currentRoleSegment.toUpperCase();
    
    // Filter items based on user role and panel context
    const allFiltered = ALL_NAV_ITEMS.filter(item => {
      const isAllowed = item.roles.includes(navRole) || 
                       (userRole === 'ADMIN' && (item.roles.includes('ADMIN') || item.roles.includes(navRole)));
      return isAllowed;
    });

    const mains: NavItem[] = [];
    const shortcuts: NavItem[] = [];

    allFiltered.forEach(item => {
      // SPECIAL EXCEPTION: For KITCHEN role, everything should be a main item (unless it's truly restricted)
      // but primarily we want Kitchen Display visible there.
      if (navRole === 'KITCHEN' || !item.isShortcut) {
        mains.push(item);
      } else {
        shortcuts.push(item);
      }
    });

    return { mainItems: mains, shortcutItems: shortcuts };
  }, [currentRoleSegment, userRole]);

  if (!mounted) return null;

  function isActive(href: string) {
    const fullHref = getFullHref(href);
    if (href === '') return pathname === fullHref;
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

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={getFullHref(item.href)}
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-300 group ${
          active 
            ? 'bg-primary-600 text-white shadow-md translate-x-1' 
            : 'text-white/40 hover:bg-white/5 hover:text-white'
        }`}
      >
        <svg 
          className={`w-3.5 h-3.5 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} />
        </svg>
        <span className="text-[11px] font-bold tracking-tight uppercase">{item.label}</span>
        {active && <div className="ml-auto w-1 h-1 rounded-full bg-white shadow-[0_0_6px_white]" />}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#1C0F08] text-white">
      {/* Logo Area (Compact) */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base bg-primary-600/20 text-primary-500 shadow-inner">☕</div>
        <div>
          <h1 className="text-xs font-black text-white tracking-tight leading-none uppercase">Odoo Cafe</h1>
          <p className="text-[8px] text-white/20 font-bold uppercase tracking-[0.2em] mt-1">Enterprise</p>
        </div>
      </div>

      <BranchSwitcher />

      {/* Ultra-Compact Navigation */}
      <div className="flex-1 px-2.5 py-4 space-y-4 overflow-hidden">
        {/* Main Section */}
        <div className="space-y-0.5">
          {mainItems.map((item) => <NavLink key={item.href} item={item} />)}
        </div>

        {/* Shortcuts Section */}
        {shortcutItems.length > 0 && (
          <div className="space-y-1">
            <div className="px-3 pb-1 flex items-center gap-2">
               <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] whitespace-nowrap">Shortcuts</span>
               <div className="h-[1px] w-full bg-white/5" />
            </div>
            <div className="space-y-0.5">
              {shortcutItems.map((item) => <NavLink key={item.href} item={item} />)}
            </div>
          </div>
        )}
      </div>

      {/* User Section (Refined) */}
      <div className="p-3 border-t border-white/5 bg-black/20">
        <div className="px-3 py-2.5 mb-2.5 bg-gradient-to-br from-white/10 to-transparent rounded-xl border border-white/10 shadow-inner group">
           <div className="flex items-center gap-2.5">
             <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center font-black text-xs shadow-lg uppercase ring-1 ring-white/10">
               {session?.username?.[0] || userRole?.[0] || 'U'}
             </div>
             <div className="flex-1 min-w-0">
               <div className="text-[11px] font-black text-white truncate tracking-tight uppercase leading-none">
                 {session?.username || 'Pratham Khawani'}
               </div>
               <div className="flex items-center gap-1.5 mt-1">
                 <div className="w-1 h-1 rounded-full bg-emerald-500" />
                 <span className="text-[8px] font-extrabold text-white/30 uppercase tracking-widest">{userRole || 'ADMIN'}</span>
               </div>
             </div>
           </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-red-500/60 hover:text-rose-400 rounded-lg transition-all font-black text-[9px] uppercase tracking-widest group"
        >
          <div className="w-6 h-6 rounded-md bg-rose-500/5 flex items-center justify-center transition-colors group-hover:bg-rose-500/10">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </div>
          Logout Session
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden fixed bottom-6 right-6 w-11 h-11 rounded-full bg-primary-600 text-white shadow-2xl z-[60] flex items-center justify-center transition-transform">{isOpen ? '✕' : '☰'}</button>
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 shadow-2xl z-50">{sidebarContent}</aside>
      <div className={`lg:hidden fixed inset-0 z-[55] transition-all duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsOpen(false)} />
        <aside className={`absolute top-0 bottom-0 left-0 w-[240px] transition-transform duration-500 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>{sidebarContent}</aside>
      </div>
    </>
  );
}
