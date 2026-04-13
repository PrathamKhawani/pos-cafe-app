import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, AUTH_COOKIE_NAME } from '@/backend/database/auth';

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

  // Check JWT cookie
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // We want to skip redirecting to login if it's a public path and no token
  if (!token) {
    if (isPublicPath) {
      return NextResponse.next();
    }
    // Redirect to login if no token is found for private routes
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  try {
    const payload = await verifyToken(token);
    if (!payload) {
      // Invalid token
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
    const roleMap: Record<string, string> = {
        'ADMIN': 'admin',
        'CASHIER': 'staff',
        'KITCHEN': 'kitchen'
    };
    
    const allowedSegment = roleMap[payload.role];
    const pathSegments = pathname.split('/').filter(Boolean);
    const firstSegment = pathSegments[0];
    const isDashboardPath = ['admin', 'staff', 'kitchen'].includes(firstSegment);

    // If on a first-segment dashboard path, ensure it matches the user's role EXACTLY
    if (isDashboardPath && firstSegment !== allowedSegment) {
        return NextResponse.redirect(new URL(`/${allowedSegment}`, request.url));
    }

    // 3. Admin-Only Module Protection (Regardless of whether it's /admin/xxx or /staff/xxx)
    const adminOnlyModules = ['branches', 'floors', 'categories', 'products', 'qr-print', 'staff', 'reports'];
    const staffAllowedModules = ['sessions', 'payment-methods'];
    const currentModule = pathSegments[1];
    
    // Admin only check
    if (isDashboardPath && adminOnlyModules.includes(currentModule) && payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL(`/${allowedSegment}`, request.url));
    }

    // Staff allowed modules check (exclude Kitchen from these)
    if (isDashboardPath && staffAllowedModules.includes(currentModule) && !['ADMIN', 'CASHIER'].includes(payload.role)) {
        return NextResponse.redirect(new URL(`/${allowedSegment}`, request.url));
    }

    // Role-specific sub-routes
    if (pathname.includes('/kitchen-display') && !['ADMIN', 'KITCHEN', 'CASHIER'].includes(payload.role)) {
        return NextResponse.redirect(new URL(`/${allowedSegment}`, request.url));
    }

    if (pathname.startsWith('/pos') && !['ADMIN', 'CASHIER'].includes(payload.role)) {
        return NextResponse.redirect(new URL(`/${allowedSegment}`, request.url));
    }

    // 3. Branch selection enforcement
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
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
