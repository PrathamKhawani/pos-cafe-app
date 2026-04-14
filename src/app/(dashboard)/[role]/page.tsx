'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { NavItem, ALL_NAV_ITEMS } from '@/frontend/nav-config';

export default function BackendPage() {
  const params = useParams();
  const router = useRouter();
  const roleSegment = params.role as string;
  
  const roleFromUrl = roleSegment === 'admin' ? 'ADMIN' : 
                    roleSegment === 'staff' ? 'CASHIER' : 
                    roleSegment === 'kitchen' ? 'KITCHEN' : '';

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [stats, setStats] = useState({ orders: 0, revenue: 0, products: 0, tables: 0 });
  const [pendingStaff, setPendingStaff] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect kitchen role immediately to kitchen display - REMOVED to allow Dashboard access
  /*
  useEffect(() => {
    if (roleSegment === 'kitchen') {
      router.replace(`/${roleSegment}/kitchen-display`);
    }
  }, [roleSegment, router]);
  */

  useEffect(() => {
    async function load() {
      try {
        // 1. Fetch user session to get the REAL role
        const meRes = await fetch('/api/auth/me', {
          cache: 'no-store',
          headers: {
            'x-pos-role': roleSegment
          }
        });
        const meData = meRes.ok ? await meRes.json() : null;
        setSessionUser(meData);

        // Read the selected branch from cookie for branch-aware stats
        const branchId = document.cookie
          .split('; ')
          .find(row => row.startsWith('branch-id='))
          ?.split('=')[1] || 'all';

        const [reportRes, productsRes, tablesRes, staffRes] = await Promise.all([
          fetch(`/api/reports?period=today&branchId=${branchId}`),
          fetch('/api/products'),
          fetch('/api/tables'),
          fetch('/api/staff'),
        ]);
        const report   = reportRes.ok   ? await reportRes.json()   : {};
        const products = productsRes.ok ? await productsRes.json() : [];
        const tables   = tablesRes.ok   ? await tablesRes.json()   : [];
        const staff    = staffRes.ok    ? await staffRes.json()    : [];
        
        setStats({
          orders:   (report || {}).totalOrders  || 0,
          revenue:  (report || {}).totalRevenue || 0,
          products: Array.isArray(products) ? products.length : 0,
          tables:   Array.isArray(tables)   ? tables.length   : 0,
        });

        if (Array.isArray(staff)) {
          setPendingStaff(staff.filter((s: any) => !s.isApproved).length);
        }
      } catch (err) {
        console.error('DASHBOARD_LOAD_ERROR:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // If user is ADMIN, they can "impersonate" another role's dashboard by visiting its URL
  const effectiveRole = sessionUser?.role === 'ADMIN' ? roleFromUrl : (sessionUser?.role || '');

  // Strict Redirect: If not loading to prevent flickering
  useEffect(() => {
    if (!isLoading && !sessionUser) {
      router.replace('/login');
    } else if (!isLoading && sessionUser && sessionUser.role !== 'ADMIN' && sessionUser.role !== roleFromUrl) {
      // User is on the WRONG dashboard for their role. Redirect them to their own.
      const correctPath = sessionUser.role === 'CASHIER' ? 'staff' : sessionUser.role.toLowerCase();
      router.replace(`/${correctPath}`);
    }
  }, [isLoading, sessionUser, roleFromUrl, router]);
  
  // STAT CARDS - Filtered for privacy
  const statCards = [
    { label: "Today's Orders",  value: stats.orders,                    sub: 'transactions',       color: '#2563EB', bg: '#EFF4FF', icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    // Only ADMIN sees revenue
    ...(effectiveRole === 'ADMIN' ? [{ label: "Today's Revenue", value: `₹${stats.revenue.toFixed(0)}`, sub: 'rupees earned',       color: '#2D7A4F', bg: '#EBF7F1', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }] : []),
    // Only ADMIN sees products and tables stats
    ...(effectiveRole === 'ADMIN' ? [
      { label: 'Active Products', value: stats.products,                  sub: 'menu items',         color: '#7C5C3E', bg: '#FAF5EF', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
      { label: 'Tables',          value: stats.tables,                    sub: 'configured seating', color: '#C8883A', bg: '#FEF6E4', icon: 'M3 10h18M3 14h18M10 3v18M14 3v18' },
    ] : []),
  ];

  // QUICK LINKS - Filtered securely by session role
  const quickLinks = ALL_NAV_ITEMS
    .filter(item => item.roles.includes(effectiveRole) && item.href !== '') 
    .map(item => {
      let fullHref = item.href;
      // Only /branch-select is actually mounted at the root directory
      if (!item.href.startsWith('/branch-select')) {
        fullHref = `/${roleSegment}${item.href}`;
      }
      return { ...item, href: fullHref };
    });

  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
      setDateStr(now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !effectiveRole) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-neutral-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
          <span className="text-xs font-medium text-neutral-600">Live · {timeStr}</span>
        </div>
      </div>

      {/* Pending Staff Banner */}
      {pendingStaff > 0 && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-orange-900">Pending Staff Approvals</h3>
              <p className="text-xs text-orange-700 mt-0.5">There {pendingStaff === 1 ? 'is' : 'are'} {pendingStaff} staff {pendingStaff === 1 ? 'member' : 'members'} waiting for admin approval.</p>
            </div>
          </div>
          <Link href={`/${roleSegment}/staff`} className="px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 transition shadow-sm whitespace-nowrap">
            Review Staff
          </Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                   style={{ background: card.bg }}>
                <svg className="w-4 h-4" fill="none" stroke={card.color} strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                </svg>
              </div>
              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md"
                    style={{ background: card.bg, color: card.color }}>
                Today
              </span>
            </div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Quick Access</span>
        <div className="flex-1 h-px bg-neutral-200" />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`quick-card ${link.highlight ? 'border-caramel-500 bg-primary-50' : ''}`}
            style={link.highlight ? { borderColor: '#C8883A', background: '#FAF5EF' } : {}}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                 style={{ background: link.highlight ? 'rgba(200,136,58,0.15)' : '#F5F3EF' }}>
              <svg className="w-4 h-4" fill="none"
                   stroke={link.highlight ? '#C8883A' : '#7A6A58'}
                   strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-neutral-800 leading-tight"
                   style={link.highlight ? { color: '#7C5C3E' } : {}}>
                {link.label}
              </div>
              <div className="text-xs text-neutral-400 mt-0.5 leading-snug">{link.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer status */}
      <div className="flex items-center gap-2 text-xs text-neutral-400 pt-4 border-t border-neutral-200">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
        <span>All systems operational · Cafe POS v1.0 Enterprise</span>
      </div>
    </div>
  );
}
