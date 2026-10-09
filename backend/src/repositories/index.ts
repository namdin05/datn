import type { Pool, PoolClient } from 'pg';
import { userRepository } from '../modules/identity/user.repository.js';
import { quizRepository } from '../modules/quizzes/quiz.repository.js';

// Compatibility API for existing S04 migration/seed scripts. Runtime features use
// their own typed repositories; do not add application use cases to this adapter.
type Db = Pool | PoolClient;
import { apiStatus } from '../modules/sessions/session.mapper.js';
export { apiStatus } from '../modules/sessions/session.mapper.js';

export function repositories(db: Db) {
  return {
    users: {
      findById: userRepository(db).findById,
      findTeacher: userRepository(db).findDemoTeacher,
    },
    quizzes: {
      async listByCreator(id: string) { return (await db.query('SELECT id, creator_id, title, description, status FROM public.quizzes WHERE creator_id=$1 ORDER BY created_at DESC, id', [id])).rows; },
      async findById(id: string) { return (await db.query('SELECT id, creator_id, title, description, status FROM public.quizzes WHERE id=$1', [id])).rows[0] ?? null; },
      async createDraft(creatorId: string, title: string, description: string | null = null) { return (await db.query("INSERT INTO public.quizzes(creator_id,title,description) VALUES($1,$2,$3) RETURNING id,creator_id,title,description,status", [creatorId, title, description])).rows[0]; },
      questions: quizRepository(db).questions,
    },
    sessions: {
      async findById(id: string) {
        const row = (await db.query('SELECT id,quiz_id,host_id,pin,status FROM public.sessions WHERE id=$1', [id])).rows[0];
        return row ? { ...row, status: apiStatus(row.status) } : null;
      },
      async findActiveByPin(pin: string) {
        const row = (await db.query("SELECT id,quiz_id,host_id,pin,status FROM public.sessions WHERE pin=$1 AND status IN ('WAITING','IN_PROGRESS')", [pin])).rows[0];
        return row ? { ...row, status: apiStatus(row.status) } : null;
      },
      async participants(id: string) { return (await db.query('SELECT id,nickname,status FROM public.participants WHERE session_id=$1 ORDER BY joined_at,id', [id])).rows; },
    },
  };
}
