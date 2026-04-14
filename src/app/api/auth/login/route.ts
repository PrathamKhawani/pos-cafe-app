import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';
import { signToken, getAuthCookieName } from '@/backend/database/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json(); // 'email' can be email OR username from frontend
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // Attempt to find user by email or username
    const user = await prisma.user.findFirst({ 
      where: {
        OR: [
          { email: email },
          { username: email }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.isApproved) {
      return NextResponse.json({ error: 'Your account is pending admin approval' }, { status: 403 });
    }

    const token = await signToken({ userId: user.id, email: user.email, role: user.role });
    const res = NextResponse.json({ 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        username: user.username, 
        role: user.role 
      } 
    });

    const cookieName = getAuthCookieName(user.role);
    res.cookies.set(cookieName, token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, 
      path: '/',
      sameSite: 'lax'
    });

    return res;
  } catch (e: any) {
    console.error('LOGIN_ERROR:', e);
    return NextResponse.json({ error: e.message || 'Server error during authentication' }, { status: 500 });
  }
}
