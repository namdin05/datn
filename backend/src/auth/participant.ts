import { createHmac } from 'node:crypto';
import type { Database } from '../common/database.js';
import type { ParticipantCredentials } from '../modules/participants/participant-credentials.js';
import { participantRepository } from '../modules/participants/participant.repository.js';
import { ApiError } from '../common/api-error.js';

export class ParticipantTokens implements ParticipantCredentials {
  constructor(private readonly secret: string, readonly ttlSeconds: number) {}
  hash(token: string) { return createHmac('sha256', this.secret).update(`credential:${token}`).digest('hex'); }
  requestHash(requestId: string) { return createHmac('sha256', this.secret).update(`join-request:${requestId}`).digest('hex'); }
  // A random UUID requestId is a private idempotency key. Deriving the token allows a
  // lost join response to be retried without storing raw credentials in the DB.
  issue(sessionId: string, requestId: string) { return createHmac('sha256', this.secret).update(`participant:${sessionId}:${requestId}`).digest('base64url'); }
  async resolve(db: Database, sessionId: string, token: string) {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new ApiError('UNAUTHORIZED');
    const row = await participantRepository(db).findByCredential(sessionId, this.hash(token));
    if (!row) throw new ApiError('UNAUTHORIZED', { message: 'Phiên tham gia không hợp lệ hoặc đã hết hạn.' });
    return row;
  }
}
