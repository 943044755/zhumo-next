import { normalize } from './tasks.js';

/* 数据访问层：云端（本服务自带 /api/tasks · Neon Postgres，按用户隔离）为唯一事实源，
   localStorage 只是**按用户隔离**的本机缓存（键由 App 层拼入用户名）。
   API_BASE 默认空串＝同源（Next.js 全栈一体）；若前后端分离部署，
   设 NEXT_PUBLIC_API_BASE=https://<后端域名> 即可。 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

/* 会话失效（未登录 / 会话过期）→ 统一回登录页 */
let redirectingToLogin = false;
function on401() {
  if (redirectingToLogin || typeof window === 'undefined') return;
  redirectingToLogin = true;
  window.location.assign('/login');
}

export async function fetchRemoteTasks() {
  try {
    const r = await fetch(`${API_BASE}/api/tasks`, { cache: 'no-store' });
    if (r.status === 401) { on401(); return null; }
    if (!r.ok) return null;
    const data = await r.json();
    if (!Array.isArray(data)) return null;
    return data.map(normalize);
  } catch {
    return null;
  }
}

export async function pushRemoteTasks(tasks) {
  try {
    const r = await fetch(`${API_BASE}/api/tasks`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tasks),
    });
    if (r.status === 401) { on401(); return false; }
    return r.ok;
  } catch {
    return false;
  }
}

/* 本机缓存读写。key 必须含用户名（App 层用 `LS_KEY + ':' + user`），
   同一浏览器多账号互不可见。localStorage 在服务端预渲染阶段不存在，故有环境守卫。 */
export function loadTasks(key) {
  if (!key || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.map(normalize) : null;
  } catch {
    return null;
  }
}

export function saveTasks(key, tasks) {
  if (!key || typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(tasks));
    return true;
  } catch {
    return false;
  }
}
