import { calculateResult } from '@qforge/shared';
import type { ParticipantSnapshot, TeacherActor, teacherSnapshotSchema } from '@qforge/shared';
import type { z } from 'zod';
import type { Database } from '../../common/database.js';
import { answerRepository } from '../answers/answer.repository.js';
import { sessionRepository } from './session.repository.js';
import { snapshotRepository } from './session.snapshot.repository.js';
import { assertSessionHost } from './session.policy.js';
import type { SessionRow } from './session.types.js';

type TeacherSnapshot = z.infer<typeof teacherSnapshotSchema>;
async function base(db: Database, session: SessionRow) {
  return {
    sessionId: session.id, title: session.title, pin: session.pin,
    status: (session.status === 'IN_PROGRESS' ? 'ACTIVE' : session.status) as ParticipantSnapshot['status'],
    stateVersion: session.state_version, currentPosition: session.current_question_position,
    totalQuestions: await sessionRepository(db).totalQuestions(session.quiz_id),
  };
}

// Read model shared by REST and future socket commands. The caller passes the
// same transaction client used for the write, so the returned state is coherent.
export const sessionSnapshots = {
  async participant(db: Database, session: SessionRow, participant: { id: string; nickname: string }): Promise<ParticipantSnapshot> {
    const state = await base(db, session);
    const attempt = await answerRepository(db).attempt(participant.id);
    const repo = snapshotRepository(db);
    let currentQuestion: ParticipantSnapshot['currentQuestion'] = null;
    let hasAnsweredCurrentQuestion = false;
    if (session.status === 'IN_PROGRESS' && session.current_question_position) {
      currentQuestion = await repo.question(session.quiz_id, session.current_question_position);
      if (!currentQuestion) throw new Error('CURRENT_QUESTION_MISSING');
      hasAnsweredCurrentQuestion = !!attempt && await repo.hasAnswered(attempt.id, currentQuestion.id);
    }
    return {
      ...state, participant: { id: participant.id, nickname: participant.nickname }, currentQuestion, hasAnsweredCurrentQuestion,
      result: session.status === 'FINISHED' && attempt ? calculateResult(attempt.total_questions, attempt.correct_count, attempt.incorrect_count) : null,
    };
  },
  async teacher(db: Database, actor: TeacherActor, session: SessionRow): Promise<TeacherSnapshot> {
    assertSessionHost(session, actor);
    const state = await base(db, session);
    const participants = await snapshotRepository(db).participantProgress(session.id, session.current_question_position);
    return {
      ...state,
      participants: participants.map(participant => ({
        id: participant.id, nickname: participant.nickname, hasAnsweredCurrentQuestion: participant.answered,
        result: session.status === 'FINISHED' && participant.total_questions !== null
          ? calculateResult(participant.total_questions, participant.correct_count, participant.incorrect_count) : null,
      })),
    };
  },
};
export type SessionSnapshots = typeof sessionSnapshots;
