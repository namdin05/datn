import { z } from "zod";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = {
  success: false;
  error: { code: string; message: string };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export const healthResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    status: z.literal("ok"),
    service: z.literal("qforge-api"),
  }),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const dbOptionSchema = z.object({ id: z.guid(), content: z.string(), position: z.number(), isCorrect: z.boolean() });
export const dbQuestionSchema = z.object({ id: z.guid(), content: z.string(), position: z.number(), points: z.number(), options: z.array(dbOptionSchema) });
export const dbQuizSchema = z.object({ id: z.guid(), title: z.string(), description: z.string(), status: z.enum(['DRAFT','PUBLISHED']), questionCount: z.number(), questions: z.array(dbQuestionSchema).optional() });
export const dbSessionSchema = z.object({ id: z.guid(), quizId: z.guid(), title: z.string(), pin: z.string(), status: z.enum(['WAITING','ACTIVE','FINISHED']), participantCount: z.number() });
export const dbParticipantSchema = z.object({ id: z.guid(), name: z.string(), status: z.string(), attempts: z.array(z.object({ number: z.number(), score: z.number(), correct: z.number(), incorrect: z.number(), unanswered: z.number(), accuracy: z.number() })) });
export const dbDashboardSchema = z.object({ teacher: z.object({ id: z.guid(), name: z.string() }), quizzes: z.array(dbQuizSchema), sessions: z.array(dbSessionSchema) });
export const dbSessionDetailSchema = dbSessionSchema.extend({ participants: z.array(dbParticipantSchema) });
export const publicRoomSchema = z.object({ title: z.string(), pin: z.string(), status: z.enum(['WAITING','ACTIVE','FINISHED']), participantCount: z.number() });
export type DbQuiz = z.infer<typeof dbQuizSchema>;
export type DbSession = z.infer<typeof dbSessionSchema>;
export type DbDashboard = z.infer<typeof dbDashboardSchema>;
export type DbSessionDetail = z.infer<typeof dbSessionDetailSchema>;
