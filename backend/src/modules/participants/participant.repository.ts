import type { Database } from '../../common/database.js';

export interface ParticipantRow {
  id: string;
  nickname: string;
  token_expires_at: Date;
}
export function participantRepository(db: Database) {
  return {
    async findByRequest(sessionId: string, requestHash: string) {
      return (await db.query<ParticipantRow>('SELECT id,nickname,token_expires_at FROM public.participants WHERE session_id=$1 AND join_request_hash=$2', [sessionId, requestHash])).rows[0];
    },
    async findByCredential(sessionId: string, tokenHash: string) {
      return (await db.query<ParticipantRow>(`SELECT id,nickname,token_expires_at FROM public.participants
        WHERE session_id=$1 AND token_hash=$2 AND token_expires_at>now()`, [sessionId, tokenHash])).rows[0];
    },
    async create(sessionId: string, nickname: string, tokenHash: string, ttlSeconds: number, requestHash: string) {
      return (await db.query<ParticipantRow>(`INSERT INTO public.participants(session_id,nickname,token_hash,token_expires_at,join_request_hash)
        VALUES($1,$2,$3,now()+make_interval(secs=>$4),$5) RETURNING id,nickname,token_expires_at`, [sessionId, nickname, tokenHash, ttlSeconds, requestHash])).rows[0]!;
    },
    async revoke(id: string) {
      await db.query('UPDATE public.participants SET token_expires_at=now() WHERE id=$1', [id]);
    },
    async markPlaying(sessionId: string) {
      await db.query("UPDATE public.participants SET status='PLAYING' WHERE session_id=$1", [sessionId]);
    },
    async markCompleted(sessionId: string) {
      await db.query("UPDATE public.participants SET status='COMPLETED',completed_at=now() WHERE session_id=$1", [sessionId]);
    },
  };
}
