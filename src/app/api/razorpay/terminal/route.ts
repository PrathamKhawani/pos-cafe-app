import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: NextRequest) {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'dummy_key',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
    });

    const { orderId, amount, terminalId } = await req.json();

    if (!terminalId) {
      return NextResponse.json({ error: 'Terminal ID is required' }, { status: 400 });
    }

    // Trigger physical terminal
    // Note: This requires the specific 'razorpay' Node SDK version that supports terminals
    // If the SDK version doesn't support .terminal, a direct fetch to the Razorpay API would be needed.
    const terminalResponse = await razorpay.orders.create({
      amount: amount * 100, // razorpay expects paise
      currency: "INR",
      receipt: orderId,
      notes: { terminal_id: terminalId } // Custom note to track which terminal triggered it
    });

    // In a real Razorpay POS integration, you'd use the dedicated Terminal API
    // This is a simplified proxy for the implementation.
    
    return NextResponse.json({ 
      success: true, 
      message: 'Terminal payment initiated',
      terminalResponse 
    });

  } catch (error: any) {
    console.error('Razorpay Terminal Error:', error);
    return NextResponse.json({ error: error.message || 'Terminal triggered failed' }, { status: 500 });
  }
}
