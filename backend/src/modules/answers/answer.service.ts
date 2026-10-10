import type { Pool } from 'pg';
import { ApiError } from '../../common/api-error.js';
import { transaction } from '../../config/db.js';
import type { ParticipantCredentials } from '../participants/participant-credentials.js';
import { requireParticipantCredentials } from '../participants/participant-credentials.js';
import { sessionRepository } from '../sessions/session.repository.js';
import { requireSession } from '../sessions/session.policy.js';
import type { SessionSnapshots } from '../sessions/session.snapshot.js';
import type { SessionEvents } from '../session-events.js';
import { answerRepository } from './answer.repository.js';

export function createAnswerService(pool: Pool, snapshots: SessionSnapshots, events: SessionEvents, credentials?: ParticipantCredentials) {
  return {
    async submit(sessionId: string, token: string, questionId: string, optionId: string) {
      let recorded = false;
      const snapshot = await transaction(pool, async db => {
        const session = requireSession(await sessionRepository(db).findById(sessionId, true));
        const participant = await requireParticipantCredentials(credentials).resolve(db, sessionId, token);
        const repo = answerRepository(db);
        const attempt = await repo.attempt(participant.id);
        if (!attempt) throw new ApiError('CONFLICT');
        // A matching retry remains accepted after next/finish. Check it before
        // the current-question rule and never award the score a second time.
        const existing = await repo.existingOption(attempt.id, questionId);
        if (existing) {
          if (existing.option_id !== optionId) throw new ApiError('CONFLICT', { message: 'Câu này đã được trả lời và không thể đổi lựa chọn.' });
          return snapshots.participant(db, session, participant);
        }
        const option = await repo.activeOption(optionId, questionId, session.quiz_id, session.current_question_position);
        if (session.status !== 'IN_PROGRESS' || session.live_phase !== 'QUESTION' || !option) {
          throw new ApiError('CONFLICT', { message: 'Câu hỏi hoặc lựa chọn không thuộc câu đang mở.' });
        }
        const score = option.is_correct ? 100 : 0;
        await repo.insert(attempt.id, questionId, optionId, option.is_correct, score);
        recorded = true;
        return snapshots.participant(db, session, participant);
      });
      // Only the host's live ranking changes; Students are not notified per answer.
      if (recorded) events.publish({ sessionId, reason: 'answer', stateVersion: null });
      return snapshot;
    },
  };
}
export type AnswerService = ReturnType<typeof createAnswerService>;
