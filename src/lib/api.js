import { LS_KEY } from './constants.js';
import { normalize } from './tasks.js';

/* 数据访问层：云端（本服务自带 /api/tasks · Neon Postgres）优先，localStorage 兜底。
   与旧单文件版共用同一存储键 zhumo.desk.v1，数据可互相接力。
   API_BASE 默认空串＝同源（Next.js 全栈一体）；若前后端分离部署，
   设 NEXT_PUBLIC_API_BASE=https://<后端域名> 即可。 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

export async function fetchRemoteTasks() {
  try {
    const r = await fetch(`${API_BASE}/api/tasks`, { cache: 'no-store' });
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
    return r.ok;
  } catch {
    return false;
  }
}

/* localStorage 在服务端预渲染阶段不存在（Next.js 会先在 Node 里渲染一遍组件），
   因此都做环境守卫；真正的读写只发生在挂载之后的客户端。 */
export function loadTasks() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.map(normalize) : null;
  } catch {
    return null;
  }
}

export function saveTasks(tasks) {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(tasks));
    return true;
  } catch {
    return false;
  }
}
