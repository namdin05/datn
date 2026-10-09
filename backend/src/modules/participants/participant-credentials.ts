import { ApiError } from '../../common/api-error.js';
import type { Database } from '../../common/database.js';
import type { ParticipantRow } from './participant.repository.js';

// Transport-independent port, implemented by the HMAC credential adapter.
export interface ParticipantCredentials {
  readonly ttlSeconds: number;
  hash(token: string): string;
  requestHash(requestId: string): string;
  issue(sessionId: string, requestId: string): string;
  resolve(db: Database, sessionId: string, token: string): Promise<ParticipantRow>;
}
export function requireParticipantCredentials(credentials?: ParticipantCredentials): ParticipantCredentials {
  if (!credentials) throw new ApiError('DB_UNAVAILABLE', { message: 'Token người tham gia chưa được cấu hình.' });
  return credentials;
}
