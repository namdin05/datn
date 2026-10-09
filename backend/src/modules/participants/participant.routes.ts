import { Router } from 'express';
import { joinInputSchema } from '@qforge/shared';
import { bearerToken } from '../../auth/teacher.js';
import { resourceIdParams } from '../../common/http.js';
import { sendSuccess } from '../../common/response.js';
import { validateRequest } from '../../middleware/validate.js';
import type { ParticipantService } from './participant.service.js';

export function participantRouter(service: ParticipantService) {
  const router = Router();
  router.post('/sessions/join', validateRequest({ body: joinInputSchema }), async (_req, res) => {
    sendSuccess(res, await service.join(res.locals.validated.body), 201);
  });
  router.get('/participants/sessions/:id', validateRequest({ params: resourceIdParams }), async (req, res) => {
    sendSuccess(res, await service.snapshot(res.locals.validated.params.id, bearerToken(req.headers.authorization)));
  });
  router.delete('/participants/sessions/:id/credential', validateRequest({ params: resourceIdParams }), async (req, res) => {
    sendSuccess(res, await service.revoke(res.locals.validated.params.id, bearerToken(req.headers.authorization)));
  });
  return router;
}
