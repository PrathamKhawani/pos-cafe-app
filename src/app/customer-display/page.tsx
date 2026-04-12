'use client';
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import QRCode from 'qrcode';

interface OrderItem {
  id: string; quantity: number; price: number; product: { name: string };
}
interface Order {
  id: string; status: string; total: number; table?: { number: string };
  items: OrderItem[];
}
interface Config {
  upiEnabled: boolean;
  upiId?: string;
  bgImageUrl?: string;
}

export default function CustomerDisplayPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [paid, setPaid] = useState(false);
  const [qrSrc, setQrSrc] = useState<string>('');
  const [config, setConfig] = useState<Config>({ upiEnabled: false });
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  useEffect(() => {
    fetch('/api/pos-config').then(r => r.json()).then(setConfig).catch(() => {});
    
    try {
      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
      socketRef.current = socket;
      
      socket.on('ORDER_UPDATE', (data: Order) => { setOrder(data); setPaid(false); });
      socket.on('PAYMENT_DONE', () => { setPaid(true); setTimeout(() => { setOrder(null); setPaid(false); }, 5000); });
      return () => { socket.disconnect(); };
    } catch (e) {
      console.error('Socket error:', e);
    }
  }, []);

  useEffect(() => {
    if (order && config.upiEnabled && config.upiId) {
      const upiLink = `upi://pay?pa=${config.upiId}&pn=CafePOS&am=${order.total}&cu=INR`;
      QRCode.toDataURL(upiLink, { margin: 2, color: { dark: '#1c1917', light: '#ffffff' } }).then(setQrSrc);
    } else {
      setQrSrc('');
    }
  }, [order, config]);

  return (
    <div className="min-h-screen flex font-sans overflow-hidden bg-[#F5F3EF]">
      {/* Left: Branding */}
      <div className="w-[45%] relative flex flex-col items-center justify-center p-16 overflow-hidden">
        {config.bgImageUrl && (
          <img src={config.bgImageUrl} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-multiply" />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F5F3EF]/90 to-[#F5F3EF]/50 z-0" />
        
        <div className="relative z-10 text-center w-full max-w-sm">
          <div className="w-24 h-24 bg-primary-600 rounded-3xl flex items-center justify-center text-5xl mb-8 mx-auto text-white shadow-xl shadow-primary-500/20">☕</div>
          <h1 className="text-4xl font-bold text-neutral-800 tracking-tight mb-3">Cafe POS</h1>
          <p className="text-sm font-semibold text-neutral-600 uppercase tracking-widest mb-12">Quality Coffee & Eats</p>

          {qrSrc && !paid && (
            <div className="card p-8 animate-slide-up border-primary-200">
              <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-1">UPI Checkout</h3>
              <p className="text-xl font-black text-neutral-800 tracking-tight mb-6 mt-1">Scan to Pay securely</p>
              
              <div className="bg-neutral-50 p-4 rounded-2xl mb-6 inline-block border border-neutral-200">
                <img src={qrSrc} alt="UPI QR" className="w-48 h-48 mix-blend-multiply" />
              </div>
              <div className="flex gap-2 justify-center">
                 {['GPAY', 'PAYTM', 'PHONEPE'].map(app => (
                    <div key={app} className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-400 font-bold text-2xs uppercase shadow-sm">
                      {app}
                    </div>
                 ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Order Details */}
      <div className="flex-1 flex flex-col p-8 lg:p-16 border-l border-neutral-200 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-10">
        {paid ? (
          <div className="h-full flex flex-col items-center justify-center animate-fade-in text-center">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mb-6">✓</div>
            <h2 className="text-4xl font-black text-neutral-800 tracking-tight mb-2">Payment Successful</h2>
            <p className="text-lg text-neutral-500 font-medium">Thank you for your order!</p>
          </div>
        ) : order ? (
          <div className="flex-1 flex flex-col animate-fade-in">
            <div className="flex items-end justify-between mb-8 pb-6 border-b border-neutral-100 shrink-0">
               <div>
                  <div className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-1">Your Order</div>
                  <h2 className="text-4xl font-bold text-neutral-800 tracking-tight">Checkout Summary</h2>
               </div>
               {order.table && (
                  <div className="px-4 py-2 bg-primary-50 rounded-xl border border-primary-100 text-sm font-bold text-primary-700 uppercase tracking-widest">
                     Table {order.table.number}
                  </div>
               )}
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar mb-8">
              <div className="space-y-4">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between items-center group">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-center font-bold text-neutral-600">
                         {item.quantity}
                       </div>
                       <div>
                         <div className="font-bold text-neutral-800 tracking-wide text-lg">{item.product?.name}</div>
                         <div className="text-xs font-semibold text-neutral-400">₹{item.price} each</div>
                       </div>
                    </div>
                    <div className="text-xl font-bold text-neutral-800">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-8 bg-[#F5F3EF] border-primary-200 shrink-0 shadow-sm flex items-center justify-between">
               <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Total Amount Due</p>
                  <h3 className="text-xl font-bold text-neutral-800">Please pay at the counter</h3>
               </div>
               <div className="text-5xl font-black text-primary-600 tracking-tighter">
                  ₹{order.total?.toLocaleString()}
               </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-40">
            <div className="w-24 h-24 border-4 border-neutral-200 border-t-primary-500 rounded-full animate-spin mb-8" />
            <h2 className="text-2xl font-bold text-neutral-600 tracking-tight">Awaiting Order</h2>
            <p className="text-sm font-medium text-neutral-500 mt-2">The display will update automatically</p>
          </div>
        )}
      </div>
    </div>
  );
}
