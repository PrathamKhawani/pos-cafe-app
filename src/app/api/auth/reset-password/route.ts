import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryCustom } from '@/backend/database/direct';

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();
    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: 'Check all fields' }, { status: 400 });
    }

    const users = await queryCustom('SELECT * FROM "User" WHERE email = $1 LIMIT 1', [email]);
    const user = users[0];

    // Efficient DB-side combined check for OTP match and Expiry
    const activeUsers = await queryCustom(
      'SELECT id FROM "User" WHERE id = $1 AND otp = $2 AND "otpExpiry" > NOW()',
      [user.id, otp]
    );

    if (activeUsers.length === 0) {
      // Re-verify if it was specific expiry or just wrong OTP
      if (user.otp !== otp) {
        return NextResponse.json({ error: 'Invalid or missing OTP code' }, { status: 400 });
      }
      return NextResponse.json({ error: 'OTP code has expired' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear OTP using raw SQL
    await queryCustom(
      'UPDATE "User" SET password = $1, otp = NULL, "otpExpiry" = NULL WHERE id = $2',
      [hashed, user.id]
    );

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (e: any) {
    console.error('RESET_PASS_ERROR:', e);
    return NextResponse.json({ error: e.message || 'Identity update failed' }, { status: 500 });
  }
}
