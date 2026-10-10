import type { Pool } from 'pg';
import type { ParticipantCredential, joinInputSchema } from '@qforge/shared';
import type { z } from 'zod';
import { ApiError } from '../../common/api-error.js';
import { transaction } from '../../config/db.js';
import { sessionRepository } from '../sessions/session.repository.js';
import { requireSession } from '../sessions/session.policy.js';
import type { SessionSnapshots } from '../sessions/session.snapshot.js';
import type { SessionEvents } from '../session-events.js';
import { participantRepository } from './participant.repository.js';
import { requireParticipantCredentials } from './participant-credentials.js';
import type { ParticipantCredentials } from './participant-credentials.js';

export function createParticipantService(pool: Pool, snapshots: SessionSnapshots, events: SessionEvents, credentials?: ParticipantCredentials) {
  return {
    async join(input: z.infer<typeof joinInputSchema>): Promise<ParticipantCredential> {
      const auth = requireParticipantCredentials(credentials);
      const joined = await transaction(pool, async db => {
        const sessions = sessionRepository(db);
        const open = await sessions.findOpenByPin(input.pin);
        if (!open) throw new ApiError('NOT_FOUND', { message: 'Không tìm thấy phòng đang mở.' });
        const session = requireSession(await sessions.findById(open.id));
        const repo = participantRepository(db);
        const requestHash = auth.requestHash(input.requestId);
        let participant = await repo.findByRequest(session.id, requestHash);
        const token = auth.issue(session.id, input.requestId);
        if (participant) {
          if (participant.nickname !== input.nickname || participant.token_expires_at <= new Date()) {
            throw new ApiError('CONFLICT', { message: 'Yêu cầu tham gia cũ đã hết hạn hoặc khác tên.' });
          }
        } else {
          if (session.status !== 'WAITING') throw new ApiError('CONFLICT', { message: 'Phòng đã bắt đầu; chỉ người đã tham gia được tiếp tục.' });
          participant = await repo.create(session.id, input.nickname, auth.hash(token), auth.ttlSeconds, requestHash);
        }
        return { sessionId: session.id, participantId: participant.id, token, expiresAt: participant.token_expires_at.toISOString() };
      });
      events.publish({ sessionId: joined.sessionId, reason: 'roster', stateVersion: null });
      return joined;
    },
    snapshot(sessionId: string, token: string) {
      return transaction(pool, async db => {
        const session = requireSession(await sessionRepository(db).findById(sessionId, true));
        const participant = await requireParticipantCredentials(credentials).resolve(db, sessionId, token);
        return snapshots.participant(db, session, participant);
      });
    },
    async revoke(sessionId: string, token: string) {
      const participant = await requireParticipantCredentials(credentials).resolve(pool, sessionId, token);
      await participantRepository(pool).revoke(participant.id);
      events.publish({ sessionId, reason: 'revoked', participantId: participant.id });
      return { revoked: true };
    },
  };
}
export type ParticipantService = ReturnType<typeof createParticipantService>;
