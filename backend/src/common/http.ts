import type { Response } from 'express';
import type { TeacherActor } from '@qforge/shared';
import { z } from 'zod';

export const resourceIdParams = z.object({ id: z.guid() });

// Only call behind requireTeacher; the actor is always derived from verified Auth.
export function teacherActor(response: Response): TeacherActor {
  return response.locals.teacher as TeacherActor;
}
