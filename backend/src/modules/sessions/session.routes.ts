import { Router } from 'express';
import { actionInputSchema, hostInputSchema } from '@qforge/shared';
import { resourceIdParams, teacherActor } from '../../common/http.js';
import { sendSuccess } from '../../common/response.js';
import { validateRequest } from '../../middleware/validate.js';
import type { SessionService } from './session.service.js';

export function sessionRouter(service: SessionService) {
  const router = Router();
  router.post('/', validateRequest({ body: hostInputSchema }), async (_req, res) => {
    const { quizId, leaderboardEvery } = res.locals.validated.body;
    sendSuccess(res, await service.host(teacherActor(res), quizId, leaderboardEvery), 201);
  });
  router.get('/:id/snapshot', validateRequest({ params: resourceIdParams }), async (_req, res) => {
    sendSuccess(res, await service.snapshot(teacherActor(res), res.locals.validated.params.id));
  });
  router.post('/:id/actions', validateRequest({ params: resourceIdParams, body: actionInputSchema }), async (_req, res) => {
    const { action, expectedVersion } = res.locals.validated.body;
    sendSuccess(res, await service.action(teacherActor(res), res.locals.validated.params.id, action, expectedVersion));
  });
  return router;
}
