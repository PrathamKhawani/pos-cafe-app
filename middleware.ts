import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getAuthCookieName, ALL_AUTH_COOKIES } from '@/backend/database/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public routes that don't require authentication
  const isPublicPath = 
    pathname === '/' ||
    pathname === '/login' || 
    pathname === '/signup' || 
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/s/') || // Customer specific routes
    pathname.startsWith('/api/auth');

  // 1. Determine which role-specific cookie to look for based on path
  const pathSegments = pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0];
  
  const roleMap: Record<string, string> = {
    'admin': 'ADMIN',
    'staff': 'CASHIER',
    'kitchen': 'KITCHEN'
  };

  // If it's a dashboard path, prioritize that role's cookie
  let targetRole = roleMap[firstSegment];
  let token = request.cookies.get(getAuthCookieName(targetRole))?.value;

  // If no token for that specific role, check for an ADMIN token (admins can see everything)
  if (!token && targetRole !== 'ADMIN') {
    token = request.cookies.get(getAuthCookieName('ADMIN'))?.value;
  }

  // If still no token and it's not a dashboard path, check all possible cookies
  if (!token && !targetRole) {
    for (const cookieName of ALL_AUTH_COOKIES) {
      const t = request.cookies.get(cookieName)?.value;
      if (t) {
        token = t;
        break;
      }
    }
  }

  // Legacy fallback
  if (!token) {
    token = request.cookies.get('cafe-pos-session-v1')?.value;
  }

  // Check JWT cookie
  if (!token) {
    if (isPublicPath) {
      return NextResponse.next();
    }
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  try {
    const payload = await verifyToken(token);
    if (!payload) {
      if (isPublicPath) return NextResponse.next();
      const url = new URL('/login', request.url);
      return NextResponse.redirect(url);
    }

    // Since user IS logged in, redirect them away from auth/landing pages
    if (pathname === '/' || pathname === '/login' || pathname === '/signup') {
        if (payload.role === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url));
        if (payload.role === 'CASHIER') return NextResponse.redirect(new URL('/branch-select', request.url));
        if (payload.role === 'KITCHEN') return NextResponse.redirect(new URL('/kitchen', request.url));
    }

    // 2. Role-Based Path Enforcement
    const allowedSegment = roleMap[payload.role.toLowerCase()] || (payload.role === 'CASHIER' ? 'staff' : payload.role.toLowerCase());
    // (Re-mapping for the segment check)
    const normalizedRoleMap: Record<string, string> = {
        'ADMIN': 'admin',
        'CASHIER': 'staff',
        'KITCHEN': 'kitchen'
    };
    
    const segmentForRole = normalizedRoleMap[payload.role];
    const isDashboardPath = ['admin', 'staff', 'kitchen'].includes(firstSegment);

    // Ensure session role matches path segment (Admins can go anywhere)
    if (isDashboardPath && firstSegment !== segmentForRole && payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL(`/${segmentForRole}`, request.url));
    }

    // 3. Admin-Only Module Protection
    const adminOnlyModules = ['branches', 'floors', 'categories', 'products', 'qr-print', 'staff', 'reports'];
    const staffAllowedModules = ['sessions', 'payment-methods'];
    const currentModule = pathSegments[1];
    
    if (isDashboardPath && adminOnlyModules.includes(currentModule) && payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL(`/${segmentForRole}`, request.url));
    }

    if (isDashboardPath && staffAllowedModules.includes(currentModule) && !['ADMIN', 'CASHIER'].includes(payload.role)) {
        return NextResponse.redirect(new URL(`/${segmentForRole}`, request.url));
    }

    if (pathname.includes('/kitchen-display') && !['ADMIN', 'KITCHEN', 'CASHIER'].includes(payload.role)) {
        return NextResponse.redirect(new URL(`/${segmentForRole}`, request.url));
    }

    if (pathname.startsWith('/pos') && !['ADMIN', 'CASHIER'].includes(payload.role)) {
        return NextResponse.redirect(new URL(`/${segmentForRole}`, request.url));
    }

    // 4. Branch selection enforcement
    const branchId = request.cookies.get('branch-id')?.value;
    const isStationPath = pathname.includes('/pos') || pathname.includes('/kitchen') || pathname === '/kitchen-display';
    
    if (isStationPath && !branchId && pathname !== '/branch-select') {
      return NextResponse.redirect(new URL('/branch-select', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware Auth Error:', error);
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
