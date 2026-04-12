'use client';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F3EF' }}>
      {/* Nav */}
      <nav className="bg-white border-b border-neutral-200 px-6 h-14 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
               style={{ background: 'rgba(124,92,62,0.12)', border: '1px solid rgba(124,92,62,0.25)' }}>
            ☕
          </div>
          <span className="font-bold text-neutral-800 text-sm tracking-wide">Cafe POS</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full ml-1"
                style={{ background: '#FAF5EF', color: '#7C5C3E', border: '1px solid #D4C9B8' }}>
            Enterprise
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-primary text-sm py-1.5 px-4">Sign In</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-4xl w-full text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6"
               style={{ background: '#FAF5EF', color: '#7C5C3E', border: '1px solid #D4C9B8' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            System Online · v1.0 Enterprise
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 leading-tight mb-4">
            Professional Point of Sale<br />
            <span style={{ color: '#7C5C3E' }}>Built for Cafes & Restaurants</span>
          </h1>

          <p className="text-lg text-neutral-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Manage your menu, tables, orders and payments from a single, streamlined dashboard. Fast, reliable, beautiful.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
            <Link href="/login" className="btn-primary px-6 py-2.5 text-sm font-semibold">
              Sign In to Dashboard
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {/* Feature Pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {[
              { icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', label: 'Menu Management' },
              { icon: 'M3 10h18M3 14h18M10 3v18M14 3v18', label: 'Table & Floors' },
              { icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', label: 'Payments (UPI/Cash)' },
              { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Reports & Analytics' },
            ].map(f => (
              <div key={f.label} className="bg-white border border-neutral-200 rounded-xl p-3 flex flex-col items-center gap-2"
                   style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: '#FAF5EF' }}>
                  <svg className="w-4 h-4" fill="none" stroke="#7C5C3E" strokeWidth={1.75} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </div>
                <span className="text-xs font-medium text-neutral-600 text-center leading-tight">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span>☕</span>
            <span>© 2026 Cafe POS Enterprise. All rights reserved.</span>
          </div>
          <div className="flex gap-4 text-xs text-neutral-400">
            <Link href="/login" className="hover:text-neutral-600 transition-colors">Portal Access</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
