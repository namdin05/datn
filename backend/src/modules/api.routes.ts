import { Router } from 'express';
import type { RequestHandler } from 'express';
import { teacherActor } from '../common/http.js';
import { sendSuccess } from '../common/response.js';
import type { ApplicationServices } from './application.js';
import { quizRouter } from './quizzes/quiz.routes.js';
import { sessionRouter } from './sessions/session.routes.js';
import { participantRouter } from './participants/participant.routes.js';
import { answerRouter } from './answers/answer.routes.js';
import { reportRouter } from './reporting/report.routes.js';

export function apiRouter(services: ApplicationServices, authenticateTeacher: RequestHandler) {
  const router = Router();
  // Guest join must run before the protected /sessions namespace.
  router.use(participantRouter(services.participants));
  router.use(answerRouter(services.answers));
  const teacher = Router();
  teacher.use(authenticateTeacher);
  teacher.get('/me', (_req, res) => sendSuccess(res, teacherActor(res)));
  teacher.use('/teacher', reportRouter(services.reports));
  teacher.use('/quizzes', quizRouter(services.quizzes));
  teacher.use('/sessions', sessionRouter(services.sessions));
  // Leave unrelated API namespaces available to additional adapters/404 handling.
  router.use((req, res, next) => /^\/(me|teacher|quizzes|sessions)(\/|$)/.test(req.path) ? teacher(req, res, next) : next());
  return router;
}
