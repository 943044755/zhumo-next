import crypto from 'node:crypto';
import { getPool, ensureSchema } from './db.js';

/* 用户表访问：scrypt 加盐哈希（node 内置，零依赖），比较恒定时长。
   用户体系依赖 DATABASE_URL（Neon）；未配置时路由层会以 503 明确提示。 */

const scrypt = (pw, salt) => crypto.scryptSync(String(pw), salt, 64);

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('base64url');
  return 's1.' + salt + '.' + scrypt(pw, salt).toString('base64url');
}

export function verifyPassword(pw, stored) {
  try {
    const [v, salt, h] = String(stored).split('.');
    if (v !== 's1' || !salt || !h) return false;
    const a = Buffer.from(h, 'base64url');
    const b = scrypt(pw, salt);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function validateUsername(u) {
  return typeof u === 'string' && /^[a-zA-Z0-9_一-龥]{2,24}$/.test(u);
}

export function validatePassword(p) {
  return typeof p === 'string' && p.length >= 6 && p.length <= 72;
}

export async function createUser(username, password) {
  await ensureSchema();
  const id = crypto.randomUUID();
  try {
    await getPool().query(
      'INSERT INTO zhumo_users (id, username, pwd_hash) VALUES ($1, $2, $3)',
      [id, username, hashPassword(password)]
    );
  } catch (e) {
    if (String(e.code) === '23505' || /duplicate key/i.test(String(e.message))) {
      return { error: '用户名已被占用' };
    }
    throw e;
  }
  return { id, username };
}

export async function findUserByName(username) {
  await ensureSchema();
  const r = await getPool().query(
    'SELECT id, username, pwd_hash, role FROM zhumo_users WHERE username = $1',
    [username]
  );
  return r.rows[0] || null;
}

export async function findUserById(id) {
  await ensureSchema();
  const r = await getPool().query(
    'SELECT id, username, role FROM zhumo_users WHERE id = $1',
    [id]
  );
  return r.rows[0] || null;
}

export async function countUsers() {
  await ensureSchema();
  const r = await getPool().query('SELECT count(*)::int AS n FROM zhumo_users');
  return r.rows[0].n;
}
