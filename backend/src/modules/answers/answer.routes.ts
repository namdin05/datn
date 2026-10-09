import { Router } from 'express';
import { answerInputSchema } from '@qforge/shared';
import { bearerToken } from '../../auth/teacher.js';
import { resourceIdParams } from '../../common/http.js';
import { sendSuccess } from '../../common/response.js';
import { validateRequest } from '../../middleware/validate.js';
import type { AnswerService } from './answer.service.js';

export function answerRouter(service: AnswerService) {
  const router = Router();
  router.post('/participants/sessions/:id/answers', validateRequest({ params: resourceIdParams, body: answerInputSchema }), async (req, res) => {
    const { questionId, selectedOptionId } = res.locals.validated.body;
    sendSuccess(res, await service.submit(res.locals.validated.params.id, bearerToken(req.headers.authorization), questionId, selectedOptionId));
  });
  return router;
}
