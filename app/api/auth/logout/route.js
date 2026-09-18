import { NextResponse } from 'next/server';
import { COOKIE_NAME } from '../../../../lib/auth.js';

export const runtime = 'nodejs';

/* POST /api/auth/logout → 清除会话 Cookie */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return res;
}
