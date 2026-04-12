'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface InvoiceData {
  order: { id: string; status: string; createdAt: string; updatedAt: string; note: string | null; isQrOrder: boolean };
  table: { number: string; floor: string; branch: string } | null;
  items: Array<{ name: string; variant: string | null; quantity: number; unitPrice: number; lineTotal: number; taxPercent: number; taxAmount: number; isVegetarian: boolean }>;
  totals: { subtotal: number; cgst: number; sgst: number; totalTax: number; grandTotal: number };
  payment: { method: string; amount: number; paidAt: string } | null;
}

export default function InvoicePage({ params }: { params: { token: string; orderId: string } }) {
  const router = useRouter();
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/orders/${params.orderId}/invoice`)
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .finally(() => setLoading(false));
  }, [params.orderId]);

  function handlePrint() {
    window.print();
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-500">Invoice not found</p>
        <button onClick={() => router.back()} className="mt-4 text-sm font-semibold text-black hover:underline">Go back</button>
      </div>
    </div>
  );

  const orderDate = new Date(data.order.createdAt);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 print:bg-white print:overflow-visible">
      {/* Top bar - hidden in print */}
      <div className="no-print bg-white/90 backdrop-blur-xl border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-bold">Invoice</h1>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-black active:scale-95 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF
        </button>
      </div>

      {/* Invoice content */}
      <div ref={printRef} className="print-content max-w-xl mx-auto px-4 sm:px-6 py-8 print:p-0 print:max-w-none">
        <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden print:shadow-none print:border-none print:rounded-none">
          {/* Header Section */}
          <div className="bg-black text-white p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[radial-gradient(circle_at_50%_50%,#fff_0%,transparent_100%)]" />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <h2 className="text-3xl font-black tracking-tighter mb-2">ODOO POS CAFE</h2>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-6">Tax Invoice / Bill of Sale</p>
              
              <div className="flex flex-wrap justify-center gap-3 relative z-10">
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5">
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Invoice Number</p>
                  <p className="text-sm font-black tracking-tight">#{data.order.id.slice(-8).toUpperCase()}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5">
                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Status</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${data.payment ? 'bg-white' : 'bg-gray-500'}`} />
                    <span className="text-sm font-black tracking-tight">{data.payment ? 'PAID' : 'PENDING'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Details Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-gray-100 divide-x divide-gray-100 bg-gray-50/30">
            <div className="p-5 text-center">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</p>
              <p className="text-xs font-bold text-gray-900">{orderDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
            </div>
            <div className="p-5 text-center">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Time</p>
              <p className="text-xs font-bold text-gray-900">{orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="p-5 text-center">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Table</p>
              <p className="text-xs font-bold text-gray-900">{data.table ? data.table.number : 'None'}</p>
            </div>
            <div className="p-5 text-center">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Floor</p>
              <p className="text-xs font-bold text-gray-900 truncate px-2">{data.table ? data.table.floor : 'Takeaway'}</p>
            </div>
          </div>

          {/* Items Section */}
          <div className="p-8 sm:p-10">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 border-b pb-2">Order Summary</h3>
            
            <div className="space-y-6">
              {data.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start group">
                  <div className="flex-1 pr-8">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black px-2 py-1 bg-gray-100 text-gray-600 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">{item.quantity}×</span>
                      <p className="text-sm sm:text-base font-black text-gray-900 tracking-tight flex items-center">
                        <span className={`flex-shrink-0 inline-flex items-center justify-center w-3 h-3 rounded-sm border ${item.isVegetarian ? 'border-green-600 bg-white' : 'border-red-600 bg-white'} mr-2 relative top-[-1px]`}>
                           <span className={`w-1.5 h-1.5 rounded-full ${item.isVegetarian ? 'bg-green-600' : 'bg-red-600'}`}></span>
                        </span>
                        {item.name}
                      </p>
                    </div>
                    {item.variant && <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-11 mt-1">{item.variant}</p>}
                    {item.taxPercent > 0 && <p className="text-[9px] text-gray-400 font-medium ml-11 mt-0.5">Tax ({item.taxPercent}%)</p>}
                  </div>
                  <div className="text-right pt-0.5">
                    <p className="text-sm sm:text-base font-black text-gray-900 tracking-tighter">₹{item.lineTotal.toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Section */}
            <div className="mt-12 pt-8 border-t-2 border-dashed border-gray-100 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-gray-400">SUBTOTAL</span>
                <span className="font-black text-gray-900">₹{data.totals.subtotal.toFixed(0)}</span>
              </div>
              {data.totals.totalTax > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-gray-400">TOTAL TAXES</span>
                  <span className="font-black text-gray-900">₹{data.totals.totalTax.toFixed(0)}</span>
                </div>
              )}
              <div className="pt-4 mt-2">
                <div className="bg-gray-100 rounded-3xl p-6 flex justify-between items-center border border-gray-200">
                  <span className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Grand Total</span>
                  <span className="text-3xl font-black text-gray-900 tracking-tighter">₹{data.totals.grandTotal.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Payment & Footer */}
            <div className="mt-10 pt-10 border-t border-gray-50">
              {data.payment ? (
                <div className="flex items-center gap-4 bg-gray-50 rounded-[32px] p-5 border border-gray-100 mb-8">
                  <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Paid Successfully</p>
                    <p className="text-xs font-bold text-black uppercase tracking-tight">Via {data.payment.method} • {new Date(data.payment.paidAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-[32px] p-5 border border-gray-200 mb-8 text-center text-gray-600">
                  <p className="text-xs font-black uppercase tracking-widest">Payment Pending</p>
                </div>
              )}

              <div className="text-center space-y-1">
                <p className="text-[10px] font-black text-gray-900 tracking-[0.3em] uppercase">Thanks for Visiting!</p>
                <p className="text-[9px] font-semibold text-gray-400">ODOO POS CAFE • Professional Receipt</p>
              </div>
            </div>
          </div>
          
          {/* Bottom Receipt Cut Effect (Hidden in Print) */}
          <div className="h-4 bg-white relative no-print">
             <div className="absolute inset-0 flex justify-around">
               {[...Array(20)].map((_, i) => (
                 <div key={i} className="w-4 h-4 bg-[#F8F9FA] rounded-full -mb-2" style={{ transform: 'translateY(10px)' }} />
               ))}
             </div>
          </div>
        </div>

        {/* Action buttons - hidden in print */}
        <div className="no-print mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => router.push(`/s/${params.token}/track/${params.orderId}`)}
            className="group bg-black text-white py-4 rounded-2xl text-sm font-black shadow-xl flex items-center justify-center gap-3 transition-all hover:bg-gray-900 active:scale-[0.98] uppercase tracking-widest"
          >
            <svg className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Track Order
          </button>
          <button
            onClick={() => router.push(`/s/${params.token}/menu`)}
            className="bg-white text-gray-700 py-4 rounded-2xl text-sm font-black border border-gray-200 flex items-center justify-center gap-3 transition-all hover:bg-gray-50 active:scale-[0.98] uppercase tracking-widest"
          >
            Order More
          </button>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; display: block; }
          .print-content { display: block !important; visibility: visible !important; padding: 0 !important; width: 100% !important; max-width: none !important; position: static !important; }
          .print-content * { visibility: visible !important; }
          @page { margin: 0; size: auto; }
          html, body { height: auto !important; overflow: visible !important; }
        }
      `}</style>
    </div>
  );
}
