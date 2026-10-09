import type { Pool } from 'pg';
import type { QuizInput, TeacherActor } from '@qforge/shared';
import { transaction } from '../../config/db.js';
import { quizRepository } from './quiz.repository.js';
import { assertQuizEditable } from './quiz.policy.js';
import type { QuizQueries } from './quiz.queries.js';

export function createQuizService(pool: Pool, queries: QuizQueries) {
  return {
    get(actor: TeacherActor, id: string) {
      return queries.get(pool, actor, id);
    },
    save(actor: TeacherActor, input: QuizInput, id?: string) {
      return transaction(pool, async db => {
        const repo = quizRepository(db);
        let quizId: string;
        if (id) {
          await queries.owned(db, actor, id, true);
          assertQuizEditable(await repo.hasSessions(id));
          await repo.update(id, input);
          quizId = id;
        } else {
          quizId = await repo.create(actor.id, input);
        }
        await repo.insertQuestions(quizId, input.questions);
        return queries.get(db, actor, quizId);
      });
    },
    publish(actor: TeacherActor, id: string) {
      return transaction(pool, async db => {
        await queries.owned(db, actor, id, true);
        await queries.validatePublish(db, id);
        await quizRepository(db).publish(id);
        return queries.get(db, actor, id);
      });
    },
    delete(actor: TeacherActor, id: string) {
      return transaction(pool, async db => {
        await queries.owned(db, actor, id, true);
        const repo = quizRepository(db);
        assertQuizEditable(await repo.hasSessions(id));
        await repo.delete(id);
        return { deleted: true };
      });
    },
  };
}
export type QuizService = ReturnType<typeof createQuizService>;
