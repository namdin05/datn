import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { JSDOM } from 'jsdom';
import { isolatedPostgres } from '../../backend/test/support/postgres';
import { createServices } from '../../backend/src/modules/application';
import { ParticipantTokens } from '../../backend/src/auth/participant';
import { createApp } from '../../backend/src/app';
import { readEnv } from '../../backend/src/config/env';
import { ApiError } from '../../backend/src/common/api-error';
import { quizInputSchema } from '@qforge/shared';

const db = await isolatedPostgres();
const secret = 'frontend-test-only-secret-32-characters';
const actor = { id: randomUUID(), name: 'Teacher', role: 'TEACHER' as const };
await db.pool.query("INSERT INTO public.users(id,display_name,role) VALUES($1,$2,'TEACHER')", [actor.id, actor.name]);
const service = createServices(db.pool, new ParticipantTokens(secret, 86400));
const quiz = await service.quizzes.save(actor, quizInputSchema.parse({ title: 'UI REST Quiz', questions: [{ content: 'Choose A', options: ['A', 'B', 'C', 'D'].map((content, i) => ({ content, isCorrect: i === 0 })) }] }));
await service.quizzes.publish(actor, quiz.id); const session = await service.sessions.host(actor, quiz.id);
const credential = await service.participants.join({ pin: session.pin, nickname: 'UI Student', requestId: randomUUID() });
const server = createApp(readEnv({ NODE_ENV: 'test', PARTICIPANT_TOKEN_HASH_SECRET: secret }), { db: db.pool, verifyTeacherToken: async () => { throw new ApiError('UNAUTHORIZED'); }, errorLogger: () => {} }).listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
const addr = server.address(); assert.ok(addr && typeof addr !== 'string');
const base = `http://127.0.0.1:${addr.port}`;
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost:5173', pretendToBeVisual: true });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, sessionStorage: dom.window.sessionStorage, localStorage: dom.window.localStorage, requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window), cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window), IS_REACT_ACT_ENVIRONMENT: true, React: await import('react') });
dom.window.scrollTo = () => {};
const { act } = await import('react'); const { createRoot } = await import('react-dom/client'); const { MemoryRouter, Routes, Route } = await import('react-router');
const { DatabaseApp } = await import('../src/features/database/DatabaseApp'); const { StudentSession } = await import('../src/features/core/CorePages');
const { requestApi, HttpApiError } = await import('../src/lib/api');
const { snapshotSchema } = await import('@qforge/shared');
const realFetch = globalThis.fetch;
let mode: 'normal' | 'malformed' | 'failure' = 'normal';
globalThis.fetch = async (url, options) => {
  if (mode === 'malformed') return new Response(JSON.stringify({ success: true, data: {} }), { status: 200 });
  if (mode === 'failure') return new Response(JSON.stringify({ success: false, error: { code: 'INVALID_INPUT', message: 'Bad input', details: [{ field: 'nickname', message: 'Required', source: 'body' }] } }), { status: 400 });
  return realFetch(base + new URL(String(url)).pathname, options);
};
const container = document.getElementById('root')!; let root = createRoot(container);
async function reset() { await act(async () => root.unmount()); root = createRoot(container); }
async function waitFor(check: () => boolean) {
  for (let i = 0; i < 200; i++) { if (check()) return; await act(async () => { await new Promise(resolve => setTimeout(resolve, 15)); }); }
  throw new Error(`UI timeout: ${container.textContent}`);
}
async function student() { await act(async () => root.render(<MemoryRouter initialEntries={[`/student/session/${session.sessionId}`]}><Routes><Route path="/student/session/:id" element={<StudentSession />} /><Route path="/join" element={<p>Join page</p>} /></Routes></MemoryRouter>)); }
try {
  await act(async () => root.render(<MemoryRouter initialEntries={['/teacher/quizzes']}><DatabaseApp /></MemoryRouter>));
  await waitFor(() => !!container.querySelector('input[type="password"]'));
  assert.match(container.textContent!, /Đăng nhập giảng viên/); assert.ok(!container.querySelector('.teacher-shell'));
  await reset();
  sessionStorage.setItem(`qforge-credential:${session.sessionId}`, JSON.stringify(credential));
  await student(); await waitFor(() => container.textContent!.includes('Đang đợi giảng viên'));
  const started = await service.sessions.action(actor, session.sessionId, 'start', 0);
  await act(async () => [...container.querySelectorAll('button')].find(b => b.textContent === 'Cập nhật phiên')!.click());
  await waitFor(() => container.querySelectorAll('input[type="radio"]').length === 4);
  await act(async () => container.querySelector<HTMLInputElement>('input[type="radio"]')!.click());
  assert.ok(![...container.querySelectorAll('button')].some(b => b.textContent === 'Gửi câu trả lời'));
  await waitFor(() => container.textContent!.includes('Đã lưu câu trả lời'));
  assert.ok(container.querySelector('fieldset')!.disabled);
  await reset(); await student(); await waitFor(() => container.textContent!.includes('Đã lưu câu trả lời'));
  assert.ok(container.querySelector('fieldset')!.disabled);
  await service.sessions.action(actor, session.sessionId, 'finish', started.stateVersion);
  await act(async () => [...container.querySelectorAll('button')].find(b => b.textContent === 'Cập nhật phiên')!.click());
  await waitFor(() => container.textContent!.includes('Accuracy: 100%'));
  assert.match(container.textContent!, /Điểm: 100/);
  await reset(); await student(); await waitFor(() => container.textContent!.includes('Accuracy: 100%'));
  await act(async () => [...container.querySelectorAll('button')].find(b => b.textContent === 'Rời phiên')!.click());
  await waitFor(() => sessionStorage.getItem(`qforge-credential:${session.sessionId}`) === null);
  assert.equal((await realFetch(base + `/api/participants/sessions/${session.sessionId}`, { headers: { Authorization: `Bearer ${credential.token}` } })).status, 401);
  mode = 'malformed'; await assert.rejects(requestApi('/test', snapshotSchema), /contract/);
  mode = 'failure'; await assert.rejects(requestApi('/test', snapshotSchema), error => error instanceof HttpApiError && error.status === 400 && error.error.details?.[0]?.field === 'nickname');
  console.log('PASS: protected Teacher route, REST Student lobby/submit, refresh preserves hasAnswered, final result, credential revocation, malformed response and field errors.');
} finally {
  await act(async () => root.unmount()); dom.window.close(); globalThis.fetch = realFetch;
  await new Promise<void>(resolve => { server.close(() => resolve()); server.closeAllConnections(); }); await db.close();
}
