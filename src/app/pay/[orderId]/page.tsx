'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

export default function MobilePayPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        setOrder(data);
        if (data.status === 'PAID') {
          toast.success('Order is already paid');
        } else {
          initiatePayment(data.total);
        }
      } catch (err) {
        toast.error('Failed to load order');
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderId]);

  async function initiatePayment(amount: number) {
    try {
      // 1. Create Razorpay Order
      const res = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount })
      });
      const data = await res.json();
      
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      const options = {
        key: razorpayKey,
        amount: data.amount,
        currency: data.currency,
        name: "Cafe POS",
        description: `Order #${(orderId as string).slice(-6)}`,
        order_id: data.id,
        handler: async function (response: any) {
          // 2. Verify Payment
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              internalOrderId: orderId,
              method: 'ONLINE',
              amount: amount
            })
          });
          
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            // 3. Notify Staff via Socket
            const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
            socket.emit('PAYMENT_DONE', { orderId, status: 'PAID' });
            setTimeout(() => socket.disconnect(), 1000);
            
            toast.success('Payment Successful!');
          } else {
            toast.error('Payment verification failed');
          }
        },
        prefill: { name: "", email: "", contact: "" },
        theme: { color: "#7C5C3E" },
        retry: { enabled: true, max_count: 1 },
        modal: {
            confirm_close: true,
            backdropclose: false,
            escape: false,
            ondismiss: function() {
                setLoading(false);
            }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error('Payment initialization failed');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-50 text-center">
        <div>
           <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
           <p className="font-bold text-neutral-600">Initializing Secure Payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-center">
       <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mb-4">✓</div>
       <h1 className="text-2xl font-black text-neutral-800 mb-2">Payment Complete</h1>
       <p className="text-neutral-500 mb-8">You can now close this window.</p>
       <button onClick={() => window.close()} className="btn-primary w-full max-w-xs">Done</button>
    </div>
  );
}
