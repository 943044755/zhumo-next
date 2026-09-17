/* 存储层：双模式
 * 1) 配置了 DATABASE_URL → Neon Postgres（zhumo_tasks 表，一任务一行，data jsonb）
 * 2) 未配置 → 本地 JSON 文件 data/tasks.json（仅限本地开发；Vercel 上请务必配置 DATABASE_URL）
 *
 * Neon 建库：https://neon.tech → Create project → 复制 connection string。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const USE_NEON = !!process.env.DATABASE_URL;
const DATA_FILE = path.join(process.cwd(), 'data', 'tasks.json');

/* 内存兜底：文件系统只读（如未配库就部署到 Vercel）时，实例存活期内仍可读写 */
let memStore = null;

let pool = null;
let tableReady = null;

function getPool() {
  if (!pool) {
    const cs = process.env.DATABASE_URL;
    const needSsl = /neon\.tech|sslmode=require/.test(cs);
    pool = new pg.Pool({ connectionString: cs, ssl: needSsl ? { rejectUnauthorized: false } : undefined, max: 3 });
  }
  return pool;
}

async function ensureTable() {
  if (!tableReady) {
    tableReady = getPool().query(
      'CREATE TABLE IF NOT EXISTS zhumo_tasks (id text PRIMARY KEY, idx int NOT NULL, data jsonb NOT NULL)'
    );
  }
  await tableReady;
}

/* —— Neon —— */
async function neonGet() {
  await ensureTable();
  const r = await getPool().query('SELECT data FROM zhumo_tasks ORDER BY idx ASC');
  return r.rows.map((x) => x.data);
}

async function neonSaveAll(tasks) {
  await ensureTable();
  const c = await getPool().connect();
  try {
    await c.query('BEGIN');
    await c.query('DELETE FROM zhumo_tasks');
    for (let i = 0; i < tasks.length; i++) {
      await c.query(
        'INSERT INTO zhumo_tasks (id, idx, data) VALUES ($1, $2, $3)',
        [String(tasks[i].id ?? 'row' + i), i, JSON.stringify(tasks[i])]
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

/* —— 本地文件（开发模式） —— */
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

/* —— 对外接口 —— */
export function storeMode() {
  return USE_NEON ? 'neon' : 'file';
}

export async function getTasks() {
  return USE_NEON ? neonGet() : fileGet();
}

export async function saveAllTasks(tasks) {
  return USE_NEON ? neonSaveAll(tasks) : fileSaveAll(tasks);
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
