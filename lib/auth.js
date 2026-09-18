import crypto from 'node:crypto';

/* 会话：HMAC 签名的无状态 Cookie（v2，绑定用户 id），30 天。
   签名密钥来自 AUTH_SECRET（.env 随机值）；未设置时从 DATABASE_URL 派生并告警——
   换密钥 = 全部会话失效。用户删除后由页面层查库使会话作废（见 app/page.jsx）。 */

export const COOKIE_NAME = 'zhumo_session';
const SESSION_DAYS = 30;

let warned = false;
function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) {
    if (!warned) {
      warned = true;
      console.warn('[zhumo-auth] 未设置 AUTH_SECRET，签名密钥退化为从 DATABASE_URL 派生；建议在 .env 配置随机值');
    }
    return crypto.createHash('sha256').update('zhumo-desk-auth:derive:' + (process.env.DATABASE_URL || 'no-db')).digest();
  }
  return crypto.createHash('sha256').update('zhumo-desk-auth:' + s).digest();
}

export function makeToken(uid, days = SESSION_DAYS) {
  const body = `v2.${uid}.${Date.now() + days * 86400000}`;
  return body + '.' + crypto.createHmac('sha256', secret()).update(body).digest('base64url');
}

export function uidFromToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 4 || parts[0] !== 'v2' || !parts[1]) return null;
  const exp = Number(parts[2]);
  if (!Number.isFinite(exp) || exp < Date.now()) return null;
  const want = crypto.createHmac('sha256', secret()).update(`v2.${parts[1]}.${parts[2]}`).digest('base64url');
  const a = Buffer.from(parts[3]);
  const b = Buffer.from(want);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return parts[1];
}

/* Route handler 用：req.cookies（NextRequest） */
export function sessionUid(req) {
  return uidFromToken(req.cookies?.get?.(COOKIE_NAME)?.value);
}

export function setSessionCookie(res, uid) {
  res.cookies.set(COOKIE_NAME, makeToken(uid), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 86400,
    secure: process.env.NODE_ENV === 'production',
  });
}

export function clearSessionCookie(res) {
  res.cookies.set(COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
}
