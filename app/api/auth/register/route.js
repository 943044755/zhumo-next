import { NextResponse } from 'next/server';
import { createUser, validateUsername, validatePassword, countUsers } from '../../../../lib/users.js';
import { setSessionCookie } from '../../../../lib/auth.js';
import { getPool, ensureSchema } from '../../../../lib/db.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* 预留：邀请码注册。后台管理路由上线后：
 * 1) 把 INVITE_REQUIRED 改为 true；
 * 2) 在 TODO 处校验请求体里的 inviteCode（查邀请码表 → 标记已用 → 记录发给谁），
 *    并给 zhumo_users 补 invited_by 列（ALTER TABLE ... ADD COLUMN IF NOT EXISTS）。
 * 注册接口本身已把「用户名/密码校验 → 建用户 → 首个用户继承旧数据 → 种会话」串好，
 * 到时只需在中间插入一道邀请码关卡。 */
const INVITE_REQUIRED = false;

/* POST /api/auth/register { username, password } → 建号并直接登录 */
export async function POST(req) {
  let username = '', password = '', inviteCode = '';
  try {
    const b = await req.json();
    username = String(b?.username ?? '').trim();
    password = String(b?.password ?? '');
    inviteCode = String(b?.inviteCode ?? '').trim();
  } catch { /* 保持空串，走统一校验提示 */ }
  if (!validateUsername(username)) {
    return NextResponse.json({ ok: false, error: '用户名需 2-24 位（中文、字母、数字、下划线）' }, { status: 400 });
  }
  if (!validatePassword(password)) {
    return NextResponse.json({ ok: false, error: '密码至少 6 位（至多 72 位）' }, { status: 400 });
  }
  if (INVITE_REQUIRED && !inviteCode) {
    return NextResponse.json({ ok: false, error: '需要邀请码才能注册' }, { status: 403 });
  }

  let before;
  try {
    before = await countUsers();
  } catch (e) {
    console.error('[register]', e);
    return NextResponse.json({ ok: false, error: '数据库不可用（需配置 DATABASE_URL）' }, { status: 503 });
  }
  const created = await createUser(username, password);
  if (created.error) {
    return NextResponse.json({ ok: false, error: created.error }, { status: 409 });
  }
  if (INVITE_REQUIRED) {
    /* TODO(邀请码): 校验并消费 inviteCode，写 invited_by = 发码管理员 id */
  }

  /* 首个注册用户继承云端已有任务（历史上 user_id='default' 的数据） */
  if (before === 0) {
    await ensureSchema();
    await getPool().query("UPDATE zhumo_tasks SET user_id = $1 WHERE user_id = 'default'", [created.id]);
  }

  const res = NextResponse.json({ ok: true, username: created.username });
  setSessionCookie(res, created.id);
  return res;
}
