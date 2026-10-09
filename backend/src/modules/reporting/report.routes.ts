import { Router } from 'express';
import type { Request, Response } from 'express';
import type { TeacherActor } from '@qforge/shared';
import { pinSchema } from '@qforge/shared';
import { z } from 'zod';
import { resourceIdParams, teacherActor } from '../../common/http.js';
import { sendSuccess } from '../../common/response.js';
import { validateRequest } from '../../middleware/validate.js';
import type { ReportService } from './report.service.js';

export type ReportActorProvider = (req: Request, res: Response) => Promise<TeacherActor>;
export function reportRouter(service: ReportService, actorProvider: ReportActorProvider = async (_req, res) => teacherActor(res)) {
  const router = Router();
  router.get('/dashboard', async (req, res) => {
    sendSuccess(res, await service.dashboard(await actorProvider(req, res)));
  });
  router.get('/quizzes/:id', validateRequest({ params: resourceIdParams }), async (req, res) => {
    sendSuccess(res, await service.quiz(await actorProvider(req, res), res.locals.validated.params.id));
  });
  router.get('/sessions/:id', validateRequest({ params: resourceIdParams }), async (req, res) => {
    sendSuccess(res, await service.session(await actorProvider(req, res), res.locals.validated.params.id));
  });
  return router;
}

export function publicRoomRouter(service: ReportService) {
  const router = Router();
  router.get('/:pin', validateRequest({ params: z.object({ pin: pinSchema }) }), async (_req, res) => {
    sendSuccess(res, await service.openRoom(res.locals.validated.params.pin));
  });
  return router;
}
