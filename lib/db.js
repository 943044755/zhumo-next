import pg from 'pg';

/* Neon Postgres 连接与建表（users + tasks）。未配置 DATABASE_URL 时 getPool 不会被调用，
   存储层自动降级为本地文件模式（无用户体系，仅限本地开发）。 */

let pool = null;

export function getPool() {
  if (!pool) {
    const cs = process.env.DATABASE_URL;
    const needSsl = /neon\.tech|sslmode=require/.test(cs);
    pool = new pg.Pool({ connectionString: cs, ssl: needSsl ? { rejectUnauthorized: false } : undefined, max: 3 });
  }
  return pool;
}

let schemaReady = null;

export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const p = getPool();
      /* 任务表：既有部署可能没有 user_id 列，用 ALTER 兼容补齐（旧行归入 'default'） */
      await p.query('CREATE TABLE IF NOT EXISTS zhumo_tasks (id text PRIMARY KEY, idx int NOT NULL, data jsonb NOT NULL)');
      await p.query("ALTER TABLE zhumo_tasks ADD COLUMN IF NOT EXISTS user_id text NOT NULL DEFAULT 'default'");
      await p.query('CREATE INDEX IF NOT EXISTS zhumo_tasks_user_idx ON zhumo_tasks (user_id, idx)');
      /* 用户表：role 预留后台管理（'user' | 'admin'）；邀请码表待后台管理路由上线时再建 */
      await p.query(`CREATE TABLE IF NOT EXISTS zhumo_users (
        id text PRIMARY KEY,
        username text NOT NULL UNIQUE,
        pwd_hash text NOT NULL,
        role text NOT NULL DEFAULT 'user',
        created_at timestamptz NOT NULL DEFAULT now()
      )`);
    })();
  }
  return schemaReady;
}
