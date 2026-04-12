'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { motion } from 'framer-motion';

function ConfirmContent({ token }: { token: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get('orderId');
  const total = params.get('total');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-gray-100">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", damping: 12 }}
            className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-black/20"
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Order Confirmed!</h1>
          <p className="text-sm text-gray-500 mb-6">Your order has been sent to the kitchen.</p>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-2xl p-5 mb-6 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-gray-400 uppercase tracking-wider">Order ID</span>
              <span className="font-bold text-gray-900">#{orderId?.slice(-6).toUpperCase()}</span>
            </div>
            <div className="h-px bg-gray-200/50" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Total Paid</span>
              <span className="text-xl font-extrabold text-gray-900">₹{total}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={() => router.push(`/s/${token}/track/${orderId}`)}
              className="w-full bg-gray-900 text-white py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-gray-900/15 flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Track Order
            </button>

            <button
              onClick={() => router.push(`/s/${token}/invoice/${orderId}`)}
              className="w-full bg-white text-gray-700 py-3 rounded-2xl text-sm font-semibold border border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Invoice
            </button>

            <button
              onClick={() => router.push(`/s/${token}/menu`)}
              className="w-full py-2.5 text-sm font-semibold text-gray-400 hover:text-indigo-600 transition-colors"
            >
              Order More Items
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ConfirmationPage({ params }: { params: { token: string } }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ConfirmContent token={params.token} />
    </Suspense>
  );
}
