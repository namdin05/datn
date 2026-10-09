import type { Pool } from 'pg';
import type { TeacherActor } from '@qforge/shared';
import { ApiError } from '../../common/api-error.js';
import { apiStatus } from '../sessions/session.mapper.js';
import type { QuizQueries } from '../quizzes/quiz.queries.js';
import { reportRepository } from './report.repository.js';

export function createReportService(pool: Pool, quizzes: QuizQueries) {
  const repo = reportRepository(pool);
  return {
    async dashboard(actor: TeacherActor) {
      const quizList = await repo.quizzes(actor.id);
      const sessions = (await repo.sessions(actor.id)).map(session => ({ ...session, status: apiStatus(session.status) }));
      return { teacher: { id: actor.id, name: actor.name }, quizzes: quizList, sessions };
    },
    quiz(actor: TeacherActor, id: string) {
      return quizzes.get(pool, actor, id);
    },
    async session(actor: TeacherActor, id: string) {
      const session = await repo.session(id, actor.id);
      if (!session) throw new ApiError('NOT_FOUND', { message: 'Không tìm thấy phiên.' });
      return { ...session, status: apiStatus(session.status), participants: await repo.participants(id) };
    },
    async openRoom(pin: string) {
      const room = await repo.openRoom(pin);
      if (!room) throw new ApiError('NOT_FOUND', { message: 'Không tìm thấy phòng đang mở.' });
      // PIN holders receive only room metadata, never questions or identities.
      return { ...room, status: apiStatus(room.status) };
    },
  };
}
export type ReportService = ReturnType<typeof createReportService>;
