'use client';
import { useRouter } from 'next/navigation';
import { useSelfOrder } from './context';
import { motion } from 'framer-motion';

export default function SplashPage() {
  const { table, config, token, loading } = useSelfOrder();
  const router = useRouter();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Loading...</p>
      </div>
    </div>
  );

  if (!config?.selfOrderEnabled) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white p-10 rounded-3xl shadow-xl text-center border border-gray-100">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Ordering Paused</h2>
        <p className="text-sm text-gray-500 leading-relaxed">Digital ordering is temporarily unavailable. Please contact a staff member for assistance.</p>
        <button onClick={() => window.location.reload()} className="mt-6 text-sm font-semibold text-gray-600 hover:underline">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-gray-100/60 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-gray-200/40 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm text-center"
      >
        <div className="bg-white/70 backdrop-blur-xl border border-white/80 p-10 sm:p-12 rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-7xl mb-6 drop-shadow-lg"
          >
            ☕
          </motion.div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-1">Odoo POS Cafe</h1>
          <p className="text-xs text-gray-400 font-medium mb-6">Digital Ordering Experience</p>

          {table && (
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-black text-white rounded-full mb-6 shadow-lg shadow-black/20">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-bold">Table {table.number} · {table.floor.name}</span>
            </div>
          )}

          <p className="text-sm text-gray-500 leading-relaxed mb-8">Browse our menu, customize your order, and pay — all from your phone.</p>

          <button
            onClick={() => router.push(`/s/${token}/menu`)}
            className="w-full bg-gray-900 text-white rounded-2xl py-4 text-sm font-bold tracking-wide shadow-xl shadow-gray-900/15 hover:shadow-2xl hover:shadow-gray-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Browse Menu →
          </button>

          {config.selfOrderMode === 'QR_MENU' && (
            <p className="mt-5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">View-only mode · Order at counter</p>
          )}
        </div>

        <p className="mt-8 text-[10px] font-semibold text-gray-300 uppercase tracking-widest">Powered by Cafe POS</p>
      </motion.div>
    </div>
  );
}
