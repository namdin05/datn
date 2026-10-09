import { Router } from 'express';
import { quizInputSchema } from '@qforge/shared';
import { resourceIdParams, teacherActor } from '../../common/http.js';
import { sendSuccess } from '../../common/response.js';
import { validateRequest } from '../../middleware/validate.js';
import type { QuizService } from './quiz.service.js';

// HTTP adapter/controller: validate input, read authenticated actor, invoke one
// use case and format its response. No SQL or business rules belong here.
export function quizRouter(service: QuizService) {
  const router = Router();
  router.post('/', validateRequest({ body: quizInputSchema }), async (_req, res) => {
    sendSuccess(res, await service.save(teacherActor(res), res.locals.validated.body), 201);
  });
  router.get('/:id', validateRequest({ params: resourceIdParams }), async (_req, res) => {
    sendSuccess(res, await service.get(teacherActor(res), res.locals.validated.params.id));
  });
  router.put('/:id', validateRequest({ params: resourceIdParams, body: quizInputSchema }), async (_req, res) => {
    sendSuccess(res, await service.save(teacherActor(res), res.locals.validated.body, res.locals.validated.params.id));
  });
  router.delete('/:id', validateRequest({ params: resourceIdParams }), async (_req, res) => {
    sendSuccess(res, await service.delete(teacherActor(res), res.locals.validated.params.id));
  });
  router.post('/:id/publish', validateRequest({ params: resourceIdParams }), async (_req, res) => {
    sendSuccess(res, await service.publish(teacherActor(res), res.locals.validated.params.id));
  });
  return router;
}
