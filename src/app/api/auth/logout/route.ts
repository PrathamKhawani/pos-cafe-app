import { NextResponse } from 'next/server';
import { ALL_AUTH_COOKIES } from '@/backend/database/auth';

export async function POST() {
  const res = NextResponse.json({ success: true });
  
  // Clear all possible POS cookies to ensure total logout
  ALL_AUTH_COOKIES.forEach(cookieName => {
    res.cookies.delete(cookieName);
  });
  
  // Also clear legacy cookie if present
  res.cookies.delete('cafe-pos-session-v1');
  
  return res;
}
