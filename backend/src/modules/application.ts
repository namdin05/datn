import type { Pool } from 'pg';
import type { ParticipantCredentials } from './participants/participant-credentials.js';
import { createQuizService } from './quizzes/quiz.service.js';
import { quizQueries } from './quizzes/quiz.queries.js';
import { createSessionService } from './sessions/session.service.js';
import { sessionSnapshots } from './sessions/session.snapshot.js';
import { createParticipantService } from './participants/participant.service.js';
import { createAnswerService } from './answers/answer.service.js';
import { createReportService } from './reporting/report.service.js';

// Composition root: explicit dependencies, one shared pool, no global service
// locator. REST and future socket adapters receive the same application services.
export function createServices(pool: Pool, credentials?: ParticipantCredentials) {
  return {
    quizzes: createQuizService(pool, quizQueries),
    sessions: createSessionService(pool, quizQueries, sessionSnapshots),
    participants: createParticipantService(pool, sessionSnapshots, credentials),
    answers: createAnswerService(pool, sessionSnapshots, credentials),
    reports: createReportService(pool, quizQueries),
  };
}
export type ApplicationServices = ReturnType<typeof createServices>;
