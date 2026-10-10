import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { test } from 'node:test';
import type { TestContext } from 'node:test';
import { io as connect } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { hostInputSchema, quizInputSchema, realtimeEvents, sessionChangedSchema, snapshotSchema, teacherSnapshotSchema } from '@qforge/shared';
import type { TeacherActor } from '@qforge/shared';
import { createApp, createBackendRuntime } from '../src/app.js';
import { ApiError } from '../src/common/api-error.js';
import { readEnv } from '../src/config/env.js';
import { createServices } from '../src/modules/application.js';
import { createSessionEventBus } from '../src/modules/session-events.js';
import { ParticipantTokens } from '../src/auth/participant.js';
import { attachRealtime } from '../src/realtime/socket.js';
import { isolatedPostgres } from './support/postgres.js';

const secret = 'test-only-participant-secret-32-characters';
const a: TeacherActor = { id: '00000000-0000-4000-8000-000000000001', name: 'Teacher A', role: 'TEACHER' };
const b: TeacherActor = { id: '00000000-0000-4000-8000-000000000002', name: 'Teacher B', role: 'TEACHER' };
const input = (count: number) => quizInputSchema.parse({ title: 'Live Quiz', questions: Array.from({ length: count }, (_, i) => ({ content: `Question ${i + 1}`, options: ['A', 'B', 'C', 'D'].map((content, j) => ({ content, isCorrect: j === 0 })) })) });
function hasCode(code: string) { return (error: unknown) => (error as { code?: string }).code === code; }
async function database() {
  const db = await isolatedPostgres();
  for (const actor of [a, b]) await db.pool.query('INSERT INTO public.users(id,display_name,role,auth_user_id) VALUES($1,$2,$3,$1)', [actor.id, actor.name, actor.role]);
  return db;
}

test('host input limits the leaderboard cadence to 1-10 questions or final only', () => {
  const quizId = randomUUID();
  assert.equal(hostInputSchema.parse({ quizId }).leaderboardEvery, null);
  assert.equal(hostInputSchema.parse({ quizId, leaderboardEvery: 10 }).leaderboardEvery, 10);
  for (const leaderboardEvery of [0, 11, 1.5, '2']) assert.equal(hostInputSchema.safeParse({ quizId, leaderboardEvery }).success, false);
});

test('PostgreSQL: leaderboard step after every N questions, hidden while a question is open, final ranking', async () => {
  const db = await database();
  try {
    const service = createServices(db.pool, new ParticipantTokens(secret, 86400));
    const quiz = await service.quizzes.save(a, input(5)); await service.quizzes.publish(a, quiz.id);
    const session = await service.sessions.host(a, quiz.id, 2);
    assert.equal(session.leaderboardEvery, 2); assert.equal(session.phase, null);
    const join = (nickname: string) => service.participants.join({ pin: session.pin, nickname, requestId: randomUUID() });
    const [ann, bob, cat] = [await join('Ann'), await join('Bob'), await join('Cat')];
    const read = async (c: typeof ann) => snapshotSchema.parse(await service.participants.snapshot(c.sessionId, c.token));
    async function answer(c: typeof ann, correct: boolean) {
      const q = (await read(c)).currentQuestion!;
      return service.answers.submit(c.sessionId, c.token, q.id, q.options[correct ? 0 : 1]!.id);
    }
    let host = await service.sessions.action(a, session.sessionId, 'start', 0);
    assert.equal(host.phase, 'QUESTION');
    await answer(ann, true); await answer(bob, true); await answer(cat, true);
    assert.equal((await read(ann)).leaderboard, null, 'no ranking while question 1 is open');
    host = await service.sessions.action(a, session.sessionId, 'next', host.stateVersion);
    assert.equal(host.currentPosition, 2); assert.equal(host.phase, 'QUESTION');
    await answer(ann, true); await answer(cat, true); // Bob leaves question 2 unanswered.
    const q2 = (await read(ann)).currentQuestion!;
    // The host follows the live ranking during the question.
    assert.deepEqual(teacherSnapshotSchema.parse(host).leaderboard.length, 3);
    assert.deepEqual((await service.sessions.snapshot(a, session.sessionId)).leaderboard.map(e => [e.nickname, e.rank, e.score]), [['Ann', 1, 200], ['Cat', 1, 200], ['Bob', 3, 100]]);

    host = await service.sessions.action(a, session.sessionId, 'next', host.stateVersion);
    assert.equal(host.phase, 'LEADERBOARD'); assert.equal(host.currentPosition, 2);
    const board = await read(bob);
    assert.equal(board.currentQuestion, null); assert.equal(board.phase, 'LEADERBOARD');
    assert.deepEqual(board.leaderboard?.top.map(e => [e.nickname, e.rank, e.score, e.correct]), [['Ann', 1, 200, 2], ['Cat', 1, 200, 2], ['Bob', 3, 100, 1]]);
    assert.deepEqual(board.leaderboard?.me, { participantId: bob.participantId, nickname: 'Bob', rank: 3, score: 100, correct: 1 });
    assert.equal(board.leaderboard?.totalParticipants, 3);
    assert.ok(!JSON.stringify(board).includes('isCorrect'));
    // Answers close on the leaderboard step; an identical retry stays idempotent.
    await assert.rejects(service.answers.submit(bob.sessionId, bob.token, q2.id, q2.options[0]!.id), hasCode('CONFLICT'));
    assert.equal((await service.answers.submit(ann.sessionId, ann.token, q2.id, q2.options[0]!.id)).hasAnsweredCurrentQuestion, false);

    host = await service.sessions.action(a, session.sessionId, 'next', host.stateVersion);
    assert.deepEqual([host.phase, host.currentPosition], ['QUESTION', 3]);
    assert.equal((await read(bob)).leaderboard, null);
    host = await service.sessions.action(a, session.sessionId, 'next', host.stateVersion);
    assert.deepEqual([host.phase, host.currentPosition], ['QUESTION', 4]);
    host = await service.sessions.action(a, session.sessionId, 'next', host.stateVersion);
    assert.deepEqual([host.phase, host.currentPosition], ['LEADERBOARD', 4]);
    host = await service.sessions.action(a, session.sessionId, 'next', host.stateVersion);
    assert.deepEqual([host.phase, host.currentPosition], ['QUESTION', 5]);
    // No leaderboard step after the last question: finish shows the final ranking.
    await assert.rejects(service.sessions.action(a, session.sessionId, 'next', host.stateVersion), hasCode('CONFLICT'));
    host = await service.sessions.action(a, session.sessionId, 'finish', host.stateVersion);
    assert.equal(host.phase, null);
    const final = await read(cat);
    assert.equal(final.status, 'FINISHED'); assert.equal(final.leaderboard?.me?.rank, 1); assert.ok(final.result);
  } finally { await db.close(); }
});

test('PostgreSQL: without a cadence "next" goes straight to the next question; settings survive start', async () => {
  const db = await database();
  try {
    const service = createServices(db.pool, new ParticipantTokens(secret, 86400));
    const quiz = await service.quizzes.save(a, input(3)); await service.quizzes.publish(a, quiz.id);
    const plain = await service.sessions.host(a, quiz.id);
    let host = await service.sessions.action(a, plain.sessionId, 'start', 0);
    host = await service.sessions.action(a, plain.sessionId, 'next', host.stateVersion);
    assert.deepEqual([host.phase, host.currentPosition, host.leaderboardEvery], ['QUESTION', 2, null]);
    const every1 = await service.sessions.host(a, quiz.id, 1);
    host = await service.sessions.action(a, every1.sessionId, 'start', 0);
    assert.equal(host.leaderboardEvery, 1, 'start re-applies demo settings without resetting the cadence');
    host = await service.sessions.action(a, every1.sessionId, 'next', host.stateVersion);
    assert.equal(host.phase, 'LEADERBOARD');
    // Pre-003 code on the shared DB starts sessions without a phase; they behave as QUESTION.
    await db.pool.query('UPDATE public.sessions SET live_phase=NULL WHERE id=$1', [plain.sessionId]);
    const student = await service.participants.join({ pin: (await service.sessions.host(a, quiz.id)).pin, nickname: 'Late', requestId: randomUUID() });
    await db.pool.query("UPDATE public.sessions SET status='IN_PROGRESS',started_at=now(),current_question_position=1 WHERE id=$1", [student.sessionId]);
    await db.pool.query("INSERT INTO public.attempts(participant_id,attempt_number,total_questions,max_accuracy_points) VALUES($1,1,3,300)", [student.participantId]);
    const legacy = snapshotSchema.parse(await service.participants.snapshot(student.sessionId, student.token));
    assert.equal(legacy.phase, 'QUESTION'); assert.ok(legacy.currentQuestion);
    await service.answers.submit(student.sessionId, student.token, legacy.currentQuestion.id, legacy.currentQuestion.options[0]!.id);
    assert.equal((await service.sessions.snapshot(a, plain.sessionId)).phase, 'QUESTION');
  } finally { await db.close(); }
});

async function startRealtime(context: TestContext) {
  const db = await database();
  context.after(() => db.close());
  const bus = createSessionEventBus();
  // Signature verification is covered by the JWT test; here a token is the Auth subject.
  const verifyTeacherToken = async (token: string) => { if (token !== a.id && token !== b.id) throw new ApiError('UNAUTHORIZED'); return token; };
  const config = readEnv({ NODE_ENV: 'test', PARTICIPANT_TOKEN_HASH_SECRET: secret });
  const runtime = createBackendRuntime(config, db.pool, { verifyTeacherToken, events: bus });
  const server = createServer(createApp(config, { runtime, errorLogger: () => {} }));
  const realtime = attachRealtime(server, runtime, bus, { origins: config.FRONTEND_ORIGINS, teacherThrottleMs: 50 });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}`;
  const sockets: Socket[] = [];
  context.after(() => new Promise<void>(resolve => {
    for (const socket of sockets) socket.disconnect();
    realtime.shutdown(); void realtime.io.close(() => resolve()); server.closeAllConnections();
  }));
  function open(auth: object) {
    const socket = connect(url, { auth, transports: ['websocket'], reconnection: false, forceNew: true });
    sockets.push(socket);
    return socket;
  }
  return { service: runtime.services, open };
}
function connected(socket: Socket) {
  return new Promise<void>((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
}
function rejected(socket: Socket) {
  return new Promise<string>((resolve, reject) => {
    socket.once('connect', () => reject(new Error('unexpected connect')));
    socket.once('connect_error', error => resolve((error as Error & { data?: { code?: string } }).data?.code ?? error.message));
  });
}
function collect(socket: Socket, event: string) {
  const received: unknown[] = [];
  socket.on(event, payload => received.push(payload));
  return received;
}
const settle = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

test('Socket.IO: handshake auth derives rooms; host and other rooms are rejected', async context => {
  const { service, open } = await startRealtime(context);
  const quiz = await service.quizzes.save(a, input(2)); await service.quizzes.publish(a, quiz.id);
  const session = await service.sessions.host(a, quiz.id);
  const other = await service.sessions.host(a, quiz.id);
  const student = await service.participants.join({ pin: session.pin, nickname: 'Ann', requestId: randomUUID() });
  assert.equal(await rejected(open({})), 'UNAUTHORIZED');
  assert.equal(await rejected(open({ kind: 'teacher', sessionId: session.sessionId, token: 'not-a-teacher' })), 'UNAUTHORIZED');
  assert.equal(await rejected(open({ kind: 'teacher', sessionId: session.sessionId, token: b.id })), 'NOT_FOUND');
  assert.equal(await rejected(open({ kind: 'participant', sessionId: other.sessionId, token: student.token })), 'UNAUTHORIZED');
  assert.equal(await rejected(open({ kind: 'participant', sessionId: session.sessionId, token: student.token, room: 'x' })), 'UNAUTHORIZED');
  await connected(open({ kind: 'teacher', sessionId: session.sessionId, token: a.id }));
  await connected(open({ kind: 'participant', sessionId: session.sessionId, token: student.token }));
});

test('Socket.IO: lifecycle reaches all Students, answers reach only the host (coalesced), revoke disconnects', async context => {
  const { service, open } = await startRealtime(context);
  const quiz = await service.quizzes.save(a, input(2)); await service.quizzes.publish(a, quiz.id);
  const session = await service.sessions.host(a, quiz.id, 1);
  const other = await service.sessions.host(a, quiz.id);
  const join = (pin: string, nickname: string) => service.participants.join({ pin, nickname, requestId: randomUUID() });
  const ann = await join(session.pin, 'Ann'); const bob = await join(session.pin, 'Bob'); const outsider = await join(other.pin, 'Eve');

  const teacher = open({ kind: 'teacher', sessionId: session.sessionId, token: a.id });
  const annSocket = open({ kind: 'participant', sessionId: session.sessionId, token: ann.token });
  const bobSocket = open({ kind: 'participant', sessionId: session.sessionId, token: bob.token });
  const eveSocket = open({ kind: 'participant', sessionId: other.sessionId, token: outsider.token });
  const toTeacher = collect(teacher, realtimeEvents.changed); const toAnn = collect(annSocket, realtimeEvents.changed);
  const toBob = collect(bobSocket, realtimeEvents.changed); const toEve = collect(eveSocket, realtimeEvents.changed);
  await Promise.all([teacher, annSocket, bobSocket, eveSocket].map(connected));
  await settle(); toTeacher.length = 0; // Drop roster refreshes scheduled by the joins above.

  // A new join refreshes only the host's roster.
  await join(session.pin, 'Cat'); await settle();
  assert.deepEqual(toTeacher.map(e => sessionChangedSchema.parse(e).reason), ['roster']);
  assert.equal(toAnn.length, 0);

  const started = await service.sessions.action(a, session.sessionId, 'start', 0); await settle(100);
  for (const received of [toAnn, toBob]) assert.deepEqual(received, [{ sessionId: session.sessionId, reason: 'lifecycle', stateVersion: started.stateVersion }]);
  assert.equal(toEve.length, 0, 'other rooms are not notified');

  // Two answers inside one throttle window produce one host refresh and nothing for Students.
  toTeacher.length = 0;
  const q = snapshotSchema.parse(await service.participants.snapshot(ann.sessionId, ann.token)).currentQuestion!;
  await service.answers.submit(ann.sessionId, ann.token, q.id, q.options[0]!.id);
  await service.answers.submit(bob.sessionId, bob.token, q.id, q.options[1]!.id);
  await settle();
  assert.deepEqual(toTeacher, [{ sessionId: session.sessionId, reason: 'answer', stateVersion: null }]);
  assert.equal(toAnn.length, 1);

  const board = await service.sessions.action(a, session.sessionId, 'next', started.stateVersion); await settle(100);
  assert.equal(board.phase, 'LEADERBOARD');
  assert.deepEqual(toBob.at(-1), { sessionId: session.sessionId, reason: 'lifecycle', stateVersion: board.stateVersion });
  for (const payload of [...toTeacher, ...toAnn, ...toBob]) assert.ok(!/score|isCorrect|option|nickname/i.test(JSON.stringify(payload)));

  const revoked = new Promise(resolve => bobSocket.once(realtimeEvents.revoked, resolve));
  const disconnected = new Promise(resolve => bobSocket.once('disconnect', resolve));
  await service.participants.revoke(bob.sessionId, bob.token);
  assert.deepEqual(await revoked, { sessionId: session.sessionId });
  await disconnected;
  assert.equal(await rejected(open({ kind: 'participant', sessionId: session.sessionId, token: bob.token })), 'UNAUTHORIZED');
  assert.ok(annSocket.connected);
});
