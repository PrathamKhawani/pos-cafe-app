'use client';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
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

  // Derive role from URL segment as primary/instant source
  const roleFromUrl = currentRoleSegment === 'admin' ? 'ADMIN' : 
                     currentRoleSegment === 'staff' ? 'CASHIER' : 
                     currentRoleSegment === 'kitchen' ? 'KITCHEN' : null;
  
  const effectiveRole = userRole || roleFromUrl;

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.role) setUserRole(data.role);
        }
      } catch (err) {
        console.error('Failed to fetch user profile', err);
      }
    }
    fetchUser();
  }, []);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const getFullHref = (href: string) => {
    if (href === '') return rolePrefix;
    if (href.startsWith('/pos') || href.startsWith('/reports') || href.startsWith('/branch-select')) {
      return href;
    }
    return `${rolePrefix}${href}`;
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ background: 'rgba(201,168,125,0.2)' }}>☕</div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">Cafe POS</h1>
            <p className="text-[10px] text-white/40 font-medium">Enterprise</p>
          </div>
        </div>
        {/* Close button - mobile only */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <BranchSwitcher />

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5 no-scrollbar">
        {effectiveRole && ALL_NAV_ITEMS
          .filter(item => !item.isShortcut && item.roles.includes(effectiveRole))
          .map(item => {
            const fullHref = getFullHref(item.href);
            return (
              <Link
                key={item.href}
                href={fullHref}
                onClick={() => setIsOpen(false)}
                className={`sidebar-link ${isActive(fullHref, item.exact) ? 'active' : ''}`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

        {effectiveRole && ALL_NAV_ITEMS.filter(item => item.isShortcut && item.roles.includes(effectiveRole)).length > 0 && (
          <>
            <div className="h-px bg-white/10 my-3" />
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider px-3 mb-2">Shortcuts</p>
            {ALL_NAV_ITEMS
              .filter(item => item.isShortcut && item.roles.includes(effectiveRole))
              .map(item => {
                const fullHref = getFullHref(item.href);
                return (
                  <Link
                    key={item.href}
                    href={fullHref}
                    onClick={() => setIsOpen(false)}
                    className={`sidebar-link ${isActive(fullHref) ? 'active' : ''}`}
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-white/10">
        <button onClick={handleLogout} className="sidebar-link w-full text-red-300/70 hover:text-red-300 hover:bg-red-500/10">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#1C0F08] px-4 py-2.5 flex items-center justify-between">
        <button
          onClick={() => setIsOpen(true)}
          className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/70"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">Cafe POS</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0 z-50 w-56 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`} style={{ background: '#1C0F08' }}>
        {sidebarContent}
      </aside>
    </>
  );
}
