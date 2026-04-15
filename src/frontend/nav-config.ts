export interface NavItem {
  href: string;
  label: string;
  desc?: string;
  icon: string;
  exact?: boolean;
  roles: string[];
  highlight?: boolean;
  isShortcut?: boolean;
}

export const ALL_NAV_ITEMS: NavItem[] = [
  // --- OPERATIONS ---
  {
    href: '',
    label: 'Dashboard',
    desc: 'Overview & statistics',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    exact: true,
    roles: ['ADMIN', 'CASHIER', 'KITCHEN'],
  },
  {
    href: '/pos/floor',
    label: 'Launch POS',
    desc: 'Open point-of-sale terminal',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    highlight: true,
    isShortcut: true,
    roles: ['ADMIN', 'CASHIER'],
  },
  {
    href: '/kitchen-display',
    label: 'Kitchen Display',
    desc: 'Real-time order queue',
    icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
    isShortcut: true,
    roles: ['ADMIN', 'KITCHEN', 'CASHIER'],
  },
  {
    href: '/reports',
    label: 'Reports',
    desc: 'Analytics & insights',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    isShortcut: true,
    roles: ['ADMIN'],
  },
  {
    href: '/orders',
    label: 'Orders',
    desc: 'Order history & status',
    icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    isShortcut: true,
    roles: ['ADMIN'],
  },

  // --- MANAGEMENT ---
  {
    href: '/sessions',
    label: 'POS Sessions',
    desc: 'Manage register sessions',
    icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2',
    roles: ['ADMIN', 'CASHIER'],
  },
  {
    href: '/payment-methods',
    label: 'Payments',
    desc: 'Cash, UPI, card methods',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3-3v8a3 3 0 003 3z',
    roles: ['ADMIN', 'CASHIER'],
  },

  // --- CONFIGURATION (Admin only) ---
  {
    href: '/branches',
    label: 'Branches',
    desc: 'Manage store locations',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    roles: ['ADMIN'],
  },
  {
    href: '/floors',
    label: 'Floors & Tables',
    desc: 'Configure dining areas',
    icon: 'M3 10h18M3 14h18M10 3v18M14 3v18',
    roles: ['ADMIN'],
  },
  {
    href: '/categories',
    label: 'Categories',
    desc: 'Manage menu categories',
    icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z',
    roles: ['ADMIN'],
  },
  {
    href: '/products',
    label: 'Products',
    desc: 'Add & edit menu items',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    roles: ['ADMIN'],
  },
  {
    href: '/qr-print',
    label: 'QR Codes',
    desc: 'Print table QR codes',
    icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z',
    roles: ['ADMIN'],
  },
  {
    href: '/staff',
    label: 'Staff',
    desc: 'Manage team members',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    roles: ['ADMIN'],
  },
];

export function getFilteredNav(role: string): NavItem[] {
  return ALL_NAV_ITEMS.filter(item => item.roles.includes(role));
}
