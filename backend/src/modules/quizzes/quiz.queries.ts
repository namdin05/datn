import type { TeacherActor } from '@qforge/shared';
import type { Database } from '../../common/database.js';
import { quizRepository } from './quiz.repository.js';
import { assertPublishable, assertQuizOwner } from './quiz.policy.js';
import { toTeacherQuiz } from './quiz.mapper.js';

// Transaction-aware operations shared by quiz, session and report use cases.
// They use the caller's connection and never open a nested transaction.
export const quizQueries = {
  async owned(db: Database, actor: TeacherActor, id: string, lock = false) {
    const quiz = await quizRepository(db).findById(id, lock);
    assertQuizOwner(quiz, actor);
    return quiz;
  },
  async get(db: Database, actor: TeacherActor, id: string) {
    const quiz = await this.owned(db, actor, id);
    return toTeacherQuiz(quiz, await quizRepository(db).questions(id));
  },
  async validatePublish(db: Database, id: string) {
    assertPublishable(await quizRepository(db).questions(id));
  },
};
export type QuizQueries = typeof quizQueries;
