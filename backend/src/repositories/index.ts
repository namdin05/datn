import type { Pool, PoolClient } from 'pg';

// Nhận cả pool và client transaction; service chịu trách nhiệm quyền và rule demo.
type Db = Pool | PoolClient;
export const apiStatus = (status: string) => status === 'IN_PROGRESS' ? 'ACTIVE' : status;

export function repositories(db: Db) {
  return {
    users: {
      async findById(id: string) { return (await db.query('SELECT id, display_name, role FROM public.users WHERE id=$1', [id])).rows[0] ?? null; },
      async findTeacher() { return (await db.query("SELECT id, display_name, role FROM public.users WHERE role='TEACHER' ORDER BY created_at, id LIMIT 1")).rows[0] ?? null; },
    },
    quizzes: {
      async listByCreator(id: string) { return (await db.query('SELECT id, creator_id, title, description, status FROM public.quizzes WHERE creator_id=$1 ORDER BY created_at DESC, id', [id])).rows; },
      async findById(id: string) { return (await db.query('SELECT id, creator_id, title, description, status FROM public.quizzes WHERE id=$1', [id])).rows[0] ?? null; },
      async createDraft(creatorId: string, title: string, description: string | null = null) { return (await db.query("INSERT INTO public.quizzes(creator_id,title,description) VALUES($1,$2,$3) RETURNING id,creator_id,title,description,status", [creatorId, title, description])).rows[0]; },
      async questions(id: string) {
        return (await db.query(`SELECT q.id,q.content,q.position,q.points,
          COALESCE(jsonb_agg(jsonb_build_object('id',o.id,'content',o.content,'position',o.position,'is_correct',o.is_correct) ORDER BY o.position) FILTER(WHERE o.id IS NOT NULL),'[]') AS options
          FROM public.questions q LEFT JOIN public.question_options o ON o.question_id=q.id
          WHERE q.quiz_id=$1 GROUP BY q.id ORDER BY q.position`, [id])).rows;
      },
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
