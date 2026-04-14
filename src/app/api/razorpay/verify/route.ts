import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/backend/database/prisma';

export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      internalOrderId,
      method,
      amount
    } = await req.json();

    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_secret) {
      return NextResponse.json({ error: 'Razorpay secret not configured' }, { status: 500 });
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', key_secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: 'Payment signature mismatch' }, { status: 400 });
    }

    // Coerce 'ONLINE' to 'DIGITAL' to match Prisma Enum
    const dbMethod = (method === 'ONLINE' ? 'DIGITAL' : method) || 'DIGITAL';

    // Update database in transaction
    await prisma.$transaction([
      prisma.payment.upsert({
        where: { orderId: internalOrderId },
        create: {
          orderId: internalOrderId,
          method: dbMethod as any,
          amount: amount
        },
        update: {
          method: dbMethod as any,
          amount: amount
        }
      }),
      // Mark order as PAID
      prisma.order.update({
        where: { id: internalOrderId },
        data: { status: 'SENT' }
      })
    ]);

    return NextResponse.json({ success: true, message: 'Payment verified and status updated' });
  } catch (error: any) {
    console.error('Razorpay Verify Error:', error);
    return NextResponse.json({ error: error.message || 'Error verifying Razorpay payment' }, { status: 500 });
  }
}
