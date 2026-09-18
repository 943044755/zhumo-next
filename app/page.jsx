import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import App from '../src/App.jsx';
import { uidFromToken, COOKIE_NAME } from '../lib/auth.js';
import { findUserById } from '../lib/users.js';

/* 服务端守卫：会话无效或用户已不存在（被删号）→ 302 到 /login */
export const dynamic = 'force-dynamic';

export default async function Page() {
  const jar = await cookies();
  const uid = uidFromToken(jar.get(COOKIE_NAME)?.value);
  if (!uid) redirect('/login');
  let user = null;
  try {
    user = await findUserById(uid);
  } catch (e) {
    console.error('[page] 查询用户失败', e);
  }
  if (!user) redirect('/login');
  return <App user={user.username} />;
}
