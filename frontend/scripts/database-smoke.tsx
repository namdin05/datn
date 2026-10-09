import assert from 'node:assert/strict';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'node:url';
import { createDb } from '../../backend/src/config/db';
import { createApp } from '../../backend/src/app';
import { readEnv } from '../../backend/src/config/env';
import { dbDashboardSchema, dbQuizSchema, teacherActorSchema, publicRoomSchema, createApiResponseSchema } from '@qforge/shared';

config({ path: fileURLToPath(new URL('../../backend/.env', import.meta.url)), quiet: true });
config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });
const url = process.env.SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const email = process.env.QFORGE_TEST_TEACHER_EMAIL;
const password = process.env.QFORGE_TEST_TEACHER_PASSWORD;
if (!url || !key || !email || !password) throw new Error('LIVE_AUTH_CONFIG_MISSING: cần Supabase URL/public key và QFORGE_TEST_TEACHER_EMAIL/PASSWORD trong env local.');
const auth = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const pool = createDb();
const server = createApp(readEnv(), { db: pool, errorLogger: () => {} }).listen(0, '127.0.0.1');
await new Promise<void>((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
const address = server.address(); assert.ok(address && typeof address !== 'string');
const base = `http://127.0.0.1:${address.port}`;
try {
  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error('LIVE_AUTH_LOGIN_FAILED');
  const headers = { Authorization: `Bearer ${data.session.access_token}` };
  const me = await fetch(base + '/api/me', { headers }); assert.equal(me.status, 200);
  const actor = createApiResponseSchema(teacherActorSchema).parse(await me.json()); assert.ok(actor.success);
  const response = await fetch(base + '/api/teacher/dashboard', { headers }); assert.equal(response.status, 200);
  const dashboard = createApiResponseSchema(dbDashboardSchema).parse(await response.json()); assert.ok(dashboard.success);
  for (const q of dashboard.data.quizzes) {
    const detail = await fetch(base + `/api/quizzes/${q.id}`, { headers }); assert.equal(detail.status, 200); createApiResponseSchema(dbQuizSchema).parse(await detail.json());
  }
  const session = dashboard.data.sessions.find(s => s.status !== 'FINISHED' && /^\d{6}$/.test(s.pin));
  if (session) {
    const room = await fetch(base + `/api/rooms/${session.pin}`); assert.equal(room.status, 200);
    const parsed = createApiResponseSchema(publicRoomSchema).parse(await room.json()); assert.ok(parsed.success);
    assert.deepEqual(Object.keys(parsed.data).sort(), ['participantCount', 'pin', 'status', 'title']);
  }
  assert.equal((await fetch(base + '/api/teacher/dashboard')).status, 401);
  assert.equal((await fetch(base + '/api/rooms/123')).status, 400);
  assert.equal((await fetch(base + '/ready')).status, 200);
  console.log(`PASS live read: Supabase login + JWT verification + Teacher mapping + ${dashboard.data.quizzes.length} owned quizzes + readiness. No business writes.`);
} finally {
  await auth.auth.signOut({ scope: 'local' });
  await new Promise<void>(resolve => { server.close(() => resolve()); server.closeAllConnections(); }); await pool.end();
}
