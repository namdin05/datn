import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { calculateResult, snapshotSchema, participantCredentialSchema, quizInputSchema, applySnapshot } from '@qforge/shared';
import type { TeacherActor } from '@qforge/shared';
import { createServices } from '../src/modules/application.js';
import { ParticipantTokens } from '../src/auth/participant.js';
import { createTeacherVerifier } from '../src/auth/teacher.js';
import { createApp } from '../src/app.js';
import { readEnv } from '../src/config/env.js';
import { isolatedPostgres } from './support/postgres.js';

const secret = 'test-only-participant-secret-32-characters';
const a: TeacherActor = { id: '00000000-0000-4000-8000-000000000001', name: 'Teacher A', role: 'TEACHER' };
const b: TeacherActor = { id: '00000000-0000-4000-8000-000000000002', name: 'Teacher B', role: 'TEACHER' };
const input = (count = 5) => quizInputSchema.parse({ title: 'REST Quiz', questions: Array.from({ length: count }, (_, i) => ({ content: `Question ${i + 1}`, options: ['A', 'B', 'C', 'D'].map((content, j) => ({ content, isCorrect: j === 0 })) })) });
async function setup() {
  const db = await isolatedPostgres();
  for (const actor of [a, b]) await db.pool.query('INSERT INTO public.users(id,display_name,role,auth_user_id) VALUES($1,$2,$3,$1)', [actor.id, actor.name, actor.role]);
  return { ...db, service: createServices(db.pool, new ParticipantTokens(secret, 86400)) };
}
function hasCode(code: string) { return (error: unknown) => (error as { code?: string }).code === code; }

test('PostgreSQL: draft, publish rules, ownership, atomic rollback, historical edit/delete lock', async () => {
  const db = await setup();
  try {
    const draft = await db.service.quizzes.save(a, input());
    await assert.rejects(db.service.quizzes.get(b, draft.id), hasCode('NOT_FOUND'));
    await assert.rejects(db.service.quizzes.publish(b, draft.id), hasCode('NOT_FOUND'));
    await assert.rejects(db.service.quizzes.delete(b, draft.id), hasCode('NOT_FOUND'));
    const blank = input(1); blank.questions[0]!.content = ''; blank.questions[0]!.options[0]!.content = '';
    const incomplete = await db.service.quizzes.save(a, blank);
    await assert.rejects(db.service.quizzes.publish(a, incomplete.id), hasCode('INVALID_INPUT'));
    const empty = await db.service.quizzes.save(a, input(0));
    await assert.rejects(db.service.quizzes.publish(a, empty.id), hasCode('INVALID_INPUT'));
    const twoCorrect = input(1); twoCorrect.questions[0]!.options[1]!.isCorrect = true;
    const bad = await db.service.quizzes.save(a, twoCorrect);
    await assert.rejects(db.service.quizzes.publish(a, bad.id), hasCode('INVALID_INPUT'));
    for (const n of [3, 5]) assert.equal(quizInputSchema.safeParse({ ...input(1), questions: [{ content: 'Bad', options: Array.from({ length: n }, () => ({ content: 'x', isCorrect: false })) }] }).success, false);
    db.failNext('INSERT INTO public.question_options');
    await assert.rejects(db.service.quizzes.save(a, { ...input(), title: 'Must rollback' }, draft.id));
    assert.equal((await db.service.quizzes.get(a, draft.id)).title, 'REST Quiz');
    assert.equal((await db.service.quizzes.get(a, draft.id)).questions.length, 5);
    await db.service.quizzes.publish(a, draft.id);
    await db.service.sessions.host(a, draft.id);
    await assert.rejects(db.service.quizzes.save(a, input(), draft.id), hasCode('CONFLICT'));
    await assert.rejects(db.service.quizzes.delete(a, draft.id), hasCode('CONFLICT'));
    await db.service.quizzes.delete(a, incomplete.id);
    await assert.rejects(db.service.quizzes.get(a, incomplete.id), hasCode('NOT_FOUND'));
  } finally { await db.close(); }
});

test('PostgreSQL: host/join/retry/start/answer/finish -> 300 points, 60%, resume without leaking answers', async () => {
  const db = await setup();
  try {
    const quiz = await db.service.quizzes.save(a, input()); await db.service.quizzes.publish(a, quiz.id);
    const session = await db.service.sessions.host(a, quiz.id); assert.match(session.pin, /^\d{6}$/);
    const join = { pin: session.pin, nickname: 'Student', requestId: randomUUID() };
    const c = participantCredentialSchema.parse(await db.service.participants.join(join));
    const retry = await db.service.participants.join(join); assert.deepEqual(retry, c);
    const other = await db.service.participants.join({ ...join, requestId: randomUUID() }); assert.notEqual(other.participantId, c.participantId);
    assert.equal((await db.pool.query('SELECT count(*)::int AS n FROM public.participants WHERE session_id=$1', [session.sessionId])).rows[0].n, 2);
    const stored = (await db.pool.query('SELECT token_hash FROM public.participants WHERE id=$1', [c.participantId])).rows[0].token_hash;
    assert.notEqual(stored, c.token); assert.match(stored, /^[a-f0-9]{64}$/);
    await assert.rejects(db.service.sessions.snapshot(b, session.sessionId), hasCode('NOT_FOUND'));
    let host = await db.service.sessions.action(a, session.sessionId, 'start', 0);
    await assert.rejects(db.service.sessions.action(a, session.sessionId, 'start', 0), hasCode('CONFLICT'));
    await assert.rejects(db.service.participants.join({ ...join, requestId: randomUUID() }), hasCode('CONFLICT'));
    assert.deepEqual(await db.service.participants.join(join), c);
    for (let i = 0; i < 4; i++) {
      const before = snapshotSchema.parse(await db.service.participants.snapshot(c.sessionId, c.token));
      const q = before.currentQuestion!;
      assert.ok(!JSON.stringify(before).includes('isCorrect')); assert.ok(!JSON.stringify(before).includes('correctOption'));
      const answerId = q.options[i < 3 ? 0 : 1]!.id;
      const settled = await Promise.allSettled([db.service.answers.submit(c.sessionId, c.token, q.id, answerId), db.service.answers.submit(c.sessionId, c.token, q.id, answerId)]);
      for (const result of settled) { if (result.status === 'rejected') throw result.reason; assert.equal(result.value.hasAnsweredCurrentQuestion, true); }
      assert.equal((await db.service.participants.snapshot(c.sessionId, c.token)).hasAnsweredCurrentQuestion, true);
      await assert.rejects(db.service.answers.submit(c.sessionId, c.token, q.id, q.options[2]!.id), hasCode('CONFLICT'));
      host = await db.service.sessions.action(a, c.sessionId, 'next', host.stateVersion);
    }
    host = await db.service.sessions.action(a, c.sessionId, 'finish', host.stateVersion);
    const final = snapshotSchema.parse(await db.service.participants.snapshot(c.sessionId, c.token));
    assert.deepEqual(final.result, { total: 5, correct: 3, incorrect: 1, unanswered: 1, score: 300, accuracy: 60 });
    assert.deepEqual(host.participants.find(p => p.id === c.participantId)?.result, final.result);
    const attempt = (await db.pool.query('SELECT * FROM public.attempts WHERE participant_id=$1', [c.participantId])).rows[0];
    assert.equal(attempt.session_score, 300); assert.equal(attempt.answered_count, 4); assert.equal(attempt.status, 'SUBMITTED');
    assert.equal((await db.pool.query('SELECT count(*)::int AS n FROM public.answers WHERE attempt_id=$1', [attempt.id])).rows[0].n, 4);
    await db.service.participants.revoke(c.sessionId, c.token); await assert.rejects(db.service.participants.snapshot(c.sessionId, c.token), hasCode('UNAUTHORIZED'));
  } finally { await db.close(); }
});

test('PostgreSQL: cross-room credentials, expired credentials, wrong question/option and early finish', async () => {
  const db = await setup();
  try {
    const q = await db.service.quizzes.save(a, input(2)); await db.service.quizzes.publish(a, q.id);
    const s = await db.service.sessions.host(a, q.id); const second = await db.service.sessions.host(a, q.id);
    const c = await db.service.participants.join({ pin: s.pin, nickname: 'Student', requestId: randomUUID() });
    await assert.rejects(db.service.participants.snapshot(second.sessionId, c.token), hasCode('UNAUTHORIZED'));
    const started = await db.service.sessions.action(a, s.sessionId, 'start', 0);
    await assert.rejects(db.service.answers.submit(s.sessionId, c.token, q.questions[1]!.id, q.questions[1]!.options[0]!.id), hasCode('CONFLICT'));
    await assert.rejects(db.service.answers.submit(s.sessionId, c.token, q.questions[0]!.id, q.questions[1]!.options[0]!.id), hasCode('CONFLICT'));
    await db.service.sessions.action(a, s.sessionId, 'finish', started.stateVersion);
    assert.deepEqual((await db.service.participants.snapshot(s.sessionId, c.token)).result, calculateResult(2, 0, 0));
    await db.pool.query("UPDATE public.participants SET token_expires_at=now()-interval '1 second' WHERE id=$1", [c.participantId]);
    await assert.rejects(db.service.participants.snapshot(s.sessionId, c.token), hasCode('UNAUTHORIZED'));
  } finally { await db.close(); }
});

test('PostgreSQL: cross-module start, answer and finish failures roll back the entire use case', async () => {
  const db = await setup();
  try {
    const quiz = await db.service.quizzes.save(a, input(1));
    await db.service.quizzes.publish(a, quiz.id);
    const session = await db.service.sessions.host(a, quiz.id);
    const credential = await db.service.participants.join({ pin: session.pin, nickname: 'Student', requestId: randomUUID() });

    db.failNext('INSERT INTO public.attempts');
    await assert.rejects(db.service.sessions.action(a, session.sessionId, 'start', 0));
    const waiting = await db.service.sessions.snapshot(a, session.sessionId);
    assert.equal(waiting.status, 'WAITING');
    assert.equal(waiting.stateVersion, 0);
    assert.equal((await db.pool.query('SELECT status FROM public.participants WHERE id=$1', [credential.participantId])).rows[0].status, 'JOINED');

    const started = await db.service.sessions.action(a, session.sessionId, 'start', 0);
    const question = (await db.service.participants.snapshot(credential.sessionId, credential.token)).currentQuestion!;
    db.failNext('UPDATE public.attempts SET correct_count');
    await assert.rejects(db.service.answers.submit(credential.sessionId, credential.token, question.id, question.options[0]!.id));
    assert.equal((await db.pool.query('SELECT count(*)::int AS n FROM public.answers')).rows[0].n, 0);
    assert.equal((await db.pool.query('SELECT count(*)::int AS n FROM public.answer_options')).rows[0].n, 0);
    assert.equal((await db.service.participants.snapshot(credential.sessionId, credential.token)).hasAnsweredCurrentQuestion, false);
    await db.service.answers.submit(credential.sessionId, credential.token, question.id, question.options[0]!.id);

    db.failNext("UPDATE public.participants SET status='COMPLETED'");
    await assert.rejects(db.service.sessions.action(a, session.sessionId, 'finish', started.stateVersion));
    const active = await db.service.sessions.snapshot(a, session.sessionId);
    assert.equal(active.status, 'ACTIVE');
    assert.equal(active.stateVersion, started.stateVersion);
    assert.equal((await db.pool.query('SELECT status FROM public.attempts WHERE participant_id=$1', [credential.participantId])).rows[0].status, 'IN_PROGRESS');
    await db.service.sessions.action(a, session.sessionId, 'finish', started.stateVersion);
    // Retry after finish still returns the existing answer without awarding again.
    const final = await db.service.answers.submit(credential.sessionId, credential.token, question.id, question.options[0]!.id);
    assert.deepEqual(final.result, calculateResult(1, 1, 0));
  } finally { await db.close(); }
});

test('PostgreSQL: seeds applied twice preserve counts and 5-question fixture', async () => {
  const db = await setup();
  try {
    const { readFile } = await import('node:fs/promises');
    const seeds = await Promise.all(['001_demo_seed.sql', '002_s04_demo.sql'].map(name => readFile(new URL(`../../database/seeds/${name}`, import.meta.url), 'utf8')));
    const counts = async () => (await db.pool.query('SELECT (SELECT count(*) FROM public.users) AS users,(SELECT count(*) FROM public.quizzes) AS quizzes,(SELECT count(*) FROM public.questions) AS questions,(SELECT count(*) FROM public.question_options) AS options')).rows[0];
    for (const sql of seeds) await db.engine.exec(sql);
    const before = await counts();
    for (const sql of seeds) await db.engine.exec(sql);
    assert.deepEqual(await counts(), before);
    const result = (await db.pool.query("SELECT q.id FROM public.questions q WHERE quiz_id='10000000-0000-0000-0000-000000000004' AND (SELECT count(*) FROM public.question_options WHERE question_id=q.id)=4 AND (SELECT count(*) FROM public.question_options WHERE question_id=q.id AND is_correct)=1")).rows;
    assert.equal(result.length, 5);
  } finally { await db.close(); }
});

test('JWT + HTTP: verify signature/issuer/audience/expiry, DB Teacher mapping, ownership and dev bypass disabled', async context => {
  const db = await setup(); context.after(() => db.close());
  const { publicKey, privateKey } = await generateKeyPair('ES256');
  const jwk = { ...await exportJWK(publicKey), kid: 'test-key', alg: 'ES256', use: 'sig' };
  const jwks = createServer((_req, res) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ keys: [jwk] })); });
  await new Promise<void>(resolve => jwks.listen(0, '127.0.0.1', resolve));
  context.after(() => new Promise<void>(resolve => { jwks.close(() => resolve()); jwks.closeAllConnections(); }));
  const address = jwks.address(); assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}`; const issuer = `${url}/auth/v1`;
  const sign = (subject = a.id, iss = issuer, aud = 'authenticated', exp = '1h') => new SignJWT({ role: 'authenticated' }).setProtectedHeader({ alg: 'ES256', kid: 'test-key' }).setSubject(subject).setIssuer(iss).setAudience(aud).setIssuedAt().setExpirationTime(exp).sign(privateKey);
  const verify = createTeacherVerifier(url);
  const good = await sign(); assert.equal(await verify(good), a.id);
  for (const bad of [await sign(a.id, 'https://wrong.invalid'), await sign(a.id, issuer, 'wrong'), await sign(a.id, issuer, 'authenticated', '-1h'), good.slice(0, -10) + 'tampered00']) await assert.rejects(verify(bad), hasCode('UNAUTHORIZED'));
  const app = createApp(readEnv({ NODE_ENV: 'test', SUPABASE_URL: url, PARTICIPANT_TOKEN_HASH_SECRET: secret }), { db: db.pool, errorLogger: () => {} });
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  context.after(() => new Promise<void>(resolve => { server.close(() => resolve()); server.closeAllConnections(); }));
  const apiAddress = server.address(); assert.ok(apiAddress && typeof apiAddress !== 'string'); const api = `http://127.0.0.1:${apiAddress.port}`;
  assert.equal((await fetch(`${api}/api/me`)).status, 401);
  assert.equal((await fetch(`${api}/api/me`, { headers: { Authorization: `Bearer ${await sign(randomUUID())}` } })).status, 403);
  await db.pool.query("UPDATE public.users SET role='STUDENT' WHERE id=$1", [b.id]);
  assert.equal((await fetch(`${api}/api/me`, { headers: { Authorization: `Bearer ${await sign(b.id)}` } })).status, 403);
  const me = await fetch(`${api}/api/me`, { headers: { Authorization: `Bearer ${good}` } }); assert.equal(me.status, 200); assert.deepEqual((await me.json()).data, a);
  assert.equal((await fetch(`${api}/api/dev/dashboard`)).status, 404);
  assert.equal((await fetch(`${api}/api/rooms/123`)).status, 400);
  const created = await fetch(`${api}/api/quizzes`, { method: 'POST', headers: { Authorization: `Bearer ${good}`, 'Content-Type': 'application/json' }, body: JSON.stringify(input(1)) }); assert.equal(created.status, 201);
  const quiz = (await created.json()).data;
  assert.equal((await fetch(`${api}/api/quizzes/${quiz.id}`)).status, 401);
  assert.equal((await fetch(`${api}/api/quizzes`, { method: 'POST', headers: { Authorization: `Bearer ${good}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input(1), creatorId: b.id }) })).status, 400);
  // Exercise the split HTTP adapters together, including their auth boundaries.
  async function request(path: string, method: string, body?: unknown, token?: string) {
    const response = await fetch(api + path, {
      method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, envelope: await response.json() };
  }
  assert.equal((await request(`/api/quizzes/${quiz.id}`, 'PUT', { ...input(1), title: 'Updated' }, good)).status, 200);
  assert.equal((await request(`/api/quizzes/${quiz.id}/publish`, 'POST', undefined, good)).status, 200);
  const hosted = await request('/api/sessions', 'POST', { quizId: quiz.id }, good);
  assert.equal(hosted.status, 201);
  const sessionId = hosted.envelope.data.sessionId;
  const joined = await request('/api/sessions/join', 'POST', { pin: hosted.envelope.data.pin, nickname: 'HTTP Student', requestId: randomUUID() });
  assert.equal(joined.status, 201);
  const guest = participantCredentialSchema.parse(joined.envelope.data);
  assert.equal((await request(`/api/sessions/${sessionId}/snapshot`, 'GET', undefined, guest.token)).status, 401);
  assert.equal((await request(`/api/participants/sessions/${sessionId}`, 'GET', undefined, good)).status, 401);
  await db.pool.query("UPDATE public.users SET role='TEACHER' WHERE id=$1", [b.id]);
  assert.equal((await request(`/api/teacher/sessions/${sessionId}`, 'GET', undefined, await sign(b.id))).status, 404);
  assert.equal((await request(`/api/sessions/${sessionId}/actions`, 'POST', { action: 'start', expectedVersion: 0 }, good)).status, 200);
  const snapshot = await request(`/api/participants/sessions/${sessionId}`, 'GET', undefined, guest.token);
  const question = snapshotSchema.parse(snapshot.envelope.data).currentQuestion!;
  assert.ok(!JSON.stringify(snapshot.envelope).includes('isCorrect'));
  assert.deepEqual(Object.keys(snapshot.envelope.data.participant).sort(), ['id', 'nickname']);
  assert.equal((await request(`/api/participants/sessions/${sessionId}/answers`, 'POST', { questionId: question.id, selectedOptionId: question.options[0]!.id }, guest.token)).status, 200);
  assert.equal((await request(`/api/sessions/${sessionId}/actions`, 'POST', { action: 'finish', expectedVersion: 1 }, good)).status, 200);
  const report = await request(`/api/teacher/sessions/${sessionId}`, 'GET', undefined, good);
  assert.equal(report.status, 200);
  assert.equal(report.envelope.data.participants[0].attempts[0].score, 100);
  assert.equal((await request('/api/teacher/dashboard', 'GET', undefined, good)).status, 200);
  assert.equal((await request(`/api/participants/sessions/${sessionId}/credential`, 'DELETE', undefined, guest.token)).status, 200);
  assert.equal((await request(`/api/participants/sessions/${sessionId}`, 'GET', undefined, guest.token)).status, 401);
  const disposable = await request('/api/quizzes', 'POST', input(0), good);
  assert.equal((await request(`/api/quizzes/${disposable.envelope.data.id}`, 'DELETE', undefined, good)).status, 200);

});

test('snapshot version prevents backwards session state but accepts participant changes at equal version', () => {
  const base = { sessionId: a.id, title: 'Quiz', pin: '012345', status: 'ACTIVE' as const, stateVersion: 3, currentPosition: 1, totalQuestions: 1, phase: 'QUESTION' as const, leaderboardEvery: null, currentQuestion: null, hasAnsweredCurrentQuestion: false, participant: { id: b.id, nickname: 'Student' }, result: null, leaderboard: null };
  assert.equal(applySnapshot(base, { ...base, stateVersion: 2 }), base);
  assert.equal(applySnapshot(base, { ...base, hasAnsweredCurrentQuestion: true }).hasAnsweredCurrentQuestion, true);
});
