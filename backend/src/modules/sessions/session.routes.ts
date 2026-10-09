import { Router } from 'express';
import { actionInputSchema } from '@qforge/shared';
import { z } from 'zod';
import { resourceIdParams, teacherActor } from '../../common/http.js';
import { sendSuccess } from '../../common/response.js';
import { validateRequest } from '../../middleware/validate.js';
import type { SessionService } from './session.service.js';

export function sessionRouter(service: SessionService) {
  const router = Router();
  router.post('/', validateRequest({ body: z.strictObject({ quizId: z.guid() }) }), async (_req, res) => {
    sendSuccess(res, await service.host(teacherActor(res), res.locals.validated.body.quizId), 201);
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
