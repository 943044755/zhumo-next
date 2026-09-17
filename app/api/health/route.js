import { storeMode } from '../../../lib/store.js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/* GET /api/health → { ok, store }  store: 'neon' | 'file' */
export async function GET() {
  return Response.json({ ok: true, store: storeMode() });
}
