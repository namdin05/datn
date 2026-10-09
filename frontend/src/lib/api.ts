import { z } from 'zod';
import { createApiResponseSchema, dbDashboardSchema, dbQuizSchema, dbSessionDetailSchema, healthResponseSchema, publicRoomSchema, teacherActorSchema, participantCredentialSchema, snapshotSchema, teacherSnapshotSchema } from '@qforge/shared';
import type { ApiFailure, QuizInput, ParticipantCredential } from '@qforge/shared';
import { getTeacherToken } from './auth';

const apiUrl = (import.meta.env?.VITE_API_URL || 'http://127.0.0.1:3002').replace(/\/$/, '');
export class HttpApiError extends Error {
  constructor(readonly status: number, readonly error: ApiFailure['error']) { super(error.message); }
}
export async function requestApi<T>(path: string, schema: z.ZodType<T>, options: { method?: string; body?: unknown; token?: string; teacher?: boolean; signal?: AbortSignal } = {}): Promise<T> {
  const token = options.token ?? (options.teacher ? await getTeacherToken() : undefined);
  const signal = options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000);
  const response = await fetch(`${apiUrl}${path}`, {
    method: options.method ?? 'GET', signal,
    headers: { ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
  const parsed = createApiResponseSchema(schema).safeParse(await response.json().catch(() => null));
  if (!parsed.success || (response.ok && !parsed.data.success) || (!response.ok && parsed.data.success)) throw new Error('Phản hồi server không đúng contract.');
  if (!parsed.data.success) throw new HttpApiError(response.status, parsed.data.error);
  return parsed.data.data;
}
export async function fetchHealth() {
  const response = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`API returned HTTP ${response.status}.`);
  return healthResponseSchema.parse(await response.json());
}
export const databaseApi = {
  dashboard: (signal?: AbortSignal) => requestApi('/api/teacher/dashboard', dbDashboardSchema, { teacher: true, signal }),
  quiz: (id: string, signal?: AbortSignal) => requestApi(`/api/quizzes/${encodeURIComponent(id)}`, dbQuizSchema, { teacher: true, signal }),
  session: (id: string, signal?: AbortSignal) => requestApi(`/api/teacher/sessions/${encodeURIComponent(id)}`, dbSessionDetailSchema, { teacher: true, signal }),
  room: (pin: string, signal?: AbortSignal) => requestApi(`/api/rooms/${encodeURIComponent(pin)}`, publicRoomSchema, { signal }),
};
export const teacherApi = {
  me: (token: string, signal?: AbortSignal) => requestApi('/api/me', teacherActorSchema, { token, signal }),
  saveQuiz: (body: QuizInput, id?: string) => requestApi(id ? `/api/quizzes/${id}` : '/api/quizzes', dbQuizSchema, { method: id ? 'PUT' : 'POST', body, teacher: true }),
  publish: (id: string) => requestApi(`/api/quizzes/${id}/publish`, dbQuizSchema, { method: 'POST', teacher: true }),
  remove: (id: string) => requestApi(`/api/quizzes/${id}`, z.object({ deleted: z.literal(true) }), { method: 'DELETE', teacher: true }),
  host: (quizId: string) => requestApi('/api/sessions', teacherSnapshotSchema, { method: 'POST', body: { quizId }, teacher: true }),
  snapshot: (id: string, signal?: AbortSignal) => requestApi(`/api/sessions/${id}/snapshot`, teacherSnapshotSchema, { teacher: true, signal }),
  action: (id: string, action: 'start' | 'next' | 'finish', expectedVersion: number) => requestApi(`/api/sessions/${id}/actions`, teacherSnapshotSchema, { method: 'POST', body: { action, expectedVersion }, teacher: true }),
};
// Components depend on this boundary; the realtime adapter can be attached here.
export const sessionGateway = {
  join: (pin: string, nickname: string, requestId: string) => requestApi('/api/sessions/join', participantCredentialSchema, { method: 'POST', body: { pin, nickname, requestId } }),
  snapshot: (c: ParticipantCredential, signal?: AbortSignal) => requestApi(`/api/participants/sessions/${c.sessionId}`, snapshotSchema, { token: c.token, signal }),
  answer: (c: ParticipantCredential, questionId: string, selectedOptionId: string) => requestApi(`/api/participants/sessions/${c.sessionId}/answers`, snapshotSchema, { token: c.token, method: 'POST', body: { questionId, selectedOptionId } }),
  revoke: (c: ParticipantCredential) => requestApi(`/api/participants/sessions/${c.sessionId}/credential`, z.object({ revoked: z.literal(true) }), { token: c.token, method: 'DELETE' }),
};
