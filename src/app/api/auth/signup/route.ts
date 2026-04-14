import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/database/prisma';
import { signToken, getAuthCookieName } from '@/backend/database/auth';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const { name, email, username, password, role } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check existing by email or username
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username || undefined }
        ]
      }
    });

    if (existing) {
      const msg = existing.email === email ? 'Email already registered' : 'Username already taken';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    
    // Check if this is the very first user in the database
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    let assignedRole = role === 'KITCHEN' ? 'KITCHEN' : 'CASHIER';
    let isApproved = false;

    if (isFirstUser) {
        assignedRole = 'ADMIN';
        isApproved = true;
    }

    // Create new user using Prisma
    const user = await prisma.user.create({
      data: {
        name,
        email,
        username: username || null,
        password: hashed,
        role: assignedRole as UserRole,
        isApproved: isApproved
      }
    });

    // If not approved, do NOT sign them in immediately.
    if (!isApproved) {
        return NextResponse.json({ 
            user: { id: user.id, name: user.name, email: user.email, role: user.role, isApproved: user.isApproved },
            pendingApproval: true,
            message: 'Registration successful! Your account is pending admin approval.'
        });
    }

    // For first user (ADMIN), automatically log them in
    const token = await signToken({ userId: user.id, email: user.email, role: user.role });
    const res = NextResponse.json({ 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        username: user.username, 
        role: user.role,
        isApproved: user.isApproved
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
    console.error('SIGNUP_ERROR:', e);
    return NextResponse.json({ error: e.message || 'Identity registration failed' }, { status: 500 });
  }
}
