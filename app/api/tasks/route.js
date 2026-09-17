import { getTasks, saveAllTasks, sanitizeTasks, storeMode } from '../../../lib/store.js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/* CORS：开发时前端(5173)直连本地(3000)；生产可用 ALLOWED_ORIGINS 限定来源（逗号分隔），未设置则放开 */
function corsHeaders(req) {
  const allow = process.env.ALLOWED_ORIGINS;
  let origin = '*';
  if (allow) {
    const list = allow.split(',').map((s) => s.trim()).filter(Boolean);
    const reqOrigin = req.headers.get('origin') || '';
    if (list.includes(reqOrigin)) origin = reqOrigin;
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export async function OPTIONS(req) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

/* GET /api/tasks → 任务数组（与前端整表快照模型一致，按保存顺序返回） */
export async function GET(req) {
  try {
    const tasks = await getTasks();
    return Response.json(tasks, { headers: corsHeaders(req) });
  } catch (e) {
    console.error('[GET /api/tasks]', e);
    return Response.json({ error: '读取失败' }, { status: 500, headers: corsHeaders(req) });
  }
}

/* PUT /api/tasks ← 任务数组（整表替换，事务写入） */
export async function PUT(req) {
  try {
    const body = await req.json().catch(() => null);
    const tasks = sanitizeTasks(body);
    if (tasks === null) {
      return Response.json({ error: '请求体应为任务数组' }, { status: 400, headers: corsHeaders(req) });
    }
    await saveAllTasks(tasks);
    return Response.json({ ok: true, count: tasks.length, store: storeMode() }, { headers: corsHeaders(req) });
  } catch (e) {
    console.error('[PUT /api/tasks]', e);
    return Response.json({ error: '写入失败' }, { status: 500, headers: corsHeaders(req) });
  }
}
