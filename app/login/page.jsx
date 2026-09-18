import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm.jsx';
import { uidFromToken, COOKIE_NAME } from '../../lib/auth.js';

export const dynamic = 'force-dynamic';

/* 已登录者访问 /login → 直接回主页 */
export default async function LoginPage() {
  const jar = await cookies();
  if (uidFromToken(jar.get(COOKIE_NAME)?.value)) redirect('/');
  return <LoginForm />;
}
