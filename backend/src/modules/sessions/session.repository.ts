import type { Database } from '../../common/database.js';
import type { SessionRow } from './session.types.js';

export function sessionRepository(db: Database) {
  return {
    async findById(id: string, lock = false) {
      return (await db.query<SessionRow>(
        `SELECT s.*,q.title FROM public.sessions s JOIN public.quizzes q ON q.id=s.quiz_id WHERE s.id=$1${lock ? ' FOR UPDATE OF s' : ''}`, [id],
      )).rows[0];
    },
    async findOpenByPin(pin: string) {
      return (await db.query<{ id: string }>("SELECT id FROM public.sessions WHERE pin=$1 AND status IN ('WAITING','IN_PROGRESS') FOR UPDATE", [pin])).rows[0];
    },
    async totalQuestions(quizId: string) {
      return Number((await db.query<{ n: number }>('SELECT count(*)::int AS n FROM public.questions WHERE quiz_id=$1', [quizId])).rows[0]!.n);
    },
    // Savepoints are part of this caller-owned transaction. Retry only a PIN collision;
    // unrelated constraint or infrastructure failures must propagate and roll back.
    async tryCreate(quizId: string, hostId: string, pin: string) {
      await db.query('SAVEPOINT pin_attempt');
      try {
        const row = (await db.query<{ id: string }>('INSERT INTO public.sessions(quiz_id,host_id,pin) VALUES($1,$2,$3) RETURNING id', [quizId, hostId, pin])).rows[0]!;
        await db.query('RELEASE SAVEPOINT pin_attempt');
        return row.id;
      } catch (error) {
        await db.query('ROLLBACK TO SAVEPOINT pin_attempt');
        const failure = error as { code?: string; constraint?: string };
        if (failure.code !== '23505' || failure.constraint !== 'uq_sessions_active_pin') throw error;
        return null;
      }
    },
    async configureDemo(id: string) {
      await db.query(`INSERT INTO public.session_settings(session_id,timer_mode,shuffle_questions,shuffle_answers,show_leaderboard,allow_skip_questions,participant_attempt_limit)
        VALUES($1,'OFF',false,false,false,true,1) ON CONFLICT(session_id) DO UPDATE SET timer_mode='OFF',shuffle_questions=false,shuffle_answers=false,show_leaderboard=false,allow_skip_questions=true,participant_attempt_limit=1`, [id]);
    },
    async start(id: string) {
      await db.query("UPDATE public.sessions SET status='IN_PROGRESS',started_at=now(),current_question_position=1,state_version=state_version+1 WHERE id=$1", [id]);
    },
    async next(id: string) {
      await db.query('UPDATE public.sessions SET current_question_position=current_question_position+1,state_version=state_version+1 WHERE id=$1', [id]);
    },
    async finish(id: string) {
      await db.query("UPDATE public.sessions SET status='FINISHED',ended_at=now(),state_version=state_version+1 WHERE id=$1", [id]);
    },
  };
}
