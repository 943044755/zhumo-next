import fs from 'node:fs/promises';
import path from 'node:path';
import { getPool, ensureSchema } from './db.js';

/* 任务存储层，双模式：
 * 1) 配置了 DATABASE_URL → Neon Postgres（zhumo_tasks，按 user_id 隔离，一任务一行，data jsonb）
 * 2) 未配置 → 本地 JSON 文件 data/tasks.json（仅本地开发；文件模式无用户隔离，
 *    且用户体系（注册/登录）需要数据库，未配库时认证路由会以 503 提示）
 */

const USE_NEON = !!process.env.DATABASE_URL;
const DATA_FILE = path.join(process.cwd(), 'data', 'tasks.json');

/* 内存兜底：文件系统只读（如未配库就部署）时，实例存活期内仍可读写 */
let memStore = null;

export function storeMode() {
  return USE_NEON ? 'neon' : 'file';
}

/* —— Neon（按用户隔离） —— */
async function neonGet(userId) {
  await ensureSchema();
  const r = await getPool().query(
    'SELECT data FROM zhumo_tasks WHERE user_id = $1 ORDER BY idx ASC',
    [userId]
  );
  return r.rows.map((x) => x.data);
}

async function neonSaveAll(userId, tasks) {
  await ensureSchema();
  const c = await getPool().connect();
  try {
    await c.query('BEGIN');
    await c.query('DELETE FROM zhumo_tasks WHERE user_id = $1', [userId]);
    for (let i = 0; i < tasks.length; i++) {
      await c.query(
        'INSERT INTO zhumo_tasks (id, user_id, idx, data) VALUES ($1, $2, $3, $4)',
        [String(tasks[i].id ?? 'row' + i), userId, i, JSON.stringify(tasks[i])]
      );
    }
    await c.query('COMMIT');
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    c.release();
  }
}

/* —— 本地文件（开发模式，无用户隔离） —— */
async function fileGet() {
  try {
    const a = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
    return Array.isArray(a) ? a : [];
  } catch {
    return memStore ?? [];
  }
}

async function fileSaveAll(tasks) {
  memStore = tasks;
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 2));
  } catch (e) {
    console.warn('[zhumo-api] 文件写入失败（只读文件系统？），数据仅保留在内存：', e.message);
  }
  return true;
}

/* —— 对外接口（uid 由会话层给出；文件模式下忽略 uid） —— */
export async function getTasks(uid) {
  return USE_NEON ? neonGet(uid) : fileGet();
}

export async function saveAllTasks(uid, tasks) {
  return USE_NEON ? neonSaveAll(uid, tasks) : fileSaveAll(tasks);
}

/* 轻校验：与前端数据模型的最低约定一致（title、due 必有），其余字段由前端 normalize 负责 */
export function sanitizeTasks(input) {
  if (!Array.isArray(input)) return null;
  const out = [];
  for (const t of input.slice(0, 2000)) {
    if (t && typeof t === 'object' && typeof t.title === 'string' && t.title && typeof t.due === 'string' && t.due) {
      out.push(t);
    }
  }
  return out;
}
