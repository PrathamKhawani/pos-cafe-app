'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelfOrder, SelfOrderProvider } from './context';

export default function SelfOrderLayoutWrapper({
  children, params
}: {
  children: React.ReactNode; params: { token: string };
}) {
  return (
    <SelfOrderProvider token={params.token}>
      <SelfOrderLayoutContent token={params.token}>
        {children}
      </SelfOrderLayoutContent>
    </SelfOrderProvider>
  );
}

function SelfOrderLayoutContent({
  children, token
}: {
  children: React.ReactNode; token: string;
}) {
  const pathname = usePathname();
  const { config, cartCount, lastOrderId } = useSelfOrder();

  // Determine active tab for bottom nav
  const isMenu = pathname?.includes('/menu');
  const isCart = pathname?.includes('/cart');
  const isTrack = pathname?.includes('/track') || pathname?.includes('/invoice');

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 print:bg-white print:overflow-visible" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Main content */}
      <div className="flex-1 w-full mx-auto relative pb-20 lg:pb-0">
        {children}
      </div>

      {/* Bottom Navigation - Mobile */}
      {config?.selfOrderEnabled && config?.selfOrderMode !== 'QR_MENU' && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-2xl border-t border-gray-100 lg:hidden safe-area-bottom">
          <div className="max-w-2xl mx-auto flex items-center justify-around py-2 px-4">
            <Link
              href={`/s/${token}/menu`}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl transition-all ${isMenu ? 'text-black' : 'text-gray-400'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <span className="text-[10px] font-bold">Menu</span>
            </Link>

            <Link
              href={`/s/${token}/cart`}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl transition-all relative ${isCart ? 'text-black' : 'text-gray-400'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 right-2 w-4 h-4 bg-black text-white text-[8px] font-black rounded-full flex items-center justify-center">{cartCount}</span>
              )}
              <span className="text-[10px] font-bold">Cart</span>
            </Link>

            <Link
              href={lastOrderId ? `/s/${token}/track/${lastOrderId}` : `/s/${token}/menu`}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-xl transition-all ${isTrack ? 'text-black' : 'text-gray-400'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-[10px] font-bold">Orders</span>
            </Link>
          </div>
        </nav>
      )}

      <style jsx global>{`
        .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
        .no-scrollbar { scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
