'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { io } from 'socket.io-client';

interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
}

function QRCode({ value }: { value: string }) {
  const [qrSvg, setQrSvg] = useState('');
  useEffect(() => {
    import('qrcode').then(QR => {
      QR.toString(value, { type: 'svg', width: 320, margin: 2, color: { dark: '#1c1917', light: '#ffffff' } }).then(setQrSvg);
    });
  }, [value]);
  return <div dangerouslySetInnerHTML={{ __html: qrSvg }} className="p-4 bg-white border border-neutral-200 rounded-3xl shadow-sm" />;
}

export default function CustomerDisplayPage() {
  const { tableId } = useParams();
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [paymentRequest, setPaymentRequest] = useState<{ active: boolean; orderId?: string; total?: number; method?: string } | null>(null);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const s = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
    setSocket(s);

    s.emit('JOIN_TABLE', tableId);

    s.on('ORDER_UPDATE', (data: any) => {
      if (data.items) {
        setItems(data.items);
        setTotal(data.total);
      }
    });

    s.on('PAYMENT_REQUEST', (data: any) => {
      setPaymentRequest({ active: true, orderId: data.orderId, total: data.total, method: data.method });
    });

    s.on('PAYMENT_DONE', () => {
      setPaymentRequest({ active: false });
      setItems([]);
      setTotal(0);
    });

    return () => { s.disconnect(); };
  }, [tableId]);

  if (paymentRequest?.active) {
    const payUrl = `${window.location.origin}/pay/${paymentRequest.orderId}`;

    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 animate-fade-in text-center">
        <div className="mb-8">
           <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-2">Order Total</p>
           <h1 className="text-7xl font-black text-primary-600 tracking-tight">₹{paymentRequest.total}</h1>
        </div>

        {paymentRequest.method === 'TERMINAL' ? (
          <div className="bg-primary-50 p-12 rounded-[4rem] border-4 border-primary-100 flex flex-col items-center gap-6 max-w-lg mb-8">
             <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-5xl shadow-sm">💳</div>
             <p className="text-2xl font-black text-primary-800">Paying on Card Machine</p>
             <p className="text-sm text-primary-600 font-bold">Please follow the instructions on the physical machine at the counter.</p>
          </div>
        ) : (
          <div className="bg-neutral-50 p-8 rounded-[4rem] border-2 border-primary-100 shadow-xl mb-8">
            <QRCode value={payUrl} />
            <p className="font-bold text-neutral-800 mt-6">Scan to Pay via Phone</p>
            <p className="text-xs text-neutral-400 mt-1">UPI • Card • Netbanking</p>
          </div>
        )}

        <div className="flex items-center gap-2 text-primary-500 font-bold animate-pulse">
           <span className="w-2 h-2 rounded-full bg-primary-500" />
           Waiting for payment confirmation...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col font-sans">
      <div className="p-10 border-b border-neutral-100 bg-white shadow-sm flex items-center justify-between">
         <div>
            <h1 className="text-4xl font-black text-neutral-800 tracking-tight">Your Order</h1>
            <p className="text-sm font-bold text-primary-500 uppercase tracking-widest mt-1">Table {tableId}</p>
         </div>
         <div className="text-right">
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Grand Total</p>
            <p className="text-5xl font-black text-neutral-800 tracking-tighter">₹{total}</p>
         </div>
      </div>

      <div className="flex-1 p-10 overflow-y-auto max-w-5xl mx-auto w-full">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20">
             <span className="text-9xl mb-6">☕</span>
             <h2 className="text-2xl font-black uppercase tracking-widest">Enjoy Your Meal</h2>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-neutral-50 animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                 <div className="flex gap-5 items-center">
                    <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-xl font-black text-primary-700">{item.quantity}x</div>
                    <span className="text-xl font-bold text-neutral-800">{item.name}</span>
                 </div>
                 <span className="text-xl font-black text-neutral-400">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-8 bg-neutral-900 text-white flex justify-center items-center gap-3">
         <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
         <p className="text-sm font-bold uppercase tracking-widest opacity-80 decoration-primary-500">Live Mirror Active</p>
      </div>
    </div>
  );
}
