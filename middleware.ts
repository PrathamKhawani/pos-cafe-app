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

  // 1. Determine which role-specific cookie to look for based on path or referrer
  const pathSegments = pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0];
  
  const roleMap: Record<string, string> = {
    'admin': 'ADMIN',
    'staff': 'CASHIER',
    'kitchen': 'KITCHEN'
  };

  // Logic: First check the URL segment, then the Referer header (for API calls)
  let targetRoleNameFromPath = firstSegment;
  if (targetRoleNameFromPath === 'api') {
      const referer = request.headers.get('referer');
      if (referer) {
          if (referer.includes('/admin')) targetRoleNameFromPath = 'admin';
          else if (referer.includes('/staff')) targetRoleNameFromPath = 'staff';
          else if (referer.includes('/kitchen')) targetRoleNameFromPath = 'kitchen';
      }
  }

  let targetRole = roleMap[targetRoleNameFromPath];
  let token = request.cookies.get(getAuthCookieName(targetRole))?.value;

  // 1. Special case: If user is on a role-specific dashboard but missing that cookie, 
  // check for an ADMIN token (Admins have access to all dashboards).
  if (!token && targetRole !== 'ADMIN') {
    token = request.cookies.get(getAuthCookieName('ADMIN'))?.value;
  }

  // 2. If NO token is found for the path's target role, we check if they are logged in AT ALL 
  // only if they are on a non-role-specific path (like root or branch-select).
  // On role-specific paths, we MUST NOT fall back to other roles automatically as it causes crossover.
  if (!token && !targetRole) {
    // This loop is ONLY for ambiguity resolution on generic paths like "/"
    for (const cookieName of ALL_AUTH_COOKIES) {
      const t = request.cookies.get(cookieName)?.value;
      if (t) {
        token = t;
        break;
      }
    }
  }

  // 3. Final fallback
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
