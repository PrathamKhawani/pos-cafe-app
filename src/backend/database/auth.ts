import * as jose from 'jose';
import { NextRequest } from 'next/server';


const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'odoo_pos_cafe_super_secret_key_2024');

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const AUTH_COOKIE_NAME = 'cafe-pos-session-v1'; // Legacy fallback

export function getAuthCookieName(role?: string): string {
  if (!role) return AUTH_COOKIE_NAME;
  return `pos-session-${role.toLowerCase()}`;
}

export const ALL_AUTH_COOKIES = ['admin', 'cashier', 'kitchen'].map(r => `pos-session-${r}`);


export async function signToken(payload: JWTPayload): Promise<string> {
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest | any): string | undefined {
  // 1. Get role preference from header or referrer
  let preferredRole: string | undefined;
  
  if (typeof req.headers.get === 'function') {
    const headerRole = req.headers.get('x-pos-role')?.toLowerCase();
    if (headerRole) {
      preferredRole = headerRole === 'staff' ? 'cashier' : headerRole;
    }
    
    // Fallback: Infer from Referer header if present
    if (!preferredRole) {
      const referer = req.headers.get('referer')?.toLowerCase();
      if (referer) {
        if (referer.includes('/admin')) preferredRole = 'admin';
        else if (referer.includes('/staff')) preferredRole = 'cashier';
        else if (referer.includes('/kitchen')) preferredRole = 'kitchen';
      }
    }
  }

  // 2. Normalize aliases
  if (preferredRole === 'staff') preferredRole = 'cashier';

  // 3. If we have a preference, try that cookie ONLY.
  // CRITICAL: We DO NOT fall back to other cookies if a specific role is preferred.
  // This prevents an Admin session from bleeding into a Staff dashboard on refresh.
  if (preferredRole) {
    const cookieName = getAuthCookieName(preferredRole);
    const token = typeof req.cookies.get === 'function' 
      ? req.cookies.get(cookieName)?.value 
      : req.cookies[cookieName];
    
    // If we have a token for the PREFERRED role, use it.
    if (token) return token;
    
    // Special Case: If we are looking for a staff/kitchen session but missing it,
    // we allow the ADMIN session as a backup (Admins have access to all dashboards).
    if (preferredRole !== 'admin') {
      const adminCookie = getAuthCookieName('admin');
      const adminToken = typeof req.cookies.get === 'function' 
        ? req.cookies.get(adminCookie)?.value 
        : req.cookies[adminCookie];
      if (adminToken) return adminToken;
    }

    // If we are on a role-specific path but HAVE NO TOKEN for that role or admin, 
    // we MUST NOT fall back to other roles (e.g., if on /staff, don't pick /kitchen token).
    return undefined;
  }

  // 4. Fallback: ONLY for genuinely ambiguous requests (no x-pos-role and no role-referer).
  // Try checking all possible role-specific cookies in order.
  for (const cookieName of ALL_AUTH_COOKIES) {
    const token = typeof req.cookies.get === 'function' 
      ? req.cookies.get(cookieName)?.value 
      : req.cookies[cookieName];
    if (token) return token;
  }
  
  // 5. Final legacy fallback
  return typeof req.cookies.get === 'function'
    ? req.cookies.get('cafe-pos-session-v1')?.value
    : req.cookies['cafe-pos-session-v1'];
}


