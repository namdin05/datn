import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { realtimeAuthSchema, realtimeEvents } from '@qforge/shared';
import type { RealtimeAuth, SessionChanged } from '@qforge/shared';
import { ApiError } from '../common/api-error.js';
import { resolveTeacher } from '../auth/teacher.js';
import type { BackendRuntime } from '../app.js';
import { requireParticipantCredentials } from '../modules/participants/participant-credentials.js';
import type { SessionChange, SessionEventBus } from '../modules/session-events.js';

const rooms = {
  students: (sessionId: string) => `session:${sessionId}:students`,
  teacher: (sessionId: string) => `session:${sessionId}:teacher`,
  participant: (participantId: string) => `participant:${participantId}`,
};

function handshakeError(error: unknown) {
  const code = error instanceof ApiError ? error.code : 'INTERNAL_ERROR';
  // socket.io-client exposes `data` on connect_error; never forward internal messages.
  return Object.assign(new Error(code), { data: { code } });
}

// Socket.IO is a notification channel only. Commands stay on REST, and payloads carry
// no question, answer or score data: each client re-reads its own authorized snapshot.
export function attachRealtime(server: HttpServer, runtime: BackendRuntime, bus: SessionEventBus, options: { origins: string[]; teacherThrottleMs?: number }) {
  const io = new Server(server, { cors: { origin: options.origins }, serveClient: false });
  const throttleMs = options.teacherThrottleMs ?? 300;

  // Rooms are derived from verified credentials; clients never choose a room.
  async function authorize(auth: RealtimeAuth) {
    if (auth.kind === 'teacher') {
      if (!runtime.verify) throw new ApiError('DB_UNAVAILABLE');
      const actor = await resolveTeacher(runtime.db, runtime.verify, auth.token);
      await runtime.services.sessions.snapshot(actor, auth.sessionId); // NOT_FOUND unless this Teacher hosts it.
      return [rooms.teacher(auth.sessionId)];
    }
    const participant = await requireParticipantCredentials(runtime.credentials).resolve(runtime.db, auth.sessionId, auth.token);
    return [rooms.students(auth.sessionId), rooms.participant(participant.id)];
  }

  io.use((socket, next) => {
    const auth = realtimeAuthSchema.safeParse(socket.handshake.auth);
    if (!auth.success) return next(handshakeError(new ApiError('UNAUTHORIZED')));
    authorize(auth.data).then(joined => { socket.data.rooms = joined; next(); }, error => next(handshakeError(error)));
  });
  io.on('connection', socket => { void socket.join(socket.data.rooms as string[]); });

  // Coalesce join/answer bursts into at most one host refresh per session per window.
  const pending = new Map<string, NodeJS.Timeout>();
  function notifyTeacherSoon(payload: SessionChanged) {
    if (pending.has(payload.sessionId)) return;
    pending.set(payload.sessionId, setTimeout(() => {
      pending.delete(payload.sessionId);
      io.to(rooms.teacher(payload.sessionId)).emit(realtimeEvents.changed, payload);
    }, throttleMs));
  }
  const unsubscribe = bus.subscribe((change: SessionChange) => {
    if (change.reason === 'revoked') {
      const room = rooms.participant(change.participantId);
      io.to(room).emit(realtimeEvents.revoked, { sessionId: change.sessionId });
      io.in(room).disconnectSockets(true);
      notifyTeacherSoon({ sessionId: change.sessionId, reason: 'roster', stateVersion: null });
      return;
    }
    const payload: SessionChanged = { sessionId: change.sessionId, reason: change.reason, stateVersion: change.stateVersion };
    if (change.reason === 'lifecycle') {
      io.to([rooms.students(change.sessionId), rooms.teacher(change.sessionId)]).emit(realtimeEvents.changed, payload);
    } else {
      notifyTeacherSoon(payload);
    }
  });

  return {
    io,
    // Disconnect clients so the HTTP server can close; io.close() would also close the server.
    shutdown() {
      unsubscribe();
      for (const timer of pending.values()) clearTimeout(timer);
      pending.clear();
      io.disconnectSockets(true);
    },
  };
}
export type RealtimeServer = ReturnType<typeof attachRealtime>;
