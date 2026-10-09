import { randomInt } from 'node:crypto';
import type { Pool } from 'pg';
import type { TeacherActor } from '@qforge/shared';
import { ApiError } from '../../common/api-error.js';
import { transaction } from '../../config/db.js';
import { answerRepository } from '../answers/answer.repository.js';
import { participantRepository } from '../participants/participant.repository.js';
import type { QuizQueries } from '../quizzes/quiz.queries.js';
import { sessionRepository } from './session.repository.js';
import { assertSessionAction, assertSessionHost, requireSession } from './session.policy.js';
import type { SessionSnapshots } from './session.snapshot.js';
import type { SessionAction } from './session.types.js';

export function createSessionService(pool: Pool, quizzes: QuizQueries, snapshots: SessionSnapshots) {
  return {
    host(actor: TeacherActor, quizId: string) {
      return transaction(pool, async db => {
        // Lock the quiz to serialize hosting with edits/deletes.
        const quiz = await quizzes.owned(db, actor, quizId, true);
        if (quiz.status !== 'PUBLISHED') throw new ApiError('CONFLICT', { message: 'Xuất bản đề trước khi mở phòng.' });
        await quizzes.validatePublish(db, quizId);
        const repo = sessionRepository(db);
        for (let attempt = 0; attempt < 10; attempt++) {
          const pin = randomInt(0, 1000000).toString().padStart(6, '0');
          const id = await repo.tryCreate(quizId, actor.id, pin);
          if (!id) continue;
          await repo.configureDemo(id);
          return snapshots.teacher(db, actor, requireSession(await repo.findById(id)));
        }
        throw new ApiError('CONFLICT', { message: 'Chưa tạo được PIN; hãy thử lại.' });
      });
    },
    snapshot(actor: TeacherActor, sessionId: string) {
      return transaction(pool, async db => {
        const session = requireSession(await sessionRepository(db).findById(sessionId, true));
        return snapshots.teacher(db, actor, session);
      });
    },
    action(actor: TeacherActor, sessionId: string, action: SessionAction, expectedVersion: number) {
      return transaction(pool, async db => {
        const repo = sessionRepository(db);
        // All session commands, joins and answers serialize on this session row.
        const session = requireSession(await repo.findById(sessionId, true));
        assertSessionHost(session, actor);
        const total = await repo.totalQuestions(session.quiz_id);
        assertSessionAction(session, action, expectedVersion, total);
        const answers = answerRepository(db);
        const participants = participantRepository(db);
        if (action === 'start') {
          await quizzes.validatePublish(db, session.quiz_id);
          await repo.configureDemo(sessionId);
          await repo.start(sessionId);
          await answers.createAttempts(sessionId, total);
          await participants.markPlaying(sessionId);
        } else if (action === 'next') {
          await repo.next(sessionId);
        } else {
          await repo.finish(sessionId);
          await answers.finishAttempts(sessionId);
          await participants.markCompleted(sessionId);
        }
        return snapshots.teacher(db, actor, requireSession(await repo.findById(sessionId)));
      });
    },
  };
}
export type SessionService = ReturnType<typeof createSessionService>;
