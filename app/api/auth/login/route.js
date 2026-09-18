import { NextResponse } from 'next/server';
import { findUserByName, verifyPassword } from '../../../../lib/users.js';
import { setSessionCookie } from '../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* POST /api/auth/login { username, password } → 校验用户表，种 30 天会话 Cookie */
export async function POST(req) {
  let username = '', password = '';
  try {
    const b = await req.json();
    username = String(b?.username ?? '').trim();
    password = String(b?.password ?? '');
  } catch { /* 保持空串，走统一 400 */ }
  if (!username || !password) {
    return NextResponse.json({ ok: false, error: '请输入用户名和密码' }, { status: 400 });
  }
  let u;
  try {
    u = await findUserByName(username);
  } catch (e) {
    console.error('[login]', e);
    return NextResponse.json({ ok: false, error: '数据库不可用（需配置 DATABASE_URL）' }, { status: 503 });
  }
  if (!u || !verifyPassword(password, u.pwd_hash)) {
    return NextResponse.json({ ok: false, error: '用户名或密码不对' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true, username: u.username });
  setSessionCookie(res, u.id);
  return res;
}
