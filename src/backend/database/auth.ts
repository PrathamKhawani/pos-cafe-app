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
  // Check all possible role-specific cookies
  for (const cookieName of ALL_AUTH_COOKIES) {
    const token = typeof req.cookies.get === 'function' 
      ? req.cookies.get(cookieName)?.value 
      : req.cookies[cookieName];
    if (token) return token;
  }
  
  // Legacy fallback
  return typeof req.cookies.get === 'function'
    ? req.cookies.get('cafe-pos-session-v1')?.value
    : req.cookies['cafe-pos-session-v1'];
}

