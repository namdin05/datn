import { z } from 'zod';

export const pinSchema = z.string().regex(/^\d{6}$/, 'PIN phải gồm đúng 6 chữ số.');
export const teacherActorSchema = z.object({ id: z.guid(), name: z.string(), role: z.literal('TEACHER') });
export type TeacherActor = z.infer<typeof teacherActorSchema>;
export const draftQuestionSchema = z.strictObject({
  content: z.string().trim().max(5000),
  options: z.array(z.strictObject({ content: z.string().trim().max(2000), isCorrect: z.boolean() })).length(4),
});
export const quizInputSchema = z.strictObject({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).default(''),
  questions: z.array(draftQuestionSchema).max(100).default([]),
});
export type QuizInput = z.infer<typeof quizInputSchema>;
export const publicQuestionSchema = z.strictObject({
  id: z.guid(), content: z.string(), position: z.number().int().positive(), points: z.literal(100),
  options: z.array(z.strictObject({ id: z.guid(), content: z.string(), position: z.number().int().positive() })).length(4),
});
export const teacherQuestionSchema = publicQuestionSchema.extend({
  options: z.array(z.strictObject({ id: z.guid(), content: z.string(), position: z.number().int().positive(), isCorrect: z.boolean() })).length(4),
});
export type PublicQuestion = z.infer<typeof publicQuestionSchema>;
export type TeacherQuestion = z.infer<typeof teacherQuestionSchema>;
export const joinInputSchema = z.strictObject({ pin: pinSchema, nickname: z.string().trim().min(1).max(100), requestId: z.guid() });
export const participantCredentialSchema = z.object({
  sessionId: z.guid(), participantId: z.guid(), token: z.string().regex(/^[A-Za-z0-9_-]{43}$/), expiresAt: z.iso.datetime(),
});
export type ParticipantCredential = z.infer<typeof participantCredentialSchema>;
export const resultSchema = z.object({
  score: z.number().int().nonnegative(), correct: z.number().int().nonnegative(), incorrect: z.number().int().nonnegative(),
  unanswered: z.number().int().nonnegative(), total: z.number().int().nonnegative(), accuracy: z.number().min(0).max(100),
});
// Leaderboard cadence chosen by the Teacher when hosting. Demo limit: every 1-10 questions;
// null shows only the final leaderboard.
export const LEADERBOARD_EVERY_MAX = 10;
export const LEADERBOARD_TOP = 10;
export const leaderboardEverySchema = z.number().int().min(1).max(LEADERBOARD_EVERY_MAX).nullable();
export const hostInputSchema = z.strictObject({ quizId: z.guid(), leaderboardEvery: leaderboardEverySchema.default(null) });
export const livePhaseSchema = z.enum(['QUESTION', 'LEADERBOARD']).nullable();
export type LivePhase = z.infer<typeof livePhaseSchema>;
// Competition ranking: equal scores share a rank (1, 1, 3).
export const leaderboardEntrySchema = z.object({
  participantId: z.guid(), nickname: z.string(), rank: z.number().int().positive(),
  score: z.number().int().nonnegative(), correct: z.number().int().nonnegative(),
});
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
export const studentLeaderboardSchema = z.object({
  top: z.array(leaderboardEntrySchema).max(LEADERBOARD_TOP), me: leaderboardEntrySchema.nullable(), totalParticipants: z.number().int().nonnegative(),
});
const liveStateShape = {
  sessionId: z.guid(), title: z.string(), pin: pinSchema, status: z.enum(['WAITING', 'ACTIVE', 'FINISHED']),
  stateVersion: z.number().int().nonnegative(), currentPosition: z.number().int().positive().nullable(), totalQuestions: z.number().int().nonnegative(),
  phase: livePhaseSchema, leaderboardEvery: leaderboardEverySchema,
};
export const snapshotSchema = z.object({
  ...liveStateShape,
  currentQuestion: publicQuestionSchema.nullable(), hasAnsweredCurrentQuestion: z.boolean(),
  participant: z.object({ id: z.guid(), nickname: z.string() }), result: resultSchema.nullable(),
  // Only present on a leaderboard step or after FINISHED, never while a question is open.
  leaderboard: studentLeaderboardSchema.nullable(),
});
export type ParticipantSnapshot = z.infer<typeof snapshotSchema>;
export const teacherSnapshotSchema = z.object({
  ...liveStateShape,
  participants: z.array(z.object({ id: z.guid(), nickname: z.string(), hasAnsweredCurrentQuestion: z.boolean(), result: resultSchema.nullable() })),
  // The host follows the full live ranking at every step.
  leaderboard: z.array(leaderboardEntrySchema),
});
export type TeacherSnapshot = z.infer<typeof teacherSnapshotSchema>;
export const answerInputSchema = z.strictObject({ questionId: z.guid(), selectedOptionId: z.guid() });
export const actionInputSchema = z.strictObject({ action: z.enum(['start', 'next', 'finish']), expectedVersion: z.number().int().nonnegative() });

// Whether "next" from this state opens the leaderboard step instead of the next question.
export function nextOpensLeaderboard(state: { status: string; phase: LivePhase; currentPosition: number | null; totalQuestions: number; leaderboardEvery: number | null }) {
  return state.status !== 'FINISHED' && state.phase === 'QUESTION' && !!state.leaderboardEvery && !!state.currentPosition
    && state.currentPosition < state.totalQuestions && state.currentPosition % state.leaderboardEvery === 0;
}

// Realtime is a server -> client notification channel. Payloads carry no answers or
// scores; clients re-read their own authorized snapshot over REST.
export const realtimeEvents = { changed: 'session:changed', revoked: 'session:revoked' } as const;
export const realtimeAuthSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('teacher'), sessionId: z.guid(), token: z.string().min(1).max(4096) }),
  z.strictObject({ kind: z.literal('participant'), sessionId: z.guid(), token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }),
]);
export type RealtimeAuth = z.infer<typeof realtimeAuthSchema>;
export const sessionChangedSchema = z.object({
  sessionId: z.guid(), reason: z.enum(['lifecycle', 'roster', 'answer']), stateVersion: z.number().int().nonnegative().nullable(),
});
export type SessionChanged = z.infer<typeof sessionChangedSchema>;

// stateVersion covers session actions. Participant answers can change at the same version.
export function applySnapshot(previous: ParticipantSnapshot | undefined, next: ParticipantSnapshot) {
  return previous?.sessionId === next.sessionId && previous.stateVersion > next.stateVersion ? previous : next;
}

export function calculateResult(total: number, correct: number, incorrect: number) {
  if (![total, correct, incorrect].every(n => Number.isInteger(n) && n >= 0) || correct + incorrect > total) throw new Error('Invalid result counts.');
  return { total, correct, incorrect, unanswered: total - correct - incorrect, score: correct * 100, accuracy: total ? Math.round(correct / total * 10000) / 100 : 0 };
}
