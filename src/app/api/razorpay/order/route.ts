import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { prisma } from '@/backend/database/prisma';

export async function POST(req: NextRequest) {
  try {
    const { orderId, amount } = await req.json();

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json({ error: 'Razorpay credentials not configured in .env' }, { status: 500 });
    }

    const instance = new Razorpay({
      key_id,
      key_secret,
    });

    // Razorpay expect amount in paisa (100 paisa = 1 INR)
    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${orderId}`,
    };

    const order = await instance.orders.create(options);

    return NextResponse.json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
    });
  } catch (error: any) {
    console.error('Razorpay Order Error:', error);
    return NextResponse.json({ error: error.message || 'Error creating Razorpay order' }, { status: 500 });
  }
}
